import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

async function loadCanonicalQuestions(){
  const course=await readJson('course.json');
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
  return {questions,translations};
}

export async function runPermutationAudit(){
  const {questions,translations}=await loadCanonicalQuestions();
  const permutations=generatePermutations([0,1,2,3]);
  const errors=[];
  let cases=0;

  for(const q of questions){
    if(!Array.isArray(q.options)||q.options.length!==4){errors.push(`${q.id}: canonical options != 4`);continue;}
    if(!Number.isInteger(q.correct)||q.correct<0||q.correct>3){errors.push(`${q.id}: invalid correct index`);continue;}
    const es=translations.get(q.id);
    if(!es||!Array.isArray(es.options)||es.options.length!==4){errors.push(`${q.id}: Spanish options != 4`);continue;}

    const canonicalCorrect=q.options[q.correct];
    const spanishCorrect=es.options[q.correct];
    for(const permutation of permutations){
      const correctIndex=permutation.indexOf(q.correct);
      const ca=permutation.map(i=>q.options[i]);
      const esp=permutation.map(i=>es.options[i]);

      cases++;
      if(ca[correctIndex]!==canonicalCorrect)errors.push(`${q.id}: CA correct answer moved incorrectly in ${permutation.join('')}`);
      if(new Set(ca).size!==4||ca.some(v=>!q.options.includes(v)))errors.push(`${q.id}: CA option loss/duplication in ${permutation.join('')}`);

      cases++;
      if(esp[correctIndex]!==spanishCorrect)errors.push(`${q.id}: ES correct answer moved incorrectly in ${permutation.join('')}`);
      if(new Set(esp).size!==4||esp.some(v=>!es.options.includes(v)))errors.push(`${q.id}: ES option loss/duplication in ${permutation.join('')}`);
    }
  }

  return {questions:questions.length,permutationsPerQuestion:permutations.length,languages:2,cases,errors};
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
