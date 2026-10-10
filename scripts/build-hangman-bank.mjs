import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadEffectiveQuestions} from './hard-distractor-lib.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));
const write=(rel,obj)=>fs.writeFileSync(path.join(root,rel),JSON.stringify(obj,null,2)+'\n','utf8');

const normalize=value=>String(value??'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLocaleLowerCase('ca')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim().replace(/\s+/g,' ');

const isLetter=char=>/^[A-Za-zÀ-ÖØ-öø-ÿ]$/u.test(char);
const wordParts=value=>String(value??'').trim().split(/\s+/u).filter(Boolean);
export function isHangmanTerm(value){
  const term=String(value??'').trim();
  if(!term||/[0-9./:;=+<>→←]/u.test(term)||/\bvs\b/i.test(term))return false;
  const words=wordParts(term);
  const letters=[...term].filter(isLetter);
  const longest=Math.max(0,...words.map(word=>[...word].filter(isLetter).length));
  return letters.length>=4&&letters.length<=45&&words.length<=6&&longest<=18;
}
const hasTerm=(text,term)=>{
  const a=normalize(text),b=normalize(term);
  return Boolean(a&&b&&a.includes(b));
};
const cleanTerm=(value,lang)=>{
  let term=String(value??'').trim();
  if(lang==='ca'){
    term=term.replace(/^(?:una|un|els|les|el|la|l[’'])\s*/iu,'');
    term=term.replace(/^principalment\s+/iu,'');
    term=term.replace(/\s+segons (?:el )?(?:material|temari|la unitat)$/iu,'');
  }else{
    term=term.replace(/^(?:una|un|los|las|el|la)\s+/iu,'');
    term=term.replace(/^principalmente\s+/iu,'');
    term=term.replace(/\s+según (?:el )?(?:material|temario|la unidad)$/iu,'');
  }
  return term.trim();
};

const caPatterns=[
  /^Què és\s+(.+?)\?$/iu,
  /^Què són\s+(.+?)\?$/iu,
  /^Què significa\s+(.+?)\?$/iu,
  /^Què caracteritza\s+(.+?)\?$/iu,
  /^Què fa\s+(.+?)\?$/iu,
  /^Quina és la funció(?: principal)? d(?:e|’|')\s*(.+?)\?$/iu,
  /^Quina funció té\s+(.+?)\?$/iu,
  /^Quina és la finalitat(?: principal)? d(?:e|’|')\s*(.+?)\?$/iu,
  /^Quin és l[’']objectiu(?: principal)? d(?:e|’|')\s*(.+?)\?$/iu,
  /^Per a què serveix(?: principalment)?\s+(.+?)\?$/iu,
  /^Què permet\s+(.+?)\?$/iu,
  /^Què exigeix\s+(.+?)\?$/iu,
  /^Què pretén\s+(.+?)\?$/iu,
  /^Què determina\s+(.+?)\?$/iu,
  /^Què expressa\s+(.+?)\?$/iu,
  /^En què consisteix\s+(.+?)\?$/iu,
  /^Com funciona\s+(.+?)\?$/iu,
  /^Quina afirmació descriu correctament\s+(.+?)\?$/iu,
  /^Quina afirmació sobre\s+(.+?)\s+és correcta\?$/iu,
  /^Quina característica defineix\s+(.+?)(?:\s+segons el temari)?\?$/iu
];
const esPatterns=[
  /^¿Qué es\s+(.+?)\?$/iu,
  /^¿Qué son\s+(.+?)\?$/iu,
  /^¿Qué significa\s+(.+?)\?$/iu,
  /^¿Qué caracteriza(?: a)?\s+(.+?)\?$/iu,
  /^¿Qué hace\s+(.+?)\?$/iu,
  /^¿Cuál es la función(?: principal)? de\s+(.+?)\?$/iu,
  /^¿Qué función tiene\s+(.+?)\?$/iu,
  /^¿Cuál es la finalidad(?: principal)? de\s+(.+?)\?$/iu,
  /^¿Cuál es el objetivo(?: principal)? de\s+(.+?)\?$/iu,
  /^¿Para qué sirve(?: principalmente)?\s+(.+?)\?$/iu,
  /^¿Qué permite\s+(.+?)\?$/iu,
  /^¿Qué exige\s+(.+?)\?$/iu,
  /^¿Qué pretende\s+(.+?)\?$/iu,
  /^¿Qué determina\s+(.+?)\?$/iu,
  /^¿Qué expresa\s+(.+?)\?$/iu,
  /^¿En qué consiste\s+(.+?)\?$/iu,
  /^¿Cómo funciona\s+(.+?)\?$/iu,
  /^¿Qué afirmación describe correctamente\s+(.+?)\?$/iu,
  /^¿Qué afirmación sobre\s+(.+?)\s+es correcta\?$/iu,
  /^¿Qué característica define(?: a)?\s+(.+?)(?:\s+según el temario)?\?$/iu
];

function extractNamedTerm(question,patterns,lang){
  for(const pattern of patterns){
    const match=String(question??'').match(pattern);
    if(match)return cleanTerm(match[1],lang);
  }
  return null;
}
function makeTraceMap(){
  const map=new Map();
  const formatId=(prefix,n)=>`${prefix}${String(n).padStart(3,'0')}`;
  for(const rel of ['docs/content/UF0517_SOURCE_TRACEABILITY.json','docs/content/UF0518_SOURCE_TRACEABILITY.json','docs/content/UF0519_SOURCE_TRACEABILITY.json','docs/content/UF0519_U3_SOURCE_TRACEABILITY.json']){
    const trace=read(rel);
    for(const rule of trace.coverageRules||[]){
      for(let n=rule.start;n<=rule.end;n++)map.set(formatId(rule.prefix,n),{id:rule.source,pages:rule.pageRange});
    }
    for(const item of trace.questionTraces||[])map.set(item.id,{id:item.source,pages:item.pageRange,cells:item.cells});
    for(const item of trace.sourceOverrides||[])map.set(item.id,{id:item.source,pages:item.pageRange});
  }
  const study=read('site/data/study-cards-traceability-v2.json');
  for(const [id,loc] of Object.entries(study.questionLocations||{})){
    map.set(id,{id:loc.source,pages:loc.pageRange,cells:loc.cells});
  }
  return map;
}
function loadMemoryMap(course){
  const map=new Map();
  for(const block of course.blocks||[]){
    for(const file of [block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean)){
      const data=read(path.join('site',file));
      for(const [id,value] of Object.entries(data.questions||{}))map.set(id,value);
    }
  }
  return map;
}
function groupLabel(block,lang){
  const unit=lang==='es'?(block.unitTitleEs||block.unitTitle):block.unitTitle;
  const title=lang==='es'?(block.titleEs||block.title):block.title;
  const word=lang==='es'?'Bloque':'Bloc';
  return `${unit} · ${word} ${block.blockNumber} — ${title}`;
}
function candidateFromQuestion({kind,id,blockId,q,caTerm,esTerm,caHint,esHint,traceMap,memoryMap,hintType}){
  const source=traceMap.get(q.id);
  if(!source||!isHangmanTerm(caTerm)||!isHangmanTerm(esTerm))return null;
  if(hasTerm(caHint,caTerm)||hasTerm(esHint,esTerm))return null;
  if(String(caHint).length>260||String(esHint).length>260)return null;
  const aid=memoryMap.get(q.id)||{};
  return {
    id,kind,blockId,questionId:q.id,hintType,source,
    ca:{term:caTerm,hint:String(caHint).trim(),memory:aid.ca||''},
    es:{term:esTerm,hint:String(esHint).trim(),memory:aid.es||''}
  };
}
function topicCandidate(blockId,group,traceMap,memoryMap){
  const caTerm=String(group[0].topic||'').trim();
  const esTerm=String(group[0].translations?.es?.topic||'').trim();
  if(!isHangmanTerm(caTerm)||!isHangmanTerm(esTerm))return null;
  for(const q of group){
    const caAnswer=q.options[q.correct],esAnswer=q.translations.es.options[q.correct];
    const caQuestion=q.question,esQuestion=q.translations.es.question;
    const caExplanation=q.explanation||'',esExplanation=q.translations.es.explanation||'';
    if(hasTerm(caQuestion,caTerm)&&hasTerm(esQuestion,esTerm)&&!hasTerm(caAnswer,caTerm)&&!hasTerm(esAnswer,esTerm)){
      return candidateFromQuestion({kind:'topic',id:'topic:'+q.id,blockId,q,caTerm,esTerm,caHint:caAnswer,esHint:esAnswer,traceMap,memoryMap,hintType:'answer'});
    }
    if(hasTerm(caAnswer,caTerm)&&hasTerm(esAnswer,esTerm)&&!hasTerm(caQuestion,caTerm)&&!hasTerm(esQuestion,esTerm)){
      return candidateFromQuestion({kind:'topic',id:'topic:'+q.id,blockId,q,caTerm,esTerm,caHint:caQuestion,esHint:esQuestion,traceMap,memoryMap,hintType:'question'});
    }
    if(hasTerm(caQuestion,caTerm)&&hasTerm(esQuestion,esTerm)&&caExplanation&&esExplanation&&!hasTerm(caExplanation,caTerm)&&!hasTerm(esExplanation,esTerm)){
      return candidateFromQuestion({kind:'topic',id:'topic:'+q.id,blockId,q,caTerm,esTerm,caHint:caExplanation,esHint:esExplanation,traceMap,memoryMap,hintType:'explanation'});
    }
  }
  return null;
}

export async function buildHangmanBank(){
  const dictionary=read('site/data/concept-dictionary-v1.json');
  const keyLists=read('site/data/key-lists-v1.json');
  const {course,questionsByBlock}=await loadEffectiveQuestions();
  const traceMap=makeTraceMap();
  const memoryMap=loadMemoryMap(course);
  const candidates=[];

  for(const entry of dictionary.entries||[]){
    if(!isHangmanTerm(entry.ca?.term)||!isHangmanTerm(entry.es?.term))continue;
    candidates.push({
      id:'dict:'+entry.id,kind:'dictionary',blockId:entry.blockId,source:entry.source,
      ca:{term:entry.ca.term,hint:entry.ca.definition,memory:entry.ca.memory||''},
      es:{term:entry.es.term,hint:entry.es.definition,memory:entry.es.memory||''}
    });
  }

  for(const block of course.blocks||[]){
    const questions=questionsByBlock.get(block.id)?.questions||[];
    const byTopic=new Map();
    for(const q of questions){
      const ca=String(q.topic||'').trim(),es=String(q.translations?.es?.topic||'').trim();
      if(!ca||!es)continue;
      const key=normalize(ca)+'|'+normalize(es);
      if(!byTopic.has(key))byTopic.set(key,[]);
      byTopic.get(key).push(q);
    }
    for(const group of byTopic.values()){
      const candidate=topicCandidate(block.id,group,traceMap,memoryMap);
      if(candidate)candidates.push(candidate);
    }
    for(const q of questions){
      const caTerm=extractNamedTerm(q.question,caPatterns,'ca');
      const esTerm=extractNamedTerm(q.translations?.es?.question||'',esPatterns,'es');
      if(!caTerm||!esTerm)continue;
      const candidate=candidateFromQuestion({
        kind:'named-question',id:'named:'+q.id,blockId:block.id,q,caTerm,esTerm,
        caHint:q.options[q.correct],esHint:q.translations.es.options[q.correct],
        traceMap,memoryMap,hintType:'answer'
      });
      if(candidate)candidates.push(candidate);
    }
  }

  for(const list of keyLists.entries||[]){
    if(!list.ordered)continue;
    const caItems=list.ca?.items||[],esItems=list.es?.items||[];
    if(caItems.length!==esItems.length)continue;
    for(let i=0;i<caItems.length;i++){
      const caTerm=caItems[i],esTerm=esItems[i];
      if(!isHangmanTerm(caTerm)||!isHangmanTerm(esTerm))continue;
      const caMemory=list.ca.memory||`Ordre: ${caItems.join(' → ')}.`;
      const esMemory=list.es.memory||`Orden: ${esItems.join(' → ')}.`;
      candidates.push({
        id:`list:${list.id}:${i+1}`,kind:'ordered-list',blockId:list.blockId,source:list.source,
        ca:{term:caTerm,hint:`Pas ${i+1} de ${caItems.length}: ${list.ca.title}.`,memory:caMemory},
        es:{term:esTerm,hint:`Paso ${i+1} de ${esItems.length}: ${list.es.title}.`,memory:esMemory}
      });
    }
  }

  const priority={dictionary:0,'named-question':1,topic:2,'ordered-list':3};
  const perBlock=new Map();
  for(const candidate of candidates){
    if(!candidate.source)continue;
    if(!perBlock.has(candidate.blockId))perBlock.set(candidate.blockId,new Map());
    const map=perBlock.get(candidate.blockId);
    const key=normalize(candidate.ca.term)+'|'+normalize(candidate.es.term);
    const current=map.get(key);
    if(!current||priority[candidate.kind]<priority[current.kind])map.set(key,candidate);
  }

  const entries=[];
  for(const block of course.blocks||[]){
    for(const candidate of perBlock.get(block.id)?.values()||[])entries.push(candidate);
  }
  const byBlock=Object.fromEntries((course.blocks||[]).map(block=>[block.id,entries.filter(e=>e.blockId===block.id).length]));
  const byKind={};
  for(const entry of entries)byKind[entry.kind]=(byKind[entry.kind]||0)+1;
  const groups=(course.blocks||[]).map(block=>({id:block.id,ca:groupLabel(block,'ca'),es:groupLabel(block,'es')}));

  return {
    version:'2.0',
    date:'2026-10-06',
    languages:['ca','es'],
    count:entries.length,
    groups,
    stats:{byBlock,byKind},
    policy:{
      scope:'Curs complet publicat a Repàs Actiu',
      sources:['concept-dictionary-v1','certified-question-topics','named-question-concepts','ordered-key-lists'],
      maxWords:6,
      maxLetters:45,
      maxWordLetters:18,
      rule:'Només termes bilingües, traçables i jugables; les pistes no poden revelar literalment la solució.'
    },
    entries
  };
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const bank=await buildHangmanBank();
  write('site/data/hangman-bank-v2.json',bank);
  console.log('HANGMAN_BANK_BUILD=PASS');
  console.log('ENTRIES='+bank.count);
  console.log('BLOCK_COUNTS='+JSON.stringify(bank.stats.byBlock));
  console.log('KINDS='+JSON.stringify(bank.stats.byKind));
}
