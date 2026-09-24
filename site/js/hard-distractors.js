const normalizeOption=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/[’'\`´]/g,' ')
  .replace(/[^\p{L}\p{N}]+/gu,' ')
  .trim()
  .replace(/\s+/g,' ')
  .toLocaleLowerCase('ca');

const giveawayAbsoluteWords=new Set([
  'nomes','sempre','mai','exclusivament','necessariament','unicament',
  'solo','siempre','nunca','exclusivamente','necesariamente','unicamente'
]);

function hasGiveawayAbsolute(value){
  const words=normalizeOption(value).split(' ');
  return words.some(word=>giveawayAbsoluteWords.has(word));
}

function editorialScore(value,correct){
  const normalized=normalizeOption(value);
  const correctNormalized=normalizeOption(correct);
  const absolutePenalty=hasGiveawayAbsolute(value)?10000:0;
  const lengthPenalty=Math.abs(normalized.length-correctNormalized.length);
  return absolutePenalty+lengthPenalty;
}

function validateOverlayShape(question,hardRecord){
  if(!question?.translations?.es)throw new Error(`${question?.id||'question'}: Spanish translation required for distractor composition`);
  if(!Array.isArray(hardRecord?.ca)||hardRecord.ca.length!==3||!Array.isArray(hardRecord?.es)||hardRecord.es.length!==3){
    throw new Error(`${question?.id||'question'}: invalid hard distractor record`);
  }
}

export function composePracticeQuestion(question,hardRecord,rng=Math.random){
  validateOverlayShape(question,hardRecord);
  const ca=[...question.options];
  const es=[...question.translations.es.options];
  const wrongIndices=[0,1,2,3].filter(index=>index!==question.correct);
  const correctCa=ca[question.correct];
  const correctEs=es[question.correct];

  const retainedIndex=wrongIndices
    .slice()
    .sort((a,b)=>editorialScore(ca[a],correctCa)-editorialScore(ca[b],correctCa) || a-b)[0];

  const retainedCa=normalizeOption(ca[retainedIndex]);
  const retainedEs=normalizeOption(es[retainedIndex]);
  const correctCaNormalized=normalizeOption(correctCa);
  const correctEsNormalized=normalizeOption(correctEs);

  const candidates=hardRecord.ca.map((value,index)=>({
    ca:value,
    es:hardRecord.es[index],
    tie:rng()
  })).filter(candidate=>{
    const candidateCa=normalizeOption(candidate.ca);
    const candidateEs=normalizeOption(candidate.es);
    return candidateCa!==correctCaNormalized&&candidateEs!==correctEsNormalized&&
      candidateCa!==retainedCa&&candidateEs!==retainedEs;
  }).sort((a,b)=>a.tie-b.tie);

  const selected=[];
  for(const candidate of candidates){
    if(selected.some(item=>normalizeOption(item.ca)===normalizeOption(candidate.ca)||normalizeOption(item.es)===normalizeOption(candidate.es)))continue;
    selected.push(candidate);
    if(selected.length===2)break;
  }
  if(selected.length!==2)throw new Error(`${question.id}: not enough distinct distractors for practice composition`);

  const replaceIndices=wrongIndices.filter(index=>index!==retainedIndex);
  for(const [position,index] of replaceIndices.entries()){
    ca[index]=selected[position].ca;
    es[index]=selected[position].es;
  }

  return {
    ...question,
    options:ca,
    translations:{
      ...(question.translations||{}),
      es:{...question.translations.es,options:es}
    }
  };
}

export function composeHardQuestion(question,hardRecord){
  validateOverlayShape(question,hardRecord);
  const ca=[...question.options];
  const es=[...question.translations.es.options];
  let hardIndex=0;
  for(let optionIndex=0;optionIndex<4;optionIndex++){
    if(optionIndex===question.correct)continue;
    ca[optionIndex]=hardRecord.ca[hardIndex];
    es[optionIndex]=hardRecord.es[hardIndex];
    hardIndex++;
  }
  return {
    ...question,
    options:ca,
    translations:{
      ...(question.translations||{}),
      es:{...question.translations.es,options:es}
    }
  };
}
