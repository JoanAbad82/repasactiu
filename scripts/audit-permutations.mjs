import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shuffleQuestionOptions } from '../site/js/quiz-engine.js';
import { composeHardQuestion } from '../site/js/hard-distractors.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');

const readJson=async file=>JSON.parse(await readFile(path.join(dataDir,file.replace(/^data\//,'')),'utf8'));

export function generatePermutations(items){
  if(items.length<=1)return [items.slice()];
  const result=[];
  for(let i=0;i<items.length;i++){
    const head=items[i];
    const rest=[...items.slice(0,i),...items.slice(i+1)];
    for(const tail of generatePermutations(rest))result.push([head,...tail]);
  }
  return result;
}

function allFisherYatesPaths(){
  const paths=[];
  for(let j3=0;j3<4;j3++)for(let j2=0;j2<3;j2++)for(let j1=0;j1<2;j1++){
    paths.push([
      (j3+0.25)/4,
      (j2+0.25)/3,
      (j1+0.25)/2
    ]);
  }
  return paths;
}

function rngFrom(values){
  let index=0;
  return ()=>{
    if(index>=values.length)throw new Error('Permutation audit RNG exhausted unexpectedly');
    return values[index++];
  };
}

async function loadEffectiveQuestions(){
  const course=await readJson('course.json');
  const corrections=await readJson('content_corrections.json');
  const questions=[];
  const translations=new Map();
  const hardById=new Map();

  for(const block of course.blocks){
    const bankFiles=[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
    for(const file of bankFiles){
      const bank=await readJson(file);
      questions.push(...bank.questions);
    }

    const translationFiles=[block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean);
    for(const file of translationFiles){
      const translated=await readJson(file);
      for(const [id,value] of Object.entries(translated.questions||{})){
        if(translations.has(id))throw new Error(`Duplicate Spanish translation for ${id}`);
        translations.set(id,value);
      }
    }

    if(!block.hardDistractorFile)throw new Error(`${block.id}: hardDistractorFile absent`);
    const hard=await readJson(block.hardDistractorFile);
    if(hard.blockId!==block.id||!hard.questions||Array.isArray(hard.questions)){
      throw new Error(`${block.id}: invalid hard distractor overlay`);
    }
    for(const [id,value] of Object.entries(hard.questions)){
      if(hardById.has(id))throw new Error(`Duplicate hard distractor record for ${id}`);
      hardById.set(id,value);
    }
  }

  const effectiveQuestions=questions.map(q=>{
    const correction=corrections.questions?.[q.id];
    return correction?{...q,...(correction.canonical||{}),id:q.id,block:q.block,correct:q.correct}:q;
  });
  for(const [id,translation] of translations){
    const correction=corrections.questions?.[id];
    if(correction?.es)translations.set(id,{...translation,...correction.es});
  }
  return {questions:effectiveQuestions,translations,hardById};
}

function auditRepresentation(question,paths,label,errors){
  const caOptions=question.options;
  const esOptions=question.translations?.es?.options;
  if(!Array.isArray(caOptions)||caOptions.length!==4){
    errors.push(`${question.id}: ${label} CA options != 4`);
    return 0;
  }
  if(!Array.isArray(esOptions)||esOptions.length!==4){
    errors.push(`${question.id}: ${label} ES options != 4`);
    return 0;
  }

  const canonicalCorrect=caOptions[question.correct];
  const spanishCorrect=esOptions[question.correct];
  const producedOrders=new Set();
  let cases=0;

  for(const values of paths){
    const shuffled=shuffleQuestionOptions(question,rngFrom(values));
    const order=shuffled.options.map(text=>caOptions.indexOf(text));
    producedOrders.add(order.join(','));

    cases++;
    if(shuffled.options[shuffled.correct]!==canonicalCorrect)errors.push(`${question.id}: ${label} CA correct answer moved incorrectly in ${order.join('')}`);
    if(new Set(shuffled.options).size!==4||shuffled.options.some(v=>!caOptions.includes(v)))errors.push(`${question.id}: ${label} CA option loss/duplication in ${order.join('')}`);

    cases++;
    const shuffledEs=shuffled.translations?.es?.options;
    if(!Array.isArray(shuffledEs)||shuffledEs[shuffled.correct]!==spanishCorrect)errors.push(`${question.id}: ${label} ES correct answer moved incorrectly in ${order.join('')}`);
    if(!Array.isArray(shuffledEs)||new Set(shuffledEs).size!==4||shuffledEs.some(v=>!esOptions.includes(v)))errors.push(`${question.id}: ${label} ES option loss/duplication in ${order.join('')}`);
  }

  if(producedOrders.size!==24)errors.push(`${question.id}: ${label} shuffle engine produced ${producedOrders.size}/24 distinct permutations`);
  return cases;
}

export async function runPermutationAudit(){
  const {questions,translations,hardById}=await loadEffectiveQuestions();
  const paths=allFisherYatesPaths();
  const errors=[];
  let practiceCases=0;
  let hardCases=0;

  for(const q of questions){
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3){
      errors.push(`${q.id}: invalid correct index`);
      continue;
    }
    const es=translations.get(q.id);
    if(!es){
      errors.push(`${q.id}: Spanish translation absent`);
      continue;
    }

    const practice={...q,translations:{...(q.translations||{}),es}};
    practiceCases+=auditRepresentation(practice,paths,'practice',errors);

    const hardRecord=hardById.get(q.id);
    if(!hardRecord){
      errors.push(`${q.id}: hard distractor record absent`);
      continue;
    }
    try{
      const hard=composeHardQuestion(practice,hardRecord);
      hardCases+=auditRepresentation(hard,paths,'hard',errors);
    }catch(error){
      errors.push(`${q.id}: hard composition failed: ${error.message}`);
    }
  }

  const expectedPerRepresentation=questions.length*paths.length*2;
  if(practiceCases!==expectedPerRepresentation)errors.push(`practice permutation case mismatch: ${practiceCases}/${expectedPerRepresentation}`);
  if(hardCases!==expectedPerRepresentation)errors.push(`hard permutation case mismatch: ${hardCases}/${expectedPerRepresentation}`);

  return {
    questions:questions.length,
    permutationsPerQuestion:paths.length,
    languages:2,
    practiceCases,
    hardCases,
    cases:practiceCases+hardCases,
    errors
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runPermutationAudit();
  if(result.errors.length){
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log('PERMUTATION_AUDIT=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`PERMUTATIONS_PER_QUESTION=${result.permutationsPerQuestion}`);
  console.log(`LANGUAGES=${result.languages}`);
  console.log(`PRACTICE_PERMUTATION_CASES=${result.practiceCases}`);
  console.log(`HARD_PERMUTATION_CASES=${result.hardCases}`);
  console.log(`TOTAL_PERMUTATION_CASES=${result.cases}`);
  console.log(`CASES=${result.cases}`);
}
