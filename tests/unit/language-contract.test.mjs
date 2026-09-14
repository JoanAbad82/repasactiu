import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app=await readFile("site/js/app.js","utf8");
const index=await readFile("site/index.html","utf8");

test("el document parteix en català i exposa un selector Català/Castellano",()=>{
  assert.match(index,/lang="ca"/);
  assert.match(index,/id="language-ca"/);
  assert.match(index,/id="language-es"/);
  assert.match(index,/>Català</);
  assert.match(index,/>Castellano</);
});

test("l'aplicació aplica l'idioma guardat al document",()=>{
  assert.match(app,/document\.documentElement\.lang/);
  assert.match(app,/state\.language/);
});
