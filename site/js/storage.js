const STORAGE_KEY="repasActiu:v1";
export function createDefaultState(){return{version:1,theme:"system",errorScores:{},questionStats:{},history:[]};}
export function loadState(storage=window.localStorage){const raw=storage.getItem(STORAGE_KEY); if(!raw)return createDefaultState(); try{const p=JSON.parse(raw); if(p.version!==1)return createDefaultState(); return {...createDefaultState(),...p};}catch{return createDefaultState();}}
export function saveState(state,storage=window.localStorage){storage.setItem(STORAGE_KEY,JSON.stringify(state));}
export function recordAttempt(state,id,outcome){const n=structuredClone(state); n.questionStats[id]??={attempts:0,correct:0,incorrect:0,blank:0}; n.questionStats[id].attempts++; n.questionStats[id][outcome]++; const cur=n.errorScores[id]||0; if(outcome==="incorrect")n.errorScores[id]=cur+1; if(outcome==="correct")n.errorScores[id]=Math.max(0,cur-1); return n;}
export function appendHistory(state,summary,limit=20){const n=structuredClone(state); n.history=[...n.history,summary].slice(-limit); return n;}
export function resetProgress(storage=window.localStorage){const c=loadState(storage); const r=createDefaultState(); r.theme=c.theme; saveState(r,storage);}
