const normalizeOption=value=>String(value??'')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .replace(/\+/g,' plus ')
  .replace(/−/g,' minus ')
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
  const correctCaNormalized=normalizeOption(correctCa);
  const correctEsNormalized=normalizeOption(correctEs);
  const practiceWrongCa=new Set(wrongIndices.map(index=>normalizeOption(ca[index])));
  const practiceWrongEs=new Set(wrongIndices.map(index=>normalizeOption(es[index])));

  const conceptTooClose=(left,right)=>{
    const a=normalizeOption(left);
    const b=normalizeOption(right);
    if(!a||!b)return false;
    if(a===b)return true;
    const [shorter,longer]=a.length<=b.length?[a,b]:[b,a];
    return shorter.length>=12&&longer.includes(shorter);
  };

  const configurations=[];
  for(const retainedIndex of wrongIndices){
    const retainedCa=ca[retainedIndex];
    const retainedEs=es[retainedIndex];
    const retainedCaNormalized=normalizeOption(retainedCa);
    const retainedEsNormalized=normalizeOption(retainedEs);

    const candidates=hardRecord.ca.map((value,index)=>({
      ca:value,
      es:hardRecord.es[index],
      absolute:hasGiveawayAbsolute(value)||hasGiveawayAbsolute(hardRecord.es[index]),
      editorial:editorialScore(value,correctCa)+editorialScore(hardRecord.es[index],correctEs),
      tie:rng()
    })).filter(candidate=>{
      const candidateCa=normalizeOption(candidate.ca);
      const candidateEs=normalizeOption(candidate.es);
      return candidateCa!==correctCaNormalized&&candidateEs!==correctEsNormalized&&
        candidateCa!==retainedCaNormalized&&candidateEs!==retainedEsNormalized&&
        !practiceWrongCa.has(candidateCa)&&!practiceWrongEs.has(candidateEs)&&
        !conceptTooClose(candidate.ca,retainedCa)&&!conceptTooClose(candidate.es,retainedEs);
    }).sort((a,b)=>Number(a.absolute)-Number(b.absolute) || a.editorial-b.editorial || a.tie-b.tie);

    const selected=[];
    for(const candidate of candidates){
      if(selected.some(item=>
        normalizeOption(item.ca)===normalizeOption(candidate.ca)||
        normalizeOption(item.es)===normalizeOption(candidate.es)
      ))continue;
      selected.push(candidate);
      if(selected.length===2)break;
    }
    if(selected.length!==2)continue;

    const score=editorialScore(retainedCa,correctCa)+editorialScore(retainedEs,correctEs)+
      selected.reduce((sum,item)=>sum+item.editorial+(item.absolute?1000:0),0);
    configurations.push({retainedIndex,selected,score,tie:rng()});
  }

  if(!configurations.length)throw new Error(`${question.id}: not enough conceptually distinct distractors for practice composition`);
  configurations.sort((a,b)=>a.score-b.score || a.tie-b.tie);
  const {retainedIndex,selected}=configurations[0];
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
