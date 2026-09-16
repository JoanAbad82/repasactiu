import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shuffleQuestionOptions } from '../site/js/quiz-engine.js';

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
  }

  const effectiveQuestions=questions.map(q=>{
    const correction=corrections.questions?.[q.id];
    return correction?{...q,...(correction.canonical||{}),id:q.id,block:q.block,correct:q.correct}:q;
  });
  for(const [id,translation] of translations){
    const correction=corrections.questions?.[id];
    if(correction?.es)translations.set(id,{...translation,...correction.es});
  }
  return {questions:effectiveQuestions,translations};
}

export async function runPermutationAudit(){
  const {questions,translations}=await loadEffectiveQuestions();
  const paths=allFisherYatesPaths();
  const errors=[];
  let cases=0;

  for(const q of questions){
    if(!Array.isArray(q.options)||q.options.length!==4){errors.push(`${q.id}: canonical options != 4`);continue;}
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3){errors.push(`${q.id}: invalid correct index`);continue;}
    const es=translations.get(q.id);
    if(!es||!Array.isArray(es.options)||es.options.length!==4){errors.push(`${q.id}: Spanish options != 4`);continue;}

    const canonicalCorrect=q.options[q.correct];
    const spanishCorrect=es.options[q.correct];
    const producedOrders=new Set();
    for(const values of paths){
      const shuffled=shuffleQuestionOptions({...q,translations:{es}},rngFrom(values));
      const order=shuffled.options.map(text=>q.options.indexOf(text));
      producedOrders.add(order.join(','));

      cases++;
      if(shuffled.options[shuffled.correct]!==canonicalCorrect)errors.push(`${q.id}: CA correct answer moved incorrectly in ${order.join('')}`);
      if(new Set(shuffled.options).size!==4||shuffled.options.some(v=>!q.options.includes(v)))errors.push(`${q.id}: CA option loss/duplication in ${order.join('')}`);

      cases++;
      const esOptions=shuffled.translations?.es?.options;
      if(!Array.isArray(esOptions)||esOptions[shuffled.correct]!==spanishCorrect)errors.push(`${q.id}: ES correct answer moved incorrectly in ${order.join('')}`);
      if(!Array.isArray(esOptions)||new Set(esOptions).size!==4||esOptions.some(v=>!es.options.includes(v)))errors.push(`${q.id}: ES option loss/duplication in ${order.join('')}`);
    }
    if(producedOrders.size!==24)errors.push(`${q.id}: real shuffle engine produced ${producedOrders.size}/24 distinct permutations`);
  }

  return {questions:questions.length,permutationsPerQuestion:paths.length,languages:2,cases,errors};
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
  console.log(`CASES=${result.cases}`);
}
