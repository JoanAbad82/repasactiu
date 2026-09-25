export const CHRONOLOGY_SOURCE_ORDER=[
  'B1','B2','B3','B4','B5','U2B1',
  'UF0518_B1','UF0518_B2','UF0518_B3',
  'UF0519_U1','MF0969_PRESENTACIO'
];

const SOURCE_RANK=new Map(CHRONOLOGY_SOURCE_ORDER.map((id,index)=>[id,index]));

export function normalizeChronologyConcept(value){
  return String(value??'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ')
    .trim()
    .replace(/\s+/g,' ')
    .toLocaleLowerCase('ca');
}

export function resolveSourceId(rawSourceId,blockId,fallbackId=null){
  const raw=String(rawSourceId||fallbackId||'').trim().toUpperCase();
  if(!raw)return null;
  if(raw==='U2')return 'U2B1';
  if(raw==='UF0519')return 'UF0519_U1';
  if(raw==='MF0969')return 'MF0969_PRESENTACIO';
  if(raw==='UF0518'){
    if(blockId==='uf0518-bloc-2')return 'UF0518_B2';
    if(blockId==='uf0518-bloc-3')return 'UF0518_B3';
    return 'UF0518_B1';
  }
  return raw;
}

export function chronologyKey(item){
  const sourceRef=item?.sourceRef;
  const sourceId=resolveSourceId(sourceRef?.id,item?.blockId);
  const range=sourceRef?.pageRange;
  if(!sourceId||!SOURCE_RANK.has(sourceId))throw new Error(`${item?.id||'item'}: font cronològica desconeguda ${sourceId||''}`.trim());
  if(!Array.isArray(range)||range.length!==2||!range.every(Number.isInteger)||range[0]<1||range[1]<range[0]){
    throw new Error(`${item?.id||'item'}: rang de pàgines cronològic invàlid`);
  }
  return {
    sourceId,
    sourceRank:SOURCE_RANK.get(sourceId),
    pageStart:range[0],
    pageEnd:range[1],
    concept:normalizeChronologyConcept(item?.chronologyConcept||item?.topic||item?.conceptId||item?.question||item?.id),
    stableId:String(item?.id||'')
  };
}

export function compareChronology(a,b){
  const A=chronologyKey(a),B=chronologyKey(b);
  return A.sourceRank-B.sourceRank ||
    A.pageStart-B.pageStart ||
    A.pageEnd-B.pageEnd ||
    A.concept.localeCompare(B.concept,'ca') ||
    A.stableId.localeCompare(B.stableId,'en',{numeric:true});
}

export function sortChronologically(items){
  return [...items].sort(compareChronology);
}

export function chronologyInversions(items){
  const inversions=[];
  for(let index=1;index<(items||[]).length;index++){
    if(compareChronology(items[index-1],items[index])>0){
      inversions.push({index,previous:items[index-1]?.id,current:items[index]?.id});
    }
  }
  return inversions;
}
