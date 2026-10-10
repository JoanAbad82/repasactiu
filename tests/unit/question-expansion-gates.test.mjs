import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const dataDir=path.join(root,'site','data');
const course=JSON.parse(await readFile(path.join(dataDir,'course.json'),'utf8'));
const expected={
  'bloc-1':{count:60,last:'b1-060'},
  'bloc-2':{count:80,last:'b2-080'},
  'bloc-3':{count:80,last:'b3-080'},
  'bloc-4':{count:70,last:'b4-070'},
  'bloc-5':{count:70,last:'b5-070'},
  'unitat-2-bloc-1':{count:150,last:'u2b1-150'},
  'uf0518-bloc-1':{count:86,last:'uf0518-b1-086'},
  'uf0518-bloc-2':{count:70,last:'uf0518-b2-070'},
  'uf0518-bloc-3':{count:80,last:'uf0518-b3-080'},
  'uf0519-bloc-1':{count:28,last:'uf0519-b1-028'},
  'uf0519-bloc-2':{count:51,last:'uf0519-b2-051'},
  'uf0519-bloc-3':{count:30,last:'uf0519-b3-030'},
  'uf0519-bloc-4':{count:32,last:'uf0519-b4-032'},
  'uf0519-bloc-5':{count:31,last:'uf0519-b5-031'},
  'uf0519-unitat-2-bloc-1':{count:30,last:'uf0519-b5-061'},
  'uf0519-unitat-2-bloc-2':{count:41,last:'uf0519-u2b2-041'},
  'uf0519-bloc-6':{count:20,last:'uf0519-b6-012'},
  'uf0519-unitat-3-bloc-1':{count:27,last:'uf0519-u3b1-027'}
};
const readData=async p=>JSON.parse(await readFile(path.join(dataDir,p.replace(/^data\//,'')),'utf8'));

test('el catàleg publica 1036 preguntes amb UF0519 Unitats 1, 2 i 3 separades',async()=>{
  let total=0;
  for(const block of course.blocks){
    const questions=[];
    for(const file of [block.file,block.extraFile,...(block.additionalFiles||[])].filter(Boolean)){
      const bank=await readData(file);
      questions.push(...bank.questions);
    }
    assert.equal(questions.length,expected[block.id].count,block.id);
    assert.ok(questions.some(q=>q.id===expected[block.id].last),`${block.id}: falta ${expected[block.id].last}`);
    total+=questions.length;
  }
  assert.equal(total,1036);
});

test('totes les preguntes publicades existeixen també al Mode Examen difícil',async()=>{
  for(const block of course.blocks){
    const hard=await readData(block.hardDistractorFile);
    assert.equal(Object.keys(hard.questions).length,expected[block.id].count,block.id);
    assert.ok(hard.questions[expected[block.id].last],`${block.id}: overlay absent per ${expected[block.id].last}`);
  }
});
