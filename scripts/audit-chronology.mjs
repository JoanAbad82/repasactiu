import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chronologyInversions,chronologyKey,sortChronologically} from '../site/js/chronology.js';
import {buildCoreStudyCards,buildExtraStudyCards,buildOrderedStudyCards} from '../site/js/study-cards.js';
import {loadEffectiveQuestions} from './hard-distractor-lib.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const readJson=async rel=>JSON.parse(await readFile(path.join(dataDir,String(rel).replace(/^data\//,'')),'utf8'));

function questionSourceRef(question,blockId,traceability){
  const exact=traceability.questionRanges?.[question.id];
  if(exact?.source&&Array.isArray(exact.pageRange)){
    return {id:exact.source,pageRange:exact.pageRange,precision:'question'};
  }
  const range=traceability.topicRanges?.[blockId]?.[question.topic];
  const source=traceability.blockSources?.[blockId];
  if(source&&Array.isArray(range)){
    return {id:source,pageRange:range,precision:'section'};
  }
  return null;
}

function chronologicalQuestion(question,blockId,traceability){
  const sourceRef=questionSourceRef(question,blockId,traceability);
  if(!sourceRef)return null;
  return {
    id:question.id,
    blockId,
    topic:question.topic,
    conceptId:question.topic,
    chronologyConcept:question.topic,
    sourceRef
  };
}

export async function runChronologyAudit(){
  const [{course,questionsByBlock},traceability,extraRaw,semantic]=await Promise.all([
    loadEffectiveQuestions(),
    readJson('study-cards-traceability-v2.json'),
    readJson('study-cards-extra.json'),
    readJson('study-cards-semantic-v2.json')
  ]);
  const errors=[];
  const allQuestions=[];
  let exactQuestions=0;
  let sectionQuestions=0;

  for(const meta of course.blocks||[]){
    const bundle=questionsByBlock.get(meta.id);
    const items=[];
    for(const question of bundle?.questions||[]){
      const item=chronologicalQuestion(question,meta.id,traceability);
      if(!item){
        errors.push(`${question.id}: falta traça cronològica source → pageRange → concept`);
        continue;
      }
      try{chronologyKey(item);}catch(error){errors.push(error.message);continue;}
      if(item.sourceRef.precision==='question')exactQuestions++;
      else sectionQuestions++;
      items.push(item);
      allQuestions.push(item);
    }
    for(const inversion of chronologyInversions(items)){
      errors.push(`${meta.id}: inversió cronològica ${inversion.previous} → ${inversion.current}`);
    }
  }

  for(const inversion of chronologyInversions(allQuestions)){
    errors.push(`global questions: inversió cronològica ${inversion.previous} → ${inversion.current}`);
  }

  const banks=(course.blocks||[]).map(meta=>{
    const bundle=questionsByBlock.get(meta.id);
    return {
      ...bundle,
      blockId:meta.id,
      unitId:meta.unitId,
      unitTitle:meta.unitTitle,
      unitTitleEs:meta.unitTitleEs,
      blockNumber:meta.blockNumber,
      blockTitle:meta.title,
      blockTitleEs:meta.titleEs
    };
  });
  const extraBank={...extraRaw,semanticV2:semantic,traceabilityV2:traceability};

  const coreCards=buildCoreStudyCards(banks,'ca',extraRaw.coreOverrides||{},semantic,traceability);
  const extraCards=buildExtraStudyCards(extraBank,'ca');
  const orderedCards=buildOrderedStudyCards(banks,extraBank,'ca');

  for(const card of [...coreCards,...extraCards]){
    try{chronologyKey(card);}catch(error){errors.push(error.message);}
  }
  for(const inversion of chronologyInversions(coreCards)){
    errors.push(`core cards: inversió cronològica ${inversion.previous} → ${inversion.current}`);
  }
  for(const inversion of chronologyInversions(extraCards)){
    errors.push(`extra cards: inversió cronològica ${inversion.previous} → ${inversion.current}`);
  }
  for(const inversion of chronologyInversions(orderedCards)){
    errors.push(`published cards: inversió cronològica ${inversion.previous} → ${inversion.current}`);
  }

  const expectedIds=new Set([...coreCards,...extraCards].map(card=>card.id));
  const orderedIds=new Set(orderedCards.map(card=>card.id));
  if(expectedIds.size!==926||orderedIds.size!==926||orderedCards.length!==926){
    errors.push(`study cards: recompte cronològic invàlid ${orderedCards.length}/926`);
  }
  for(const id of expectedIds)if(!orderedIds.has(id))errors.push(`study cards: falta ${id} després d'ordenar`);

  const sortedQuestionIds=sortChronologically(allQuestions).map(item=>item.id);
  if(sortedQuestionIds.some((id,index)=>id!==allQuestions[index]?.id)){
    errors.push('questions: l’ordre físic publicat no coincideix amb source → page → concept');
  }

  return {
    questions:allQuestions.length,
    exactQuestions,
    sectionQuestions,
    coreCards:coreCards.length,
    extraCards:extraCards.length,
    totalCards:orderedCards.length,
    errors
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runChronologyAudit();
  if(result.errors.length){
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log('CHRONOLOGY_AUDIT=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`QUESTION_TRACE_EXACT=${result.exactQuestions}`);
  console.log(`QUESTION_TRACE_SECTION=${result.sectionQuestions}`);
  console.log(`CORE_CARDS=${result.coreCards}`);
  console.log(`EXTRA_CARDS=${result.extraCards}`);
  console.log(`TOTAL_CARDS=${result.totalCards}`);
}
