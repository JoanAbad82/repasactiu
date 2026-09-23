import {readFile} from 'node:fs/promises';

const bank=JSON.parse(await readFile(new URL('../site/data/key-lists-v1.json',import.meta.url),'utf8'));
const errors=[];
const EXPECTED_BY_BLOCK={
  'bloc-1':2,
  'bloc-2':5,
  'bloc-3':5,
  'bloc-4':4,
  'bloc-5':4,
  'unitat-2-bloc-1':10,
  'uf0518-bloc-1':6,
  'uf0518-bloc-2':9,
  'uf0518-bloc-3':8
};
const SOURCE_LIMITS={B1:19,B2:33,B3:35,B4:34,B5:24,U2B1:119,UF0518_B1:28,UF0518_B2:39,UF0518_B3:50};

if(bank.version!==1)errors.push('version != 1');
if(bank.count!==53)errors.push('count != 53');
if(!Array.isArray(bank.entries)||bank.entries.length!==53)errors.push('entries != 53');
if(!Array.isArray(bank.groups)||bank.groups.length!==9)errors.push('groups != 9');
if(!Array.isArray(bank.families)||bank.families.length!==6)errors.push('families != 6');

const ids=new Set();
for(const entry of bank.entries||[]){
  if(!entry.id||ids.has(entry.id))errors.push(`id duplicat o buit: ${entry.id}`);
  ids.add(entry.id);
  if(!EXPECTED_BY_BLOCK[entry.blockId])errors.push(`${entry.id}: bloc desconegut ${entry.blockId}`);
  if(typeof entry.ordered!=='boolean')errors.push(`${entry.id}: ordered invàlid`);
  if(!entry.source?.id||!SOURCE_LIMITS[entry.source.id])errors.push(`${entry.id}: font desconeguda`);
  const [start,end=start]=entry.source?.pages||[];
  if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>SOURCE_LIMITS[entry.source?.id]){
    errors.push(`${entry.id}: rang de pàgines invàlid`);
  }
  for(const lang of ['ca','es']){
    const item=entry[lang];
    if(!item?.title||!Array.isArray(item.items)||item.items.length<3)errors.push(`${entry.id}: contingut ${lang} incomplet`);
  }
  if(entry.ca?.items?.length!==entry.es?.items?.length)errors.push(`${entry.id}: nombre d'elements CA/ES diferent`);
}

for(const [blockId,expected] of Object.entries(EXPECTED_BY_BLOCK)){
  const actual=(bank.entries||[]).filter(entry=>entry.blockId===blockId).length;
  if(actual!==expected)errors.push(`${blockId}: ${actual}/${expected} llistes`);
}

const assigned=(bank.families||[]).flatMap(family=>family.entryIds||[]);
if(assigned.length!==53)errors.push('family assignments != 53');
if(new Set(assigned).size!==53)errors.push('family assignments contain duplicates');
if(assigned.some(id=>!ids.has(id)))errors.push('family assignment points to unknown list');

const ordered=(bank.entries||[]).filter(entry=>entry.ordered).length;
if(ordered!==9)errors.push(`ordered lists: ${ordered}/9`);

if(errors.length){
  console.error('KEY_LIST_AUDIT=FAIL');
  for(const error of errors)console.error('- '+error);
  process.exit(1);
}
console.log('KEY_LIST_AUDIT=PASS');
console.log('KEY_LISTS=53');
console.log('KEY_LIST_FAMILIES=6');
console.log('ORDERED_LISTS=9');
