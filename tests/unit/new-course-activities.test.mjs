import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateNewCourseData,createNewCourseState,inventoryExpected,housingResults,bookBalance,makeBookCsv,renderNewCourseHtml} from '../../site/js/new-course-activities.js';
const data=JSON.parse(await readFile(new URL('../../site/data/new-course-activities-202610.json',import.meta.url),'utf8'));
test('five sources with hashes and three fully balanced inventory cases',()=>{
 assert.equal(validateNewCourseData(data),data);
 const expected=[[57,12,18,37],[21,75,14,19],[24,33,24,10]];
 data.inventory.cases.forEach((c,i)=>{assert.deepEqual(inventoryExpected(c).final,expected[i]);assert.equal(inventoryExpected(c).rows.length,8)});
});
test('tampering inventory final quantity is rejected',()=>{
 const copy=structuredClone(data);copy.inventory.cases[0].expectedFinal[0]++;
 assert.throws(()=>validateNewCourseData(copy),/inconsistent answer key/);
});
test('cash and bank books compute sequential balances and detect overlapping amounts',()=>{
 const book={initial:'20,50',rows:[{entrada:'10',sortida:''},{entrada:'',sortida:'4,25'}]};
 assert.deepEqual(bookBalance(book),{rows:[30.5,26.25],invalid:false});
 assert.match(makeBookCsv(book),/26,25/);
 const bad={initial:'0',rows:[{entrada:'10',sortida:'2'}]};
 assert.equal(bookBalance(bad).invalid,true);
});
test('CSV text that could execute a spreadsheet formula is neutralized',()=>{
 const book={initial:'0',rows:[{data:'14/10/2026',concepte:'=HYPERLINK("bad")',entrada:'1',sortida:''}]};
 assert.match(makeBookCsv(book),/'=HYPERLINK/);
});
test('housing calculations exactly apply classroom assumptions',()=>{
 const r=housingResults(data.housing,700,140000);
 assert.equal(r.rentInitial,1900);
 assert.equal(r.buyInitial,42500);
 assert.equal(r.loan,112000);
 assert.equal(r.rentMonthly,890);
 assert.ok(r.mortgage>470&&r.mortgage<475);
 assert.equal(r.rentLeft,1410);
 assert.equal(housingResults(data.housing,0,140000),null);
});
test('all three practical learning surfaces render in Catalan and Spanish',()=>{
 const state=createNewCourseState();
 assert.match(renderNewCourseHtml(data,'ca',state),/Control de material per a enviaments/);
 state.tab='books';assert.match(renderNewCourseHtml(data,'es',state),/Libro auxiliar de caja/);
 state.tab='housing';assert.match(renderNewCourseHtml(data,'es',state),/Alquilar o comprar/);
});
