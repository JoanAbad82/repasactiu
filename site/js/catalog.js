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

function attachSpanishTranslation(bank,translation){
  if(translation.blockId!==bank.blockId) throw new Error("La traducció no correspon al bloc principal.");
  if(!translation.questions||Array.isArray(translation.questions)) throw new Error("La traducció de preguntes no té el format esperat.");
  const canonicalIds=bank.questions.map(q=>q.id).sort();
  const translatedIds=Object.keys(translation.questions).sort();
  if(canonicalIds.length!==translatedIds.length||canonicalIds.some((id,index)=>id!==translatedIds[index])){
    throw new Error("La traducció de preguntes no coincideix amb el banc principal.");
  }
  return {
    ...bank,
    blockTitleEs:translation.blockTitle,
    questions:bank.questions.map(question=>({
      ...question,
      translations:{...(question.translations||{}),es:translation.questions[question.id]}
    }))
  };
}

export async function loadBlockBundle(file,extraFile,fetchImpl=fetch,translationFile=null){
  const base=await loadBlock(file,fetchImpl);
  let bank=base;
  if(extraFile){
    const extra=await loadBlock(extraFile,fetchImpl);
    if(extra.blockId!==base.blockId)throw new Error("El banc addicional no correspon al bloc principal.");
    bank={...base,questions:[...base.questions,...extra.questions]};
  }
  if(!translationFile)return bank;
  const translation=await readJson(translationFile,fetchImpl,"No s’ha pogut carregar la traducció castellana. Torna-ho a provar.");
  return attachSpanishTranslation(bank,translation);
}
