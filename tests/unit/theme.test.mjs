import test from "node:test"; import assert from "node:assert/strict"; import {resolveTheme} from "../../site/js/theme.js";
test("system dark",()=>assert.equal(resolveTheme("system",true),"dark"));
test("system light",()=>assert.equal(resolveTheme("system",false),"light"));
test("explícit preval",()=>{assert.equal(resolveTheme("light",true),"light");assert.equal(resolveTheme("dark",false),"dark");});
