import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  composePracticeQuestion,
  countGiveawayAbsoluteDistractors,
  loadEffectiveQuestions
} from './hard-distractor-lib.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const readJson=async p=>JSON.parse(await readFile(path.join(dataDir,String(p).replace(/^data\//,'')),'utf8'));
const normalize=value=>String(value??'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim().replace(/\s+/g,' ').toLocaleLowerCase('ca');

export async function runStandardDistractorAudit(){
  const {course,questionsByBlock}=await loadEffectiveQuestions();
  const errors=[];
  let questions=0;
  let languageCases=0;

  for(const block of course.blocks||[]){
    const hard=await readJson(block.hardDistractorFile);
    const bundle=questionsByBlock.get(block.id);
    for(const q of bundle?.questions||[]){
      questions++;
      const record=hard.questions?.[q.id];
      if(!record){errors.push(`${q.id}: hard record absent`);continue;}
      let composed;
      try{composed=composePracticeQuestion(q,record,()=>0);}
      catch(error){errors.push(`${q.id}: ${error.message}`);continue;}

      if(composed.correct!==q.correct)errors.push(`${q.id}: correct index changed`);
      if(composed.options[q.correct]!==q.options[q.correct])errors.push(`${q.id}: CA correct answer changed`);
      if(composed.translations?.es?.options?.[q.correct]!==q.translations?.es?.options?.[q.correct])errors.push(`${q.id}: ES correct answer changed`);

      for(const lang of ['ca','es']){
        languageCases++;
        const source=lang==='ca'?q.options:q.translations?.es?.options;
        const shown=lang==='ca'?composed.options:composed.translations?.es?.options;
        const hardValues=record[lang]||[];
        if(!Array.isArray(source)||!Array.isArray(shown)||shown.length!==4){errors.push(`${q.id}: ${lang} invalid option arrays`);continue;}
        if(new Set(shown.map(normalize)).size!==4)errors.push(`${q.id}: ${lang} duplicate composed options`);
        const wrong=shown.filter((_,i)=>i!==q.correct);
        const sourceWrong=new Set(source.filter((_,i)=>i!==q.correct).map(normalize));
        const hardSet=new Set(hardValues.map(normalize));
        const novel=wrong.filter(v=>!sourceWrong.has(normalize(v)));
        const hardNovelCount=novel.filter(v=>hardSet.has(normalize(v))).length;
        const originalWrongCount=wrong.filter(v=>sourceWrong.has(normalize(v))).length;
        if(novel.length!==2)errors.push(`${q.id}: ${lang} novel distractors ${novel.length}/2`);
        if(hardNovelCount!==2)errors.push(`${q.id}: ${lang} novel hard distractors ${hardNovelCount}/2`);
        if(originalWrongCount!==1)errors.push(`${q.id}: ${lang} original distractors ${originalWrongCount}/1`);
        if(countGiveawayAbsoluteDistractors(wrong,lang)>1)errors.push(`${q.id}: ${lang} too many giveaway absolutes in standard mode`);
      }
    }
  }

  return {questions,languageCases,errors};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const result=await runStandardDistractorAudit();
  if(result.errors.length){
    console.error(result.errors.join('\n'));
    process.exit(1);
  }
  console.log('STANDARD_DISTRACTOR_AUDIT=PASS');
  console.log(`QUESTIONS=${result.questions}`);
  console.log(`LANGUAGE_CASES=${result.languageCases}`);
}
