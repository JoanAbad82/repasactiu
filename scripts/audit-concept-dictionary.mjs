import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bank=JSON.parse(await readFile(path.join(root,'site','data','concept-dictionary-v1.json'),'utf8'));

const EXPECTED={
  'bloc-1':6,
  'bloc-2':10,
  'bloc-3':10,
  'bloc-4':4,
  'bloc-5':10,
  'unitat-2-bloc-1':7,
  'uf0518-bloc-1':7,
  'uf0518-bloc-2':9,
  'uf0518-bloc-3':12,
  'uf0519-bloc-1':5,
  'uf0519-bloc-2':8,
  'uf0519-bloc-3':6,
  'uf0519-bloc-4':4,
  'uf0519-bloc-5':2
};

const EXPECTED_FAMILIES={
  'entity-company-forms':['b2-lucrativa-no-lucrativa','b2-empresa-individual','b2-societat','b2-personalitat-juridica','b2-sa-sl','b2-cooperativa'],
  'organization-structure-authority':['b3-formal-informal','b3-organigrama','b3-autoritat','b3-unitat-direccio','b3-coordinacio','b3-delegacio','b3-descentralitzacio','b3-especialitzacio','b3-participacio','b3-publicitat-transparencia'],
  'management-administration':['b1-funcio-direccio','b2-planificar-organitzar','b1-funcio-administrativa','b1-funcio-financera','b1-recursos-humans','b2-controlar-auditar'],
  'hierarchy-position':['u2-estatus','u2-rol','b2-jerarquia-rang','b2-jerarquia-capacitat'],
  'business-information':['b4-info-financera','b4-info-fiscal','b4-info-mercantil','b4-info-personal'],
  'public-administration-state':['b1-entitat-publica','b1-entitat-privada','b5-poders-estat','b5-ts-tc','b5-comunitat-autonoma','b5-administracio-local'],
  'european-union':['b5-ue','b5-parlament-consell-comissio','b5-consell-europeu','b5-tjue','b5-reglament-directiva','b5-transposicio'],
  'team-groups':['u2-interes-amics','u2-cohesio','u2-fases-equip','u2-sinergia','u2-valors-etics'],
  'written-communication':['uf-emissor-receptor','uf-missatge','uf-canal-codi','uf-qualitat-text','uf-memo-circular','uf-sollicitud','uf-exposo-sollicito'],
  'correspondence-shipping-security':['uf2-tracabilitat','uf2-registre-entrada-sortida','uf2-embalatge-empaquetatge','uf2-carta-ordinaria-certificada','uf2-burofax-valor-probatori','uf2-asseguranca-valor-declarat'],
  'document-archive-management':['uf3-arxiu-documental','uf3-control-arxiu','uf3-classificar-arxivar','uf3-sistemes-classificacio','uf3-metadades','uf3-conservacio-mercantil-fiscal','uf2-rgpd-lopdgdd','uf2-proteccio-custodia','uf3-drets-persones'],
  'digital-office-communication':['uf3-pagina-lloc-web','uf3-estatica-dinamica','uf3-portals-web','uf3-transferencia-fitxers','uf2-cc-cco','uf3-phishing'],
  'administrative-documents-procedure':['uf519-document-administratiu','uf519-circuit-documental','uf519-registre-general-auxiliar','uf519-silenci-administratiu','uf519-resolucio-administrativa','uf519-informe','uf519-acta','uf519-certificat','uf519-memoria'],
  'commercial-documents-invoicing':['uf519-pressupost','uf519-comanda','uf519-albara','uf519-factura-rectificativa','uf519-factura-recapitulativa','uf519-verifactu','uf519-iva-repercutit-suportat','uf519-rebut'],
  'payroll-labour':['uf519-nomina','uf519-meritacions','uf519-deduccions','uf519-base-cotitzacio','uf519-salari-brut-net','uf519-ordre-treball'],
  'administrative-software':['uf519-programari-facturacio','uf519-programari-nomines']
};

const SOURCE_LIMITS={B1:19,B2:33,B3:35,B4:34,B5:24,U2B1:119,UF0518_B1:28,UF0518_B2:39,UF0518_B3:50,UF0519_U1:76};
const errors=[];

if(bank.version!==1)errors.push('version != 1');
if(bank.count!==100)errors.push('count != 100');
if(!Array.isArray(bank.entries)||bank.entries.length!==100)errors.push('entries != 100');
if(!Array.isArray(bank.groups)||bank.groups.length!==14)errors.push('groups != 14');
if(!Array.isArray(bank.families)||bank.families.length!==16)errors.push('families != 16');
if(!Array.isArray(bank.languages)||bank.languages.join(',')!=='ca,es')errors.push('languages must be ca,es');

const ids=new Set();
const terms={ca:new Set(),es:new Set()};
const counts={};

for(const entry of bank.entries||[]){
  if(!entry.id||ids.has(entry.id))errors.push('duplicate/empty id: '+entry.id);
  ids.add(entry.id);
  counts[entry.blockId]=(counts[entry.blockId]||0)+1;

  const maxPage=SOURCE_LIMITS[entry.source?.id];
  const pages=entry.source?.pages;
  if(!maxPage||!Array.isArray(pages)||pages.length!==2)errors.push(entry.id+': invalid source');
  else if(!Number.isInteger(pages[0])||!Number.isInteger(pages[1])||pages[0]<1||pages[1]<pages[0]||pages[1]>maxPage){
    errors.push(entry.id+': invalid page range');
  }

  for(const lang of ['ca','es']){
    const item=entry[lang]||{};
    const term=String(item.term||'').trim();
    const definition=String(item.definition||'').trim();
    const memory=String(item.memory||'').trim();
    if(!term||!definition||!memory)errors.push(entry.id+': incomplete '+lang);
    const key=term.toLocaleLowerCase(lang);
    if(terms[lang].has(key))errors.push(entry.id+': duplicate term '+lang+' '+term);
    terms[lang].add(key);
    if(term.length>70)errors.push(entry.id+': term too long '+lang);
    if(definition.length>260)errors.push(entry.id+': definition too long '+lang);
    if(memory.length>140)errors.push(entry.id+': memory cue too long '+lang);
    if(/[?]$/.test(term))errors.push(entry.id+': term should not be a question '+lang);
  }
}


const assigned=[];
for(const family of bank.families||[]){
  if(!family.id||!family.ca||!family.es||!Array.isArray(family.entryIds)||!family.entryIds.length){
    errors.push('invalid family '+String(family.id));
    continue;
  }
  const expected=EXPECTED_FAMILIES[family.id];
  if(!expected)errors.push('unexpected family '+family.id);
  else if(JSON.stringify(family.entryIds)!==JSON.stringify(expected))errors.push('family order/membership mismatch '+family.id);
  assigned.push(...family.entryIds);
}
if(assigned.length!==100)errors.push('family assignments != 100');
if(new Set(assigned).size!==100)errors.push('family assignments contain duplicates');
for(const id of ids){
  if(!assigned.includes(id))errors.push('unassigned concept '+id);
}
for(const id of assigned){
  if(!ids.has(id))errors.push('family references unknown concept '+id);
}
if((bank.families||[]).map(x=>x.id).join(',')!==Object.keys(EXPECTED_FAMILIES).join(',')){
  errors.push('family sequence mismatch');
}

for(const [blockId,count] of Object.entries(EXPECTED)){
  if(counts[blockId]!==count)errors.push(blockId+': '+(counts[blockId]||0)+'/'+count);
}
for(const blockId of Object.keys(counts)){
  if(!(blockId in EXPECTED))errors.push('unexpected block '+blockId);
}

if(errors.length)throw new Error('CONCEPT_DICTIONARY_AUDIT=FAIL\n- '+errors.join('\n- '));
console.log('CONCEPT_DICTIONARY_AUDIT=PASS');
console.log('CONCEPTS=100');
console.log('BLOCK_COUNTS='+JSON.stringify(counts));
console.log('LANGUAGES=ca,es');
console.log('CONCEPT_FAMILIES=16');
console.log('FAMILY_ORDER='+bank.families.map(x=>x.id).join(' > '));
