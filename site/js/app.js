import {loadCourse,loadContentCorrections,loadBlockBundle,loadHardDistractors,applyContentCorrections} from './catalog.js';
import {buildQuiz,buildHardQuiz,rankReviewQuestions,buildReviewQuiz} from './quiz-engine.js';
import {scoreQuiz,buildBreakdown} from './scoring.js';
import {loadState,saveState,recordAttempt,appendHistory,resetProgress} from './storage.js';
import {resolveTheme,applyTheme} from './theme.js';
import {computeProgress} from './progress.js';
import {renderHomeHtml,renderSetupHtml,renderQuestionHtml,renderResultsHtml,renderReviewHtml,showScreen} from './ui.js';

const els={
 home:document.querySelector('#home-screen'),setup:document.querySelector('#setup-screen'),quiz:document.querySelector('#quiz-screen'),results:document.querySelector('#results-screen'),review:document.querySelector('#review-screen'),live:document.querySelector('#live-region'),
 syllabus:document.querySelector('#syllabus-link'),reviewErrors:document.querySelector('#review-errors-link'),theme:document.querySelector('#theme-toggle'),langCa:document.querySelector('#language-ca'),langEs:document.querySelector('#language-es'),nav:document.querySelector('.site-header nav'),languageGroup:document.querySelector('.language-switcher')
};
const chromeCopy={
 ca:{syllabus:'Temari',review:'Repassar errors',theme:'Clar/Fosc',themeAria:'Clar/Fosc — canviar mode de color',nav:'Navegació principal',language:'Idioma',all:'Tot el temari disponible',syllabusFallback:'Temari',block:'Bloc',leave:'Vols abandonar el test en curs?',correct:'Resposta correcta',incorrect:'Resposta incorrecta',back:'← Tornar',emptyTitle:'Encara no tens preguntes pendents de repàs',emptyText:'Quan fallis alguna pregunta, apareixerà aquí per reforçar-la.',reset:'Vols esborrar l’historial, les estadístiques i els errors pendents?',loadError:'No s’ha pogut carregar el temari.',retry:'Torna-ho a provar.'},
 es:{syllabus:'Temario',review:'Repasar errores',theme:'Claro/Oscuro',themeAria:'Claro/Oscuro — cambiar modo de color',nav:'Navegación principal',language:'Idioma',all:'Todo el temario disponible',syllabusFallback:'Temario',block:'Bloque',leave:'¿Quieres abandonar el test en curso?',correct:'Respuesta correcta',incorrect:'Respuesta incorrecta',back:'← Volver',emptyTitle:'Todavía no tienes preguntas pendientes de repaso',emptyText:'Cuando falles alguna pregunta, aparecerá aquí para reforzarla.',reset:'¿Quieres borrar el historial, las estadísticas y los errores pendientes?',loadError:'No se ha podido cargar el temario.',retry:'Vuelve a intentarlo.'}
};

let course=null,banks=[],state=loadState(),selection='all',setup={mode:'study',count:10,penaltyEnabled:false,review:false},session=null,lastResult=null,currentScreen='home-screen';
const prefersDark=()=>window.matchMedia?.('(prefers-color-scheme: dark)').matches??false;
const language=()=>state.language==='es'?'es':'ca';
const t=()=>chromeCopy[language()];
const isExamMode=mode=>mode==='exam'||mode==='hard-exam';
function syncTheme(){applyTheme(resolveTheme(state.theme,prefersDark()));}
function syncLanguageChrome(){
 const lang=language(); document.documentElement.lang=state.language=lang;
 els.langCa.setAttribute('aria-pressed',String(lang==='ca')); els.langEs.setAttribute('aria-pressed',String(lang==='es'));
 els.syllabus.textContent=t().syllabus; els.reviewErrors.textContent=t().review; els.theme.textContent=t().theme; els.theme.setAttribute('aria-label',t().themeAria); els.nav.setAttribute('aria-label',t().nav); els.languageGroup.setAttribute('aria-label',t().language);
}
function displayScreen(id){currentScreen=id;showScreen(id);}
function allQuestions(){return banks.flatMap(b=>b.questions);}
function selectedQuestions(){if(selection==='all')return allQuestions();return banks.find(b=>b.blockId===selection)?.questions||[];}
function selectedHardDistractors(){
 const selectedBanks=selection==='all'?banks:banks.filter(bank=>bank.blockId===selection);
 return Object.assign({},...selectedBanks.map(bank=>bank.hardDistractors||{}));
}
function localizedQuestion(question,lang=language()){
 const localized=lang==='es'&&question.translations?.es?{...question,...question.translations.es}:{...question};
 if(question.memoryAid){localized.memoryAid={type:question.memoryAid.type,text:question.memoryAid[lang]};}
 return localized;
}
function localizedBankTitle(bank,lang=language()){return lang==='es'?(bank.blockTitleEs||bank.blockTitle):bank.blockTitle;}
function localizedUnitTitle(bank,lang=language()){return lang==='es'?(bank.unitTitleEs||bank.unitTitle):bank.unitTitle;}
function bankLabel(bank,lang=language()){const word=lang==='es'?'Bloque':'Bloc';return `${localizedUnitTitle(bank,lang)} · ${word} ${bank.blockNumber} — ${localizedBankTitle(bank,lang)}`;}
function blockLabel(){if(selection==='all')return t().all;const bank=banks.find(x=>x.blockId===selection);return bank?bankLabel(bank):t().syllabusFallback;}
function renderHome(){syncLanguageChrome();els.home.innerHTML=renderHomeHtml(course,banks,computeProgress(banks,state),language());displayScreen('home-screen');}
function askLeave(){return !session||session.finished||window.confirm(t().leave);}
function goHome(){if(!askLeave())return;session=null;lastResult=null;renderHome();}

function setupContext(){
 const base=setup.review?allQuestions():selectedQuestions();const pool=setup.review?rankReviewQuestions(base,state.errorScores):base;const pendingReview=base.filter(q=>(state.errorScores[q.id]||0)>0).length;
 return {base,pool,pendingReview};
}
function renderSetupScreen(){const {pool,pendingReview}=setupContext();els.setup.innerHTML=renderSetupHtml({label:setup.review?t().review:blockLabel(),...setup,available:pool.length,pendingReview},language());displayScreen('setup-screen');bindSetup();}
function openSetup(sel,review=false){if(!askLeave())return;selection=sel;setup={mode:'study',count:10,penaltyEnabled:false,review};renderSetupScreen();}
function bindSetup(){
 els.setup.querySelector('[data-action="home"]')?.addEventListener('click',goHome);
 els.setup.onchange=e=>{if(e.target.name==='mode'){setup.mode=e.target.value;const field=els.setup.querySelector('#penalty-field');if(field)field.hidden=!isExamMode(setup.mode);}if(e.target.name==='count')setup.count=e.target.value==='all'?'all':Number(e.target.value);if(e.target.name==='penalty')setup.penaltyEnabled=e.target.value==='on';};
 els.setup.querySelector('#start-quiz')?.addEventListener('click',startQuiz);
}
function renderEmptyReview(){els.setup.innerHTML=`<div class="panel"><button data-action="home" class="back-button" type="button">${t().back}</button><div class="empty-state"><h1>${t().emptyTitle}</h1><p>${t().emptyText}</p></div></div>`;displayScreen('setup-screen');els.setup.querySelector('[data-action="home"]').addEventListener('click',goHome);}
function startQuiz(){
 const base=setup.review?allQuestions():selectedQuestions();
 const reviewMode=setup.review||setup.mode==='review';
 const pool=reviewMode?rankReviewQuestions(base,state.errorScores):base;
 if(!pool.length){renderEmptyReview();return;}
 let questions;
 if(reviewMode)questions=buildReviewQuiz(base,state.errorScores,setup.count);
 else if(setup.mode==='hard-exam')questions=buildHardQuiz(pool,selectedHardDistractors(),setup.count);
 else questions=buildQuiz(pool,setup.count);
 session={questions,index:0,answers:{},mode:reviewMode?'review':setup.mode,penaltyEnabled:isExamMode(setup.mode)&&setup.penaltyEnabled,revealed:false,finished:false,recorded:new Set()};
 renderCurrent();
}
function renderCurrent(){const q=session.questions[session.index];const visibleQuestion=localizedQuestion(q);els.quiz.innerHTML=renderQuestionHtml({question:visibleQuestion,index:session.index,total:session.questions.length,mode:isExamMode(session.mode)?'exam':'study',selected:session.answers[q.id]??null,revealed:session.revealed},language());displayScreen('quiz-screen');for(const btn of els.quiz.querySelectorAll('[data-answer-option]'))btn.addEventListener('click',()=>chooseAnswer(Number(btn.dataset.index)));els.quiz.querySelector('#next-question')?.addEventListener('click',nextQuestion);}
function chooseAnswer(index){const q=session.questions[session.index];if(!isExamMode(session.mode)&&session.revealed)return;session.answers[q.id]=index;if(isExamMode(session.mode)){renderCurrent();return;}session.revealed=true;if(!session.recorded.has(q.id)){const outcome=index===q.correct?'correct':'incorrect';state=recordAttempt(state,q.id,outcome);session.recorded.add(q.id);saveState(state);els.live.textContent=outcome==='correct'?t().correct:t().incorrect;}renderCurrent();}
function nextQuestion(){if(!isExamMode(session.mode)&&!session.revealed)return;if(session.index<session.questions.length-1){session.index++;session.revealed=false;renderCurrent();return;}finishQuiz();}
function localizedQuestionsForBreakdown(){return session.questions.map(q=>{const visible=localizedQuestion(q);const bank=banks.find(b=>b.blockId===q.block);return {...visible,block:bank?bankLabel(bank):q.block};});}
function currentResult(){return {...lastResult,breakdown:buildBreakdown(localizedQuestionsForBreakdown(),session.answers)};}
function renderResultsScreen(){els.results.innerHTML=renderResultsHtml(currentResult(),language());displayScreen('results-screen');els.results.querySelector('#review-answers').addEventListener('click',renderReviewScreen);els.results.querySelector('[data-action="home"]').addEventListener('click',()=>{session=null;lastResult=null;renderHome();});}
function renderReviewScreen(){const items=session.questions.map(q=>({question:localizedQuestion(q),selected:session.answers[q.id]??null}));els.review.innerHTML=renderReviewHtml(items,language());displayScreen('review-screen');els.review.querySelector('[data-action="results"]').addEventListener('click',renderResultsScreen);}
function finishQuiz(){if(isExamMode(session.mode)){for(const q of session.questions){const selected=session.answers[q.id];const outcome=selected==null?'blank':selected===q.correct?'correct':'incorrect';state=recordAttempt(state,q.id,outcome);}}const score=scoreQuiz(session.questions,session.answers,session.penaltyEnabled);state=appendHistory(state,{id:crypto.randomUUID?.()||String(Date.now()),completedAt:new Date().toISOString(),selection:(setup.review||setup.mode==='review')?'review':selection,mode:session.mode,requestedCount:setup.count,penaltyEnabled:session.penaltyEnabled,...score});saveState(state);session.finished=true;lastResult={score,breakdown:{byBlock:{},byTopic:{}},penaltyEnabled:session.penaltyEnabled};renderResultsScreen();}
function rerenderCurrentScreen(){syncLanguageChrome();if(currentScreen==='home-screen')renderHome();else if(currentScreen==='setup-screen'){if(els.setup.querySelector('.empty-state'))renderEmptyReview();else renderSetupScreen();}else if(currentScreen==='quiz-screen'&&session)renderCurrent();else if(currentScreen==='results-screen'&&lastResult)renderResultsScreen();else if(currentScreen==='review-screen'&&session)renderReviewScreen();}
function setLanguage(lang){if(lang!=='ca'&&lang!=='es')return;if(state.language===lang){syncLanguageChrome();return;}state.language=lang;saveState(state);rerenderCurrentScreen();}

function bindGlobal(){
 document.querySelector('#home-link').addEventListener('click',goHome);els.syllabus.addEventListener('click',goHome);els.reviewErrors.addEventListener('click',()=>openSetup('all',true));
 els.langCa.addEventListener('click',()=>setLanguage('ca'));els.langEs.addEventListener('click',()=>setLanguage('es'));
 els.theme.addEventListener('click',()=>{const current=resolveTheme(state.theme,prefersDark());state.theme=current==='dark'?'light':'dark';saveState(state);syncTheme();});
 els.home.addEventListener('click',e=>{const card=e.target.closest('[data-block-card]');if(card)openSetup(card.dataset.selection,false);if(e.target.closest('#reset-progress')){if(window.confirm(t().reset)){resetProgress();state=loadState();syncTheme();syncLanguageChrome();renderHome();}}});
}
async function init(){try{syncTheme();syncLanguageChrome();[course]=await Promise.all([loadCourse()]);const corrections=await loadContentCorrections();banks=await Promise.all(course.blocks.map(async meta=>{
 const [loadedBank,hard]=await Promise.all([
  loadBlockBundle(meta.file,meta.extraFile,fetch,meta.translationFile,meta.memoryAidFile,meta.additionalFiles||[],meta.additionalTranslationFiles||[],meta.additionalMemoryAidFiles||[]),
  loadHardDistractors(meta.hardDistractorFile,meta.id,fetch)
 ]);
 let bank=loadedBank;
 if(bank.blockId!==meta.id)throw new Error('El banc no correspon al bloc declarat al curs.');
 bank=applyContentCorrections(bank,corrections);
 return {...bank,hardDistractors:hard.questions,blockTitleEs:meta.titleEs||bank.blockTitleEs,unitId:meta.unitId,unitTitle:meta.unitTitle,unitTitleEs:meta.unitTitleEs,blockNumber:meta.blockNumber};
}));bindGlobal();renderHome();}catch(error){syncLanguageChrome();els.home.innerHTML=`<div class="error-message"><strong>${t().loadError}</strong><p>${t().retry}</p></div>`;console.error(error);}}
init();
