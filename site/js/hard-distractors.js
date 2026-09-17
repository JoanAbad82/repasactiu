export function composeHardQuestion(question,hardRecord){
  if(!question?.translations?.es)throw new Error(`${question?.id||'question'}: Spanish translation required for hard composition`);
  if(!Array.isArray(hardRecord?.ca)||hardRecord.ca.length!==3||!Array.isArray(hardRecord?.es)||hardRecord.es.length!==3){
    throw new Error(`${question?.id||'question'}: invalid hard distractor record`);
  }
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
