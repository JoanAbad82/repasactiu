export function shuffleArray(items,rng=Math.random){const copy=[...items]; for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]];} return copy;}
export function shuffleQuestionOptions(question,rng=Math.random){
  const tagged=question.options.map((text,originalIndex)=>({text,originalIndex}));
  const shuffled=shuffleArray(tagged,rng);
  const correct=shuffled.findIndex(x=>x.originalIndex===question.correct);
  const translations=question.translations
    ? Object.fromEntries(Object.entries(question.translations).map(([lang,translation])=>[
        lang,
        Array.isArray(translation?.options)&&translation.options.length===question.options.length
          ? {...translation,options:shuffled.map(({originalIndex})=>translation.options[originalIndex])}
          : translation
      ]))
    : question.translations;
  return {...question,options:shuffled.map(x=>x.text),correct,translations};
}
export function buildQuiz(questions,requestedCount,rng=Math.random){const shuffled=shuffleArray(questions,rng); const count=requestedCount==="all"?shuffled.length:Math.min(Number(requestedCount),shuffled.length); return shuffled.slice(0,count).map(q=>shuffleQuestionOptions(q,rng));}
export function rankReviewQuestions(questions,errorScores,rng=Math.random){const eligible=questions.filter(q=>(errorScores[q.id]||0)>0); const tie=new Map(eligible.map(q=>[q.id,rng()])); return [...eligible].sort((a,b)=>((errorScores[b.id]||0)-(errorScores[a.id]||0)) || tie.get(a.id)-tie.get(b.id));}

export function buildReviewQuiz(questions,errorScores,requestedCount,rng=Math.random){const ranked=rankReviewQuestions(questions,errorScores,rng); const count=requestedCount==="all"?ranked.length:Math.min(Number(requestedCount),ranked.length); return ranked.slice(0,count).map(q=>shuffleQuestionOptions(q,rng));}
