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

test("el peu mostra l'avís de material i el pot traduir al castellà",()=>{
  assert.match(index,/class="site-footer"/);
  assert.match(index,/id="material-notice-title"/);
  assert.match(index,/id="material-notice-primary"/);
  assert.match(index,/id="material-notice-temporary"/);
  assert.match(index,/Avís sobre el material/);
  assert.match(index,/Repàs Actiu és una eina de suport a l’estudi compartida amb el grup de classe\./);
  assert.match(index,/Aquest espai té caràcter temporal/);
  assert.match(app,/Aviso sobre el material/);
  assert.match(app,/Repàs Actiu es una herramienta de apoyo al estudio compartida con el grupo de clase\./);
  assert.match(app,/Este espacio tiene carácter temporal/);
});
