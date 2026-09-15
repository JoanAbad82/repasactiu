async function readJson(url, fetchImpl, userMessage) {
  const response=await fetchImpl(url);
  if(!response.ok) throw new Error(`${userMessage} (HTTP ${response.status})`);
  return response.json();
}

export function loadCourse(fetchImpl=fetch){
  return readJson("data/course.json",fetchImpl,"No s’ha pogut carregar el temari. Torna-ho a provar.");
}

export function loadBlock(file,fetchImpl=fetch){
  return readJson(file,fetchImpl,"No s’ha pogut carregar aquest bloc. Torna-ho a provar.");
}

function exactQuestionIds(bank,supplement,errorMessage){
  if(supplement.blockId!==bank.blockId) throw new Error(errorMessage);
  if(!supplement.questions||Array.isArray(supplement.questions)) throw new Error(errorMessage);
  const canonicalIds=bank.questions.map(q=>q.id).sort();
  const supplementIds=Object.keys(supplement.questions).sort();
  if(canonicalIds.length!==supplementIds.length||canonicalIds.some((id,index)=>id!==supplementIds[index])){
    throw new Error(errorMessage);
  }
}

function attachSpanishTranslation(bank,translation){
  exactQuestionIds(bank,translation,"La traducció de preguntes no coincideix amb el banc principal.");
  return {
    ...bank,
    blockTitleEs:translation.blockTitle,
    questions:bank.questions.map(question=>({
      ...question,
      translations:{...(question.translations||{}),es:translation.questions[question.id]}
    }))
  };
}

function attachMemoryAids(bank,memoryAids){
  exactQuestionIds(bank,memoryAids,"Les ajudes de memòria no coincideixen amb el banc principal.");
  return {
    ...bank,
    questions:bank.questions.map(question=>({
      ...question,
      memoryAid:memoryAids.questions[question.id]
    }))
  };
}

export async function loadBlockBundle(file,extraFile,fetchImpl=fetch,translationFile=null,memoryAidFile=null){
  const base=await loadBlock(file,fetchImpl);
  let bank=base;
  if(extraFile){
    const extra=await loadBlock(extraFile,fetchImpl);
    if(extra.blockId!==base.blockId)throw new Error("El banc addicional no correspon al bloc principal.");
    bank={...base,questions:[...base.questions,...extra.questions]};
  }
  if(translationFile){
    const translation=await readJson(translationFile,fetchImpl,"No s’ha pogut carregar la traducció castellana. Torna-ho a provar.");
    bank=attachSpanishTranslation(bank,translation);
  }
  if(memoryAidFile){
    const memoryAids=await readJson(memoryAidFile,fetchImpl,"No s’han pogut carregar les ajudes de memòria. Torna-ho a provar.");
    bank=attachMemoryAids(bank,memoryAids);
  }
  return bank;
}
