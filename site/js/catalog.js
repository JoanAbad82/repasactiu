async function readJson(url, fetchImpl, userMessage) { const response=await fetchImpl(url); if(!response.ok) throw new Error(`${userMessage} (HTTP ${response.status})`); return response.json(); }
export function loadCourse(fetchImpl=fetch){ return readJson("data/course.json",fetchImpl,"No s’ha pogut carregar el temari. Torna-ho a provar."); }
export function loadBlock(file,fetchImpl=fetch){ return readJson(file,fetchImpl,"No s’ha pogut carregar aquest bloc. Torna-ho a provar."); }
