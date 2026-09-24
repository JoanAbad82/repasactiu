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
  'uf0518-bloc-3':8,
  'uf0519-bloc-1':6,
  'uf0519-bloc-2':7,
  'uf0519-bloc-3':4,
  'uf0519-bloc-4':1,
  'uf0519-bloc-5':7
};
const SOURCE_LIMITS={B1:19,B2:33,B3:35,B4:34,B5:24,U2B1:119,UF0518_B1:28,UF0518_B2:39,UF0518_B3:50,UF0519_U1:76,MF0969_PRESENTACIO:22};

if(bank.version!==1)errors.push('version != 1');
if(bank.count!==78)errors.push('count != 78');
if(!Array.isArray(bank.entries)||bank.entries.length!==78)errors.push('entries != 78');
if(!Array.isArray(bank.groups)||bank.groups.length!==14)errors.push('groups != 14');
if(!Array.isArray(bank.families)||bank.families.length!==11)errors.push('families != 11');

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
if(assigned.length!==78)errors.push('family assignments != 78');
if(new Set(assigned).size!==78)errors.push('family assignments contain duplicates');
if(assigned.some(id=>!ids.has(id)))errors.push('family assignment points to unknown list');

const ordered=(bank.entries||[]).filter(entry=>entry.ordered).length;
if(ordered!==13)errors.push(`ordered lists: ${ordered}/13`);

if(errors.length){
  console.error('KEY_LIST_AUDIT=FAIL');
  for(const error of errors)console.error('- '+error);
  process.exit(1);
}
console.log('KEY_LIST_AUDIT=PASS');
console.log('KEY_LISTS=78');
console.log('KEY_LIST_FAMILIES=11');
console.log('ORDERED_LISTS=13');
