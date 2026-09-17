import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const pkg=JSON.parse(await readFile(new URL('../../package.json',import.meta.url),'utf8'));

test('audit:full executa explícitament l auditoria de qualitat de contingut',()=>{
  assert.equal(pkg.scripts['test:audit:content'],'node scripts/content-quality-lib.mjs');
  assert.match(pkg.scripts['audit:full'],/npm run test:audit:content/);
});
