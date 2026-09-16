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

function mergeIndexedSupplements(blockId,supplements,errorMessage){
  const merged={blockId,questions:{}};
  for(const supplement of supplements){
    if(supplement.blockId!==blockId||!supplement.questions||Array.isArray(supplement.questions))throw new Error(errorMessage);
    if(supplement.blockTitle&&!merged.blockTitle)merged.blockTitle=supplement.blockTitle;
    for(const [id,value] of Object.entries(supplement.questions)){
      if(Object.hasOwn(merged.questions,id))throw new Error(errorMessage);
      merged.questions[id]=value;
    }
  }
  return merged;
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

async function loadIndexedSupplements(files,fetchImpl,userMessage){
  return Promise.all(files.map(file=>readJson(file,fetchImpl,userMessage)));
}

export async function loadBlockBundle(
  file,
  extraFile,
  fetchImpl=fetch,
  translationFile=null,
  memoryAidFile=null,
  additionalFiles=[],
  additionalTranslationFiles=[],
  additionalMemoryAidFiles=[]
){
  const base=await loadBlock(file,fetchImpl);
  let bank=base;
  const bankFiles=[extraFile,...additionalFiles].filter(Boolean);
  for(const supplementalFile of bankFiles){
    const supplemental=await loadBlock(supplementalFile,fetchImpl);
    if(supplemental.blockId!==base.blockId)throw new Error("El banc addicional no correspon al bloc principal.");
    bank={...bank,questions:[...bank.questions,...supplemental.questions]};
  }

  const translationFiles=[translationFile,...additionalTranslationFiles].filter(Boolean);
  if(translationFiles.length){
    const translations=await loadIndexedSupplements(translationFiles,fetchImpl,"No s’ha pogut carregar la traducció castellana. Torna-ho a provar.");
    const translation=mergeIndexedSupplements(base.blockId,translations,"La traducció de preguntes no coincideix amb el banc principal.");
    bank=attachSpanishTranslation(bank,translation);
  }

  const memoryFiles=[memoryAidFile,...additionalMemoryAidFiles].filter(Boolean);
  if(memoryFiles.length){
    const memorySupplements=await loadIndexedSupplements(memoryFiles,fetchImpl,"No s’han pogut carregar les ajudes de memòria. Torna-ho a provar.");
    const memoryAids=mergeIndexedSupplements(base.blockId,memorySupplements,"Les ajudes de memòria no coincideixen amb el banc principal.");
    bank=attachMemoryAids(bank,memoryAids);
  }
  return bank;
}
