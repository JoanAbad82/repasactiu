import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(path,'utf8');

test('els auditors no codifiquen 450 com a total publicat',async()=>{
  const files=[
    'scripts/validate-question-banks.mjs',
    'scripts/audit-bilingual-contract.mjs',
    'scripts/validate-source-traceability.mjs'
  ];
  for(const file of files){
    const text=await read(file);
    assert.equal(/(?:!==|===|!=|==)\s*450\b/.test(text),false,`${file} encara fixa el total a 450`);
  }
});
