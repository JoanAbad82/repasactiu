import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=path.join(root,'site','data');
const docsDir=path.join(root,'docs','content');
const readData=async rel=>JSON.parse(await readFile(path.join(dataDir,String(rel).replace(/^data\//,'')),'utf8'));
const readDocs=async rel=>JSON.parse(await readFile(path.join(docsDir,rel),'utf8'));

const EXPECTED={
  'bloc-1':66,
  'bloc-2':86,
  'bloc-3':86,
  'bloc-4':76,
  'bloc-5':76,
  'unitat-2-bloc-1':156,
  'uf0518-bloc-1':92
};

const normalize=value=>String(value??'')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim().toLocaleLowerCase('ca');

const STOP=new Set('que com quin quina quins quines què una unes un uns les els del dels amb per segons sobre aquest aquesta aquests aquestes seva seu seus seves empresa empreses temari material cuál cuales qué una unas uno unos las los según este esta estos estas'.split(' '));
const tokens=value=>new Set(normalize(value).split(' ').filter(token=>token.length>2&&!STOP.has(token)));
const jaccard=(a,b)=>{
  const A=tokens(a),B=tokens(b);
  if(!A.size||!B.size)return 0;
  let common=0;
  for(const token of A)if(B.has(token))common++;
  return common/(A.size+B.size-common);
};
const slug=value=>normalize(value).replace(/\s+/g,'-')||'sense-etiqueta';

function mergeQuestionObjects(items){
  return Object.assign({},...items.map(item=>item.questions||{}));
}

function semanticMap(manifest){
  return new Map((manifest.changes||[]).map(change=>[change.id,change]));
}

function effectiveChange(change){
  if(!change)return null;
  return change.status==='MERGE/REPLACE'?(change.replacement||null):change;
}

function conceptId(blockId,topic,answer,explicit){
  return explicit||[blockId.toUpperCase(),slug(topic),slug(answer)].join('.');
}

function pageSource(label){
  const text=String(label||'').trim();
  const source=(text.match(/^(UF0518|U2|B[1-5])/i)?.[1]||'SOURCE').toUpperCase()
    .replace(/^U2$/,'U2B1').replace(/^UF0518$/,'UF0518_B1');
  const m=text.match(/pp?\.?\s*(\d+)(?:\s*(?:[-–—]|i|y)\s*(\d+))?/i);
  return m?{source,pageRange:[Number(m[1]),Number(m[2]||m[1])],precision:'page'}:{source,pageRange:null,precision:'label'};
}

export async function runSemanticStudyCardsAudit(){
  const [course,extra,manifest,traceability]=await Promise.all([
    readData('course.json'),
    readData('study-cards-extra.json'),
    readData('study-cards-semantic-v2.json'),
    readData('study-cards-traceability-v2.json')
  ]);
  const errors=[];
  const warnings=[];
  if(manifest.auditedHead!=='c94c617aa7a35a8da1c024abc57fb005288ede29')errors.push('manifest: auditedHead inesperat');
  if((manifest.changes||[]).length!==84)errors.push('manifest: '+(manifest.changes||[]).length+'/84 canvis');
  const rewriteCount=(manifest.changes||[]).filter(x=>x.status==='REWRITE').length;
  const replaceCount=(manifest.changes||[]).filter(x=>x.status==='MERGE/REPLACE').length;
  if(rewriteCount!==37)errors.push('manifest: '+rewriteCount+'/37 REWRITE');
  if(replaceCount!==47)errors.push('manifest: '+replaceCount+'/47 MERGE/REPLACE');

  const semantic=semanticMap(manifest);
  const seenChanges=new Set();
  const cards=[];
  const sourceFor=(blockId,id,topic)=>{
    const exact=traceability.questionRanges?.[id];
    if(exact?.source&&Array.isArray(exact.pageRange))return {source:exact.source,pageRange:exact.pageRange,precision:'question'};
    const range=traceability.topicRanges?.[blockId]?.[topic];
    const source=traceability.blockSources?.[blockId]||null;
    if(source&&Array.isArray(range))return {source,pageRange:range,precision:'section'};
    return {source,pageRange:null,precision:'missing'};
  };

  for(const block of course.blocks){
    const bankFiles=[block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean);
    const translationFiles=[block.translationFile,...(block.additionalTranslationFiles||[])].filter(Boolean);
    const memoryFiles=[block.memoryAidFile,...(block.additionalMemoryAidFiles||[])].filter(Boolean);
    const banks=await Promise.all(bankFiles.map(readData));
    const translations=mergeQuestionObjects(await Promise.all(translationFiles.map(readData)));
    const memories=mergeQuestionObjects(await Promise.all(memoryFiles.map(readData)));
    const questions=banks.flatMap(bank=>bank.questions||[]);
    for(const q of questions){
      const es=translations[q.id]||{};
      const memory=memories[q.id]||{};
      const baseOverride=extra.coreOverrides?.[q.id]||{};
      const change=semantic.get(q.id);
      if(change)seenChanges.add(q.id);
      const semanticRecord=effectiveChange(change);
      const caText=semanticRecord?.ca||baseOverride.ca||{};
      const esText=semanticRecord?.es||baseOverride.es||{};
      const caAnswer=caText.answer||q.options?.[q.correct]||'';
      const esAnswer=esText.answer||es.options?.[q.correct]||'';
      const caQuestion=caText.question||q.question||'';
      const esQuestion=esText.question||es.question||'';
      const caMnemonic=caText.mnemonic||baseOverride.ca?.mnemonic||memory.ca||'';
      const esMnemonic=esText.mnemonic||baseOverride.es?.mnemonic||memory.es||'';
      const source=semanticRecord?.source?pageSource(semanticRecord.source):sourceFor(block.id,q.id,q.topic);
      cards.push({
        id:q.id,blockId:block.id,conceptId:conceptId(block.id,q.topic,caAnswer,semanticRecord?.concept_id),
        ca:{question:caQuestion,answer:caAnswer,mnemonic:caMnemonic},
        es:{question:esQuestion,answer:esAnswer,mnemonic:esMnemonic},
        source
      });
    }
  }

  for(const card of extra.cards||[]){
    const change=semantic.get(card.id);
    if(change)seenChanges.add(card.id);
    const semanticRecord=effectiveChange(change);
    const ca=semanticRecord?.ca||card.ca||{};
    const es=semanticRecord?.es||card.es||{};
    const source=semanticRecord?.source?pageSource(semanticRecord.source):
      {source:card.source?.id||null,pageRange:card.source?.pages||null,precision:'page'};
    cards.push({
      id:card.id,blockId:card.blockId,
      conceptId:conceptId(card.blockId,'extra',ca.answer,semanticRecord?.concept_id),
      ca,es,source
    });
  }

  const missingChanges=(manifest.changes||[]).map(x=>x.id).filter(id=>!seenChanges.has(id));
  if(missingChanges.length)errors.push('manifest IDs inexistents: '+missingChanges.join(', '));
  if(cards.length!==638)errors.push('targetes efectives: '+cards.length+'/638');
  if(new Set(cards.map(c=>c.id)).size!==cards.length)errors.push('IDs efectius duplicats');

  const countByBlock={};
  for(const card of cards)countByBlock[card.blockId]=(countByBlock[card.blockId]||0)+1;
  for(const [blockId,count] of Object.entries(EXPECTED))if(countByBlock[blockId]!==count)errors.push(blockId+': '+(countByBlock[blockId]||0)+'/'+count);

  for(const card of cards){
    for(const lang of ['ca','es']){
      const data=card[lang]||{};
      if(!String(data.question||'').trim())errors.push(card.id+': pregunta '+lang+' buida');
      if(!String(data.question||'').trim().endsWith('?'))errors.push(card.id+': pregunta '+lang+' sense ?');
      if(!String(data.answer||'').trim())errors.push(card.id+': resposta '+lang+' buida');
      if(!String(data.mnemonic||'').trim())errors.push(card.id+': mnemotècnia '+lang+' buida');
    }
    if(!card.conceptId)errors.push(card.id+': conceptId buit');
    if(!card.source?.source||!Array.isArray(card.source?.pageRange))errors.push(card.id+': traçabilitat sense rang de pàgina');
    if(card.source?.precision==='missing'||card.source?.precision==='block')errors.push(card.id+': traçabilitat massa ampla');
  }

  for(const change of manifest.changes||[]){
    const record=effectiveChange(change);
    const src=pageSource(record?.source);
    if(src.precision!=='page'||!src.pageRange)errors.push(change.id+': canvi sense traçabilitat de pàgina');
    if(!record?.ca?.question||!record?.es?.question)errors.push(change.id+': canvi sense pregunta bilingüe');
    if(!record?.ca?.answer||!record?.es?.answer)errors.push(change.id+': canvi sense resposta bilingüe');
    if(!record?.ca?.mnemonic||!record?.es?.mnemonic)errors.push(change.id+': canvi sense mnemotècnia bilingüe');
  }

  const byBlock=new Map();
  for(const card of cards){
    if(!byBlock.has(card.blockId))byBlock.set(card.blockId,[]);
    byBlock.get(card.blockId).push(card);
  }
  let candidatePairs=0;
  for(const [blockId,list] of byBlock){
    for(let i=0;i<list.length;i++){
      for(let j=i+1;j<list.length;j++){
        const a=list[i],b=list[j];
        const exact=normalize(a.ca.question)===normalize(b.ca.question);
        const qsim=jaccard(a.ca.question,b.ca.question);
        const sameAnswer=normalize(a.ca.answer)===normalize(b.ca.answer);
        if(exact)errors.push(blockId+': pregunta CA duplicada '+a.id+' / '+b.id);
        if(sameAnswer&&qsim>=0.93){
          candidatePairs++;
          errors.push(blockId+': duplicació semàntica gairebé idèntica '+a.id+' / '+b.id+' (qsim='+qsim.toFixed(2)+')');
        }else if((sameAnswer&&qsim>=0.78)||qsim>=0.82){
          candidatePairs++;
          warnings.push(blockId+': parell semàntic per revisió '+a.id+' / '+b.id+' (qsim='+qsim.toFixed(2)+')');
        }
      }
    }
  }

  if(errors.length)throw new Error('Semantic study-card audit FAIL\n- '+errors.join('\n- '));
  console.log('Semantic study-card audit PASS');
  console.log('cards='+cards.length+' rewrite='+rewriteCount+' replace='+replaceCount+' high_similarity_pairs='+candidatePairs+' warnings='+warnings.length);
  return {cards:cards.length,rewriteCount,replaceCount,candidatePairs,warnings};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  await runSemanticStudyCardsAudit();
}
