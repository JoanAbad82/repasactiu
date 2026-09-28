// Exercicis de documents administratius i comercials (UF0519).
// Mòdul autònom: dades, validació, correcció i renderitzat del full d'exercicis.
const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const r2=value=>Math.round((value+Number.EPSILON)*100)/100;
const numberFormat=new Intl.NumberFormat("es-ES",{maximumFractionDigits:2});

const L={
 ca:{
  eyebrow:"Aplicació del temari",
  sheetOf:(n,total)=>`Full ${n} de ${total}`,
  source:"Font",
  sourceLine:t=>`${t.filename} · 9 fulls incrustats · rebut el 28/09/2026`,
  traceSummary:"El fitxer font es diu «Exercicis_1-10_unificats.docx», però només conté 9 fulls: no s’ha afegit cap full 10.",
  traceDetails:"Traçabilitat del material",
  translationNote:"Aquest full font és només en català. La versió en castellà d’aquesta pàgina és una traducció del lloc web, no text del material.",
  scenario:"Enunciat",
  reference:"Recursos de consulta",
  referenceIntro:"No cal memoritzar res: tot el que necessites per resoldre l’exercici és aquí mateix.",
  roles:"Qui fa què",
  cycle:"Cicle comercial de la compravenda",
  categoryTitle:"Categories de gestió documental",
  orderFieldsTitle:"Camps que ha de tenir una comanda",
  orderFormulaTitle:"Fórmules dels imports",
  noVat:"La font no indica cap tipus d’IVA: els totals auxiliars són abans d’impostos. No hi afegeixis IVA.",
  check:"Comprovar",
  reset:"Reiniciar full",
  hint:"Pista",
  expected:"Esperat",
  reveal:"Mostrar els valors esperats",
  wrong:"Encara hi ha camps per corregir. Revisa els marcats i torna-ho a provar.",
  correct:"Molt bé! Has resolt el full correctament.",
  guidance:"Guia",
  guidanceText:"Cada camp marcat en vermell porta la seva pista. Corregeix-lo i torna a comprovar.",
  modelTitle:"Criteris i punts model per autocorrecció",
  completed:"Full completat",
  completedHint:"Pots reiniciar-lo per practicar de nou.",
  calcTitle:"Calculadora",
  calcHelp:"Fes les operacions i envia el resultat al camp numèric que hagis seleccionat.",
  calcUse:"Usar resultat al camp seleccionat",
  calcClear:"Esborrar",
  calcNoTarget:"Selecciona primer un camp numèric de la comanda.",
  dateTitle:"Ajuda de dates",
  dateHelp:"Introdueix la data de la comanda i els dies de lliurament per obtenir la data límit.",
  dateBase:"Data d’inici",
  dateDays:"Dies a afegir",
  dateCompute:"Calcular data",
  dateCopy:"Copiar a la data de lliurament",
  dateResult:"Data calculada",
  dateInvalid:"Introdueix una data i un nombre de dies vàlids.",
  orderSections:{order:"Dades de la comanda",buyer:"Comprador",supplier:"Proveïdor",items:"Mercaderies",conditions:"Condicions",totals:"Imports"},
  itemColumns:{reference:"Referència",quantity:"Quantitat",unitPrice:"Preu unitari",lineTotal:"Import de línia"},
  fields:{
   orderNumber:"Número de comanda",orderDate:"Data de la comanda",
   buyerName:"Nom del comprador",buyerNif:"NIF del comprador",buyerAddress:"Adreça del comprador",
   supplierName:"Nom del proveïdor",supplierNif:"NIF del proveïdor",supplierAddress:"Adreça del proveïdor",
   discountPercent:"Descompte (%)",transportCost:"Cost del transport (€)",transportPayer:"Qui paga el transport",transportCarrier:"Transportista",
   deliveryAddress:"Adreça de lliurament",paymentDays:"Termini de pagament (dies)",paymentMethod:"Forma de pagament",
   maxDeliveryDays:"Termini màxim de lliurament (dies)",latestDelivery:"Data límit de lliurament",specialInstructions:"Instruccions especials",
   subtotal:"Subtotal",discountAmount:"Import del descompte",totalBeforeTax:"Total abans d’impostos"
  },
  orderHints:{
   orderNumber:"Copia el número de comanda de l’enunciat.",
   orderDate:"Selecciona la data en què es fa la comanda.",
   buyer:"Copia les dades del comprador tal com surten a l’enunciat.",
   supplier:"Copia les dades del proveïdor tal com surten a l’enunciat.",
   itemRef:"Copia la referència de cada article.",
   itemQty:"Copia la quantitat demanada de cada article.",
   itemPrice:"Copia el preu unitari de cada article.",
   itemLine:"Import de línia = quantitat × preu unitari.",
   discount:"Percentatge de descompte indicat a l’enunciat.",
   transport:"Copia les condicions de transport de l’enunciat.",
   deliveryAddress:"Adreça on s’ha de lliurar la mercaderia.",
   paymentDays:"Dies de pagament indicats a l’enunciat.",
   paymentMethod:"Forma de pagament indicada a l’enunciat.",
   maxDeliveryDays:"Dies màxims de lliurament indicats a l’enunciat.",
   latestDelivery:"Suma els dies màxims a la data de la comanda, o fes servir l’ajuda de dates.",
   specialInstructions:"Recull les instruccions especials de l’enunciat (etiquetes i colors).",
   subtotal:"Subtotal = suma de tots els imports de línia.",
   discountAmount:"Import del descompte = subtotal × % de descompte.",
   totalBeforeTax:"Total abans d’impostos = subtotal − descompte (+ transport si el paga el comprador)."
  },
  orderReferenceFields:["Número i data de la comanda","Nom, NIF i adreça del comprador","Nom, NIF i adreça del proveïdor","Referència, quantitat i preu unitari de cada article","Import de cada línia","Descompte, si n’hi ha","Transport (cost, pagador i transportista), si n’hi ha","Adreça de lliurament","Termini i forma de pagament","Dies màxims i data límit de lliurament","Instruccions especials, si n’hi ha","Subtotal, descompte i total abans d’impostos"],
  orderFormulas:["Import de línia = quantitat × preu unitari","Subtotal = suma dels imports de línia","Descompte = subtotal × % de descompte","Total abans d’impostos = subtotal − descompte (+ transport si el paga el comprador)"],
  rankOptions:["1r moment","2n moment","3r moment"],
  paymentMethods:{transfer:"Transferència bancària",cash:"Efectiu",cheque:"Xec",card:"Targeta"},
  transportPayers:{buyer:"Comprador/a",seller:"Proveïdor/a"}
 },
 es:{
  eyebrow:"Aplicación del temario",
  sheetOf:(n,total)=>`Hoja ${n} de ${total}`,
  source:"Fuente",
  sourceLine:t=>`${t.filename} · 9 hojas incrustadas · recibido el 28/09/2026`,
  traceSummary:"El archivo fuente se llama «Exercicis_1-10_unificats.docx», pero solo contiene 9 hojas: no se ha añadido ninguna hoja 10.",
  traceDetails:"Trazabilidad del material",
  translationNote:"Esta hoja fuente está solo en catalán. La versión en castellano de esta página es una traducción del sitio web, no texto del material.",
  scenario:"Enunciado",
  reference:"Recursos de consulta",
  referenceIntro:"No necesitas memorizar nada: todo lo que hace falta para resolver el ejercicio está aquí mismo.",
  roles:"Quién hace qué",
  cycle:"Ciclo comercial de la compraventa",
  categoryTitle:"Categorías de gestión documental",
  orderFieldsTitle:"Campos que debe tener un pedido",
  orderFormulaTitle:"Fórmulas de los importes",
  noVat:"La fuente no indica ningún tipo de IVA: los totales auxiliares son antes de impuestos. No añadas IVA.",
  check:"Comprobar",
  reset:"Reiniciar hoja",
  hint:"Pista",
  expected:"Esperado",
  reveal:"Mostrar los valores esperados",
  wrong:"Todavía hay campos por corregir. Revisa los marcados y vuelve a intentarlo.",
  correct:"¡Muy bien! Has resuelto la hoja correctamente.",
  guidance:"Guía",
  guidanceText:"Cada campo marcado en rojo incluye su pista. Corrígelo y vuelve a comprobar.",
  modelTitle:"Criterios y puntos modelo para autocorrección",
  completed:"Hoja completada",
  completedHint:"Puedes reiniciarla para practicar de nuevo.",
  calcTitle:"Calculadora",
  calcHelp:"Haz las operaciones y envía el resultado al campo numérico que hayas seleccionado.",
  calcUse:"Usar resultado en el campo seleccionado",
  calcClear:"Borrar",
  calcNoTarget:"Selecciona primero un campo numérico del pedido.",
  dateTitle:"Ayuda de fechas",
  dateHelp:"Introduce la fecha del pedido y los días de entrega para obtener la fecha límite.",
  dateBase:"Fecha de inicio",
  dateDays:"Días a añadir",
  dateCompute:"Calcular fecha",
  dateCopy:"Copiar a la fecha de entrega",
  dateResult:"Fecha calculada",
  dateInvalid:"Introduce una fecha y un número de días válidos.",
  orderSections:{order:"Datos del pedido",buyer:"Comprador",supplier:"Proveedor",items:"Mercancías",conditions:"Condiciones",totals:"Importes"},
  itemColumns:{reference:"Referencia",quantity:"Cantidad",unitPrice:"Precio unitario",lineTotal:"Importe de línea"},
  fields:{
   orderNumber:"Número de pedido",orderDate:"Fecha del pedido",
   buyerName:"Nombre del comprador",buyerNif:"NIF del comprador",buyerAddress:"Dirección del comprador",
   supplierName:"Nombre del proveedor",supplierNif:"NIF del proveedor",supplierAddress:"Dirección del proveedor",
   discountPercent:"Descuento (%)",transportCost:"Coste del transporte (€)",transportPayer:"Quién paga el transporte",transportCarrier:"Transportista",
   deliveryAddress:"Dirección de entrega",paymentDays:"Plazo de pago (días)",paymentMethod:"Forma de pago",
   maxDeliveryDays:"Plazo máximo de entrega (días)",latestDelivery:"Fecha límite de entrega",specialInstructions:"Instrucciones especiales",
   subtotal:"Subtotal",discountAmount:"Importe del descuento",totalBeforeTax:"Total antes de impuestos"
  },
  orderHints:{
   orderNumber:"Copia el número de pedido del enunciado.",
   orderDate:"Selecciona la fecha en que se realiza el pedido.",
   buyer:"Copia los datos del comprador tal como aparecen en el enunciado.",
   supplier:"Copia los datos del proveedor tal como aparecen en el enunciado.",
   itemRef:"Copia la referencia de cada artículo.",
   itemQty:"Copia la cantidad pedida de cada artículo.",
   itemPrice:"Copia el precio unitario de cada artículo.",
   itemLine:"Importe de línea = cantidad × precio unitario.",
   discount:"Porcentaje de descuento indicado en el enunciado.",
   transport:"Copia las condiciones de transporte del enunciado.",
   deliveryAddress:"Dirección donde hay que entregar la mercancía.",
   paymentDays:"Días de pago indicados en el enunciado.",
   paymentMethod:"Forma de pago indicada en el enunciado.",
   maxDeliveryDays:"Días máximos de entrega indicados en el enunciado.",
   latestDelivery:"Suma los días máximos a la fecha del pedido, o usa la ayuda de fechas.",
   specialInstructions:"Recoge las instrucciones especiales del enunciado (etiquetas y colores).",
   subtotal:"Subtotal = suma de todos los importes de línea.",
   discountAmount:"Importe del descuento = subtotal × % de descuento.",
   totalBeforeTax:"Total antes de impuestos = subtotal − descuento (+ transporte si lo paga el comprador)."
  },
  orderReferenceFields:["Número y fecha del pedido","Nombre, NIF y dirección del comprador","Nombre, NIF y dirección del proveedor","Referencia, cantidad y precio unitario de cada artículo","Importe de cada línea","Descuento, si lo hay","Transporte (coste, pagador y transportista), si lo hay","Dirección de entrega","Plazo y forma de pago","Días máximos y fecha límite de entrega","Instrucciones especiales, si las hay","Subtotal, descuento y total antes de impuestos"],
  orderFormulas:["Importe de línea = cantidad × precio unitario","Subtotal = suma de los importes de línea","Descuento = subtotal × % de descuento","Total antes de impuestos = subtotal − descuento (+ transporte si lo paga el comprador)"],
  rankOptions:["1.º momento","2.º momento","3.º momento"],
  paymentMethods:{transfer:"Transferencia bancaria",cash:"Efectivo",cheque:"Cheque",card:"Tarjeta"},
  transportPayers:{buyer:"Comprador/a",seller:"Proveedor/a"}
 }
};

export function parseFlexibleNumber(value){
 let raw=String(value??"").trim().replace(/[\s\u00A0€]/g,"").replace(/[^\d,.\-]/g,"");
 if(!raw||!/\d/.test(raw))return Number.NaN;
 const negative=raw.startsWith("-");
 raw=raw.replace(/-/g,"");
 const dots=(raw.match(/\./g)||[]).length,commas=(raw.match(/,/g)||[]).length;
 if(dots&&commas){
  const decimal=raw.lastIndexOf(".")>raw.lastIndexOf(",")?".":",";
  const thousands=decimal==="."?",":".";
  raw=raw.split(thousands).join("");
  const pos=raw.lastIndexOf(decimal);
  raw=raw.slice(0,pos).split(decimal).join("")+"."+raw.slice(pos+1);
 }else{
  const sep=dots?".":commas?",":null;
  if(sep){
   const parts=raw.split(sep);
   if(parts.length===2){
    const [whole,fraction]=parts;
    raw=fraction.length===3&&whole.length<=3?whole+fraction:whole+"."+fraction;
   }else{
    const last=parts.at(-1);
    raw=last.length>0&&last.length<=2?parts.slice(0,-1).join("")+"."+last:parts.join("");
   }
  }
 }
 const number=Number(raw);
 return negative?-number:number;
}

export function normalizeAdminText(value){
 return String(value??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"");
}

export function normalizeNif(value){
 return String(value??"").trim().toUpperCase().replace(/[^A-Z0-9]/g,"");
}

export function formatAdminNumber(value){
 return numberFormat.format(Number(value));
}

export function formatIsoDate(iso,lang="ca"){
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso??""));
 if(!match)return String(iso??"");
 return lang==="es"?`${match[3]}/${match[2]}/${match[1]}`:`${match[3]}/${match[2]}/${match[1]}`;
}

export function normalizeDateValue(value){
 const raw=String(value??"").trim();
 let match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
 if(match)return `${match[1]}-${match[2]}-${match[3]}`;
 match=/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(raw);
 if(!match)return "";
 const day=String(match[1]).padStart(2,"0"),month=String(match[2]).padStart(2,"0");
 return `${match[3]}-${month}-${day}`;
}

export function addDays(iso,days){
 const normalized=normalizeDateValue(iso);
 const amount=Number(days);
 if(!normalized||!Number.isFinite(amount)||Math.abs(amount-Math.round(amount))>1e-9)return "";
 const [year,month,day]=normalized.split("-").map(Number);
 const base=Date.UTC(year,month-1,day);
 const result=new Date(base+Math.round(amount)*86400000);
 if(Number.isNaN(result.getTime()))return "";
 const y=result.getUTCFullYear(),m=String(result.getUTCMonth()+1).padStart(2,"0"),d=String(result.getUTCDate()).padStart(2,"0");
 return `${y}-${m}-${d}`;
}

export function calculateAdminPair(a,operator,b){
 const x=Number(a),y=Number(b);
 if(!Number.isFinite(x)||!Number.isFinite(y))return Number.NaN;
 if(operator==="+")return x+y;
 if(operator==="−"||operator==="-")return x-y;
 if(operator==="×"||operator==="*")return x*y;
 if(operator==="÷"||operator==="/")return y===0?Number.NaN:x/y;
 return Number.NaN;
}

export function calculateOrderDerived(order){
 const lineTotals=order.items.map(item=>r2(item.quantity*item.unitPrice));
 const subtotal=r2(lineTotals.reduce((total,value)=>total+value,0));
 const discountAmount=r2(subtotal*(order.discountPercent||0)/100);
 const transport=order.transport?.payer==="buyer"?r2(order.transport.cost):0;
 return {lineTotals,subtotal,discountAmount,totalBeforeTax:r2(subtotal-discountAmount+transport)};
}

const EXPECTED_CATEGORIES={pedido:"purchase_sale",nomina:"hr",factura:"purchase_sale",instancia:"procedures",cheque:"payments",acta:"decisions",albaran:"purchase_sale"};

export function validateAdministrativeExercisesData(bank){
 if(!bank||bank.version!==1)throw new Error("Administrative exercises: invalid version");
 if(bank.source?.filename!=="Exercicis_1-10_unificats.docx")throw new Error("Administrative exercises: unexpected source filename");
 if(bank.source?.embeddedSheets!==9)throw new Error("Administrative exercises: source must declare 9 embedded sheets");
 if(bank.source?.received!=="2026-09-28")throw new Error("Administrative exercises: unexpected received date");
 if(bank.source?.identifiersPreservedLiterally!==true)throw new Error("Administrative exercises: literal identifiers must be preserved");
 if(!Array.isArray(bank.sheets)||bank.sheets.length!==9)throw new Error("Administrative exercises: exactly 9 sheets are required");
 if(bank.sheets.filter(sheet=>sheet.kind==="questions").length!==5)throw new Error("Administrative exercises: sheets 1-5 must be question sheets");
 if(bank.sheets.filter(sheet=>sheet.kind==="order").length!==4)throw new Error("Administrative exercises: sheets 6-9 must be order sheets");
 const documents=bank.resources?.documents||[],categories=bank.resources?.categories||[];
 const documentIds=new Set(documents.map(item=>item.id));
 const categoryIds=new Set(categories.map(item=>item.id));
 if(documentIds.size!==7)throw new Error("Administrative exercises: 7 documents are required");
 if(categoryIds.size!==5)throw new Error("Administrative exercises: 5 document categories are required");
 for(const [id,category] of Object.entries(EXPECTED_CATEGORIES)){
  const document=documents.find(item=>item.id===id);
  if(!document||document.category!==category)throw new Error(`Administrative exercises: wrong category for ${id}`);
 }
 for(const sheet of bank.sheets){
  if(!sheet.title?.ca||!sheet.title?.es||!sheet.scenario?.ca||!sheet.scenario?.es)throw new Error(`Administrative exercises: ${sheet.id} needs bilingual title and scenario`);
  if(sheet.kind==="questions"){
   if(!Array.isArray(sheet.fields)||!sheet.fields.length)throw new Error(`Administrative exercises: ${sheet.id} has no fields`);
  }else{
   const order=sheet.order;
   if(!order||!Array.isArray(order.items)||!order.items.length)throw new Error(`Administrative exercises: ${sheet.id} has no order items`);
   const derived=calculateOrderDerived(order);
   if(derived.subtotal!==order.derived?.subtotal||derived.discountAmount!==order.derived?.discountAmount||derived.totalBeforeTax!==order.derived?.totalBeforeTax){
    throw new Error(`Administrative exercises: ${sheet.id} derived totals do not match`);
   }
   if(order.latestDelivery!==addDays(order.orderDate,order.maxDeliveryDays))throw new Error(`Administrative exercises: ${sheet.id} latest delivery date does not match`);
   for(let i=0;i<order.items.length;i++){
    if(order.items[i].lineTotal!==derived.lineTotals[i])throw new Error(`Administrative exercises: ${sheet.id} line totals do not match`);
   }
  }
 }
 return bank;
}

export async function loadAdministrativeExercises(fetcher=fetch){
 const response=await fetcher("data/administrative-exercises-v1.json");
 if(!response.ok)throw new Error("No s’ha pogut carregar els exercicis de documents administratius.");
 return validateAdministrativeExercisesData(await response.json());
}

function catalogLabel(list,id,lang){
 const entry=(list||[]).find(item=>item.id===id);
 return entry?entry.label?.[lang]||entry.label?.ca||id:id;
}

function resolveOptions(bank,field,lang){
 if(field.optionSource==="documents")return (bank.resources.documents||[]).map(item=>({id:item.id,label:item.label[lang]}));
 if(field.optionSource==="categories")return (bank.resources.categories||[]).map(item=>({id:item.id,label:item.label[lang]}));
 return (field.options||[]).map(option=>({id:option.id,label:option.label[lang]}));
}

function addressVariants(address){
 const base=String(address??"");
 const variants=[base];
 if(/^carrer /i.test(base))variants.push(base.replace(/^carrer /i,"calle "));
 if(/^calle /i.test(base))variants.push(base.replace(/^calle /i,"carrer "));
 return variants;
}

export function questionFieldSpecs(bank,sheet){
 return (sheet.fields||[]).map(field=>{
  const label=field.prompt||field.label||{ca:"",es:""};
  if(field.type==="text")return {key:field.id,kind:"text",label,expected:field.accept?.[0]??"",accept:field.accept||[],hint:field.hint,display:field.display,raw:field};
  if(field.type==="select")return {key:field.id,kind:"select",label,expected:field.expected,options:resolveOptions(bank,field,"ca"),optionsEs:resolveOptions(bank,field,"es"),hint:field.hint,raw:field};
  if(field.type==="multi")return {key:field.id,kind:"multi",label,expected:field.expected||[],options:resolveOptions(bank,field,"ca"),optionsEs:resolveOptions(bank,field,"es"),hint:field.hint,raw:field};
  if(field.type==="rank")return {key:field.id,kind:"select",label,expected:field.expected,rank:true,options:L.ca.rankOptions.map((text,index)=>({id:String(index+1),label:text})),optionsEs:L.es.rankOptions.map((text,index)=>({id:String(index+1),label:text})),hint:field.hint,raw:field};
  if(field.type==="free")return {key:field.id,kind:"free",label,raw:field};
  throw new Error(`Administrative exercises: unsupported field type ${field.type}`);
 });
}

const PAYMENT_METHOD_IDS=["transfer","cash","cheque","card"];
const TRANSPORT_PAYER_IDS=["buyer","seller"];

export function orderFieldSpecs(order){
 const specs=[];
 const push=spec=>specs.push(spec);
 push({key:"orderNumber",section:"order",kind:"text",field:"orderNumber",expected:order.orderNumber,accept:[order.orderNumber]});
 push({key:"orderDate",section:"order",kind:"date",field:"orderDate",expected:order.orderDate});
 push({key:"buyerName",section:"buyer",kind:"text",field:"buyerName",expected:order.buyer.name,accept:[order.buyer.name]});
 push({key:"buyerNif",section:"buyer",kind:"nif",field:"buyerNif",expected:order.buyer.nif,accept:[order.buyer.nif]});
 push({key:"buyerAddress",section:"buyer",kind:"address",field:"buyerAddress",expected:order.buyer.address,accept:addressVariants(order.buyer.address)});
 push({key:"supplierName",section:"supplier",kind:"text",field:"supplierName",expected:order.supplier.name,accept:[order.supplier.name]});
 push({key:"supplierNif",section:"supplier",kind:"nif",field:"supplierNif",expected:order.supplier.nif,accept:[order.supplier.nif]});
 push({key:"supplierAddress",section:"supplier",kind:"address",field:"supplierAddress",expected:order.supplier.address,accept:addressVariants(order.supplier.address)});
 order.items.forEach((item,index)=>{
  const number=index+1;
  push({key:`item${number}Ref`,section:"items",row:index,column:"reference",kind:"text",field:"itemRef",expected:item.reference,accept:[item.reference]});
  push({key:`item${number}Qty`,section:"items",row:index,column:"quantity",kind:"number",field:"itemQty",expected:item.quantity});
  push({key:`item${number}Price`,section:"items",row:index,column:"unitPrice",kind:"number",field:"itemPrice",expected:item.unitPrice});
  push({key:`item${number}Line`,section:"items",row:index,column:"lineTotal",kind:"number",field:"itemLine",expected:item.lineTotal});
 });
 push({key:"discountPercent",section:"conditions",kind:"number",field:"discount",expected:order.discountPercent});
 if(order.transport){
  push({key:"transportCost",section:"conditions",kind:"number",field:"transport",expected:order.transport.cost});
  push({key:"transportPayer",section:"conditions",kind:"select",field:"transport",expected:order.transport.payer,options:TRANSPORT_PAYER_IDS.map(id=>({id,label:L.ca.transportPayers[id]})),optionsEs:TRANSPORT_PAYER_IDS.map(id=>({id,label:L.es.transportPayers[id]}))});
  push({key:"transportCarrier",section:"conditions",kind:"text",field:"transport",expected:order.transport.carrier,accept:[order.transport.carrier]});
 }
 push({key:"deliveryAddress",section:"conditions",kind:"address",field:"deliveryAddress",expected:order.deliveryAddress,accept:addressVariants(order.deliveryAddress)});
 push({key:"paymentDays",section:"conditions",kind:"number",field:"paymentDays",expected:order.paymentDays});
 push({key:"paymentMethod",section:"conditions",kind:"select",field:"paymentMethod",expected:order.paymentMethod,options:PAYMENT_METHOD_IDS.map(id=>({id,label:L.ca.paymentMethods[id]})),optionsEs:PAYMENT_METHOD_IDS.map(id=>({id,label:L.es.paymentMethods[id]}))});
 push({key:"maxDeliveryDays",section:"conditions",kind:"number",field:"maxDeliveryDays",expected:order.maxDeliveryDays});
 push({key:"latestDelivery",section:"conditions",kind:"date",field:"latestDelivery",expected:order.latestDelivery,delivery:true});
 if(order.specialInstructions){
  push({key:"specialInstructions",section:"conditions",kind:"keywords",field:"specialInstructions",groups:order.specialInstructions.keywords,expected:order.specialInstructions});
 }
 push({key:"subtotal",section:"totals",kind:"number",field:"subtotal",expected:order.derived.subtotal});
 push({key:"discountAmount",section:"totals",kind:"number",field:"discountAmount",expected:order.derived.discountAmount});
 push({key:"totalBeforeTax",section:"totals",kind:"number",field:"totalBeforeTax",expected:order.derived.totalBeforeTax});
 return specs;
}

export function sheetFieldSpecs(bank,sheet){
 return sheet.kind==="order"?orderFieldSpecs(sheet.order):questionFieldSpecs(bank,sheet);
}

function specLocalLabel(spec,lang){
 if(spec.raw?.prompt&&!spec.raw?.label)return spec.raw.prompt[lang];
 if(spec.raw?.label)return spec.raw.label[lang];
 if(spec.field)return L[lang].fields[spec.field];
 return spec.label?.[lang]??"";
}

function specOptions(spec,lang){
 if(!spec.options)return [];
 const list=lang==="es"&&spec.optionsEs?spec.optionsEs:spec.options;
 return list;
}

function specHint(spec,lang){
 if(spec.hint)return spec.hint[lang];
 if(spec.field)return L[lang].orderHints[spec.field];
 return "";
}

export function gradeAdminField(spec,value,lang="ca"){
 if(spec.kind==="number"){
  const parsed=parseFlexibleNumber(value);
  const correct=Number.isFinite(parsed)&&Math.abs(parsed-spec.expected)<0.005;
  return {correct,expectedText:formatAdminNumber(spec.expected)};
 }
 if(spec.kind==="date"){
  const correct=!!normalizeDateValue(value)&&normalizeDateValue(value)===spec.expected;
  return {correct,expectedText:formatIsoDate(spec.expected,lang)};
 }
 if(spec.kind==="select"){
  const correct=String(value??"")===spec.expected;
  const option=specOptions(spec,lang).find(item=>item.id===spec.expected);
  return {correct,expectedText:option?option.label:spec.expected};
 }
 if(spec.kind==="multi"){
  const list=Array.isArray(value)?value:[];
  const correct=[...list].sort().join("|")===[...spec.expected].sort().join("|");
  const options=specOptions(spec,lang);
  return {correct,expectedText:spec.expected.map(id=>options.find(item=>item.id===id)?.label??id).join(", ")};
 }
 if(spec.kind==="keywords"){
  const text=normalizeAdminText(value);
  const correct=text.length>0&&spec.groups.every(group=>group.some(keyword=>text.includes(normalizeAdminText(keyword))));
  return {correct,expectedText:spec.expected?.[lang]??""};
 }
 const normalized=spec.kind==="nif"?normalizeNif(value):normalizeAdminText(value);
 const correct=normalized.length>0&&(spec.accept||[spec.expected]).some(candidate=>(spec.kind==="nif"?normalizeNif(candidate):normalizeAdminText(candidate))===normalized);
 return {correct,expectedText:spec.expected};
}

export function evaluateAdministrativeSheet(bank,sheetId,answers,lang="ca"){
 const sheet=(bank.sheets||[]).find(item=>item.id===sheetId)??bank.sheets[0];
 const specs=sheetFieldSpecs(bank,sheet).filter(spec=>spec.kind!=="free");
 const store=(answers||{})[sheetId]||{};
 const results={};
 let allCorrect=true;
 for(const spec of specs){
  const result=gradeAdminField(spec,store[spec.key],lang);
  results[spec.key]=result;
  if(!result.correct)allCorrect=false;
 }
 return {results,allCorrect};
}

export function createAdministrativeExerciseState(){
 return {sheetId:"sheet-1",answers:{},attempts:{},results:{},revealed:{},completed:[],calc:{display:"0",accumulator:null,operator:null,waiting:false},dateHelper:{base:"",days:"",result:""},focusField:null};
}

function fieldValue(state,sheetId,key){
 const store=state.answers?.[sheetId]||{};
 return store[key];
}

function fieldClass(state,sheetId,key){
 const result=state.results?.[sheetId]?.[key];
 if(!result)return "";
 return result.correct?" admin-field-correct":" admin-field-incorrect";
}

function fieldNoteHtml(spec,state,sheetId,lang){
 const result=state.results?.[sheetId]?.[spec.key];
 if(!result)return "";
 if(result.correct)return `<span class="admin-field-note" data-admin-field-note>✓</span>`;
 const hint=specHint(spec,lang);
 const revealed=!!state.revealed?.[sheetId];
 const parts=[];
 if(hint)parts.push(`<b>${esc(L[lang].hint)}:</b> ${esc(hint)}`);
 if(revealed)parts.push(`<b>${esc(L[lang].expected)}:</b> ${esc(result.expectedText)}`);
 return `<span class="admin-field-note" data-admin-field-note>${parts.join(" · ")}</span>`;
}

function renderSelect(spec,state,sheetId,lang){
 const value=fieldValue(state,sheetId,spec.key)??"";
 const inner=specOptions(spec,lang).map(option=>`<option value="${esc(option.id)}"${String(value)===option.id?" selected":""}>${esc(option.label)}</option>`).join("");
 return `<select id="admin-${esc(spec.key)}" data-admin-input="${esc(spec.key)}" aria-label="${esc(specLocalLabel(spec,lang))}"><option value="">—</option>${inner}</select>`;
}

function renderInput(spec,state,sheetId,lang){
 const value=fieldValue(state,sheetId,spec.key)??"";
 const id=`admin-${esc(spec.key)}`,label=esc(specLocalLabel(spec,lang));
 if(spec.kind==="date")return `<input id="${id}" type="date" data-admin-input="${esc(spec.key)}"${spec.delivery?' data-admin-delivery="true"':""} value="${esc(value)}" aria-label="${label}">`;
 if(spec.kind==="number")return `<input id="${id}" type="text" inputmode="decimal" autocomplete="off" data-admin-input="${esc(spec.key)}" data-admin-numeric="true" value="${esc(value)}" placeholder="0" aria-label="${label}">`;
 if(spec.kind==="keywords"||spec.kind==="free")return `<textarea id="${id}" rows="${spec.kind==="free"?5:3}" data-admin-input="${esc(spec.key)}" aria-label="${label}">${esc(value)}</textarea>`;
 return `<input id="${id}" type="text" autocomplete="off" data-admin-input="${esc(spec.key)}" value="${esc(value)}" aria-label="${label}">`;
}

function renderMulti(spec,state,sheetId,lang){
 const selected=fieldValue(state,sheetId,spec.key);
 const list=Array.isArray(selected)?selected:[];
 return specOptions(spec,lang).map(option=>`<label class="admin-choice"><input type="checkbox" data-admin-multi="${esc(spec.key)}" value="${esc(option.id)}"${list.includes(option.id)?" checked":""}> <span>${esc(option.label)}</span></label>`).join("");
}

function renderField(spec,state,sheetId,lang){
 const label=specLocalLabel(spec,lang);
 const note=fieldNoteHtml(spec,state,sheetId,lang);
 const control=spec.kind==="select"?renderSelect(spec,state,sheetId,lang):renderInput(spec,state,sheetId,lang);
 return `<div class="admin-field${fieldClass(state,sheetId,spec.key)}" data-admin-field="${esc(spec.key)}"><label class="admin-field-label" for="admin-${esc(spec.key)}">${esc(label)}</label>${control}${note}</div>`;
}

function renderMultiField(spec,state,sheetId,lang){
 return `<fieldset class="admin-field admin-multi${fieldClass(state,sheetId,spec.key)}" data-admin-field="${esc(spec.key)}"><legend class="admin-field-label">${esc(specLocalLabel(spec,lang))}</legend><div class="admin-choice-list">${renderMulti(spec,state,sheetId,lang)}</div>${fieldNoteHtml(spec,state,sheetId,lang)}</fieldset>`;
}

function resourcePanelHtml(bank,lang){
 const c=L[lang],resources=bank.resources;
 const roles=resources.roles.map(role=>`<li><strong>${esc(role.term[lang])}</strong>: ${esc(role.definition[lang])}</li>`).join("");
 const cycle=resources.cycle.map((step,index)=>`<li><span class="admin-cycle-index">${index+1}</span><div><strong>${esc(step.label[lang])}</strong><p>${esc(step.definition[lang])}</p></div></li>`).join("");
 const categories=resources.categories.map(category=>`<li><strong>${esc(category.label[lang])}</strong>: ${esc(category.definition[lang])}</li>`).join("");
 return `<section class="admin-reference" aria-label="${esc(c.reference)}"><header class="admin-reference-head"><h3>${esc(c.reference)}</h3><p>${esc(c.referenceIntro)}</p></header>
 <div class="admin-reference-block"><h4>${esc(c.roles)}</h4><ul>${roles}</ul></div>
 <div class="admin-reference-block"><h4>${esc(c.cycle)}</h4><ol class="admin-cycle">${cycle}</ol></div>
 <div class="admin-reference-block"><h4>${esc(c.categoryTitle)}</h4><ul>${categories}</ul></div></section>`;
}

function orderReferenceHtml(lang){
 const c=L[lang];
 const fields=c.orderReferenceFields.map(item=>`<li>${esc(item)}</li>`).join("");
 const formulas=c.orderFormulas.map(item=>`<li>${esc(item)}</li>`).join("");
 return `<section class="admin-reference" aria-label="${esc(c.reference)}"><header class="admin-reference-head"><h3>${esc(c.reference)}</h3><p>${esc(c.referenceIntro)}</p></header>
 <div class="admin-reference-block"><h4>${esc(c.orderFieldsTitle)}</h4><ul>${fields}</ul></div>
 <div class="admin-reference-block"><h4>${esc(c.orderFormulaTitle)}</h4><ul>${formulas}</ul></div>
 <p class="admin-vat-note">${esc(c.noVat)}</p></section>`;
}

function calculatorHtml(lang,state){
 const c=L[lang];
 const keys=["7","8","9","÷","4","5","6","×","1","2","3","−","0",",","⌫","+"];
 return `<aside class="practice-calculator admin-calculator" aria-label="${esc(c.calcTitle)}"><div class="calculator-head"><div><h3>${esc(c.calcTitle)}</h3><p>${esc(c.calcHelp)}</p></div><button type="button" class="text-button" data-admin-calc-clear>${esc(c.calcClear)}</button></div><output class="calculator-display" data-admin-calc-display aria-live="polite">${esc(state.calc.display)}</output><div class="calculator-keys">${keys.map(key=>`<button type="button" data-admin-calc-key="${esc(key)}" aria-label="${key==="⌫"?"Backspace":esc(key)}">${esc(key)}</button>`).join("")}<button type="button" class="calculator-equals" data-admin-calc-equals>=</button></div><button type="button" class="primary calculator-use" data-admin-calc-use>${esc(c.calcUse)}</button><p class="payroll-note" data-admin-calc-target role="status"></p></aside>`;
}

function dateHelperHtml(lang,state){
 const c=L[lang];
 const result=state.dateHelper.result;
 return `<aside class="practice-calculator admin-date-helper" aria-label="${esc(c.dateTitle)}"><div class="calculator-head"><div><h3>${esc(c.dateTitle)}</h3><p>${esc(c.dateHelp)}</p></div></div>
 <label class="admin-field admin-field-compact"><span class="admin-field-label">${esc(c.dateBase)}</span><input type="date" data-admin-date-base value="${esc(state.dateHelper.base)}" aria-label="${esc(c.dateBase)}"></label>
 <label class="admin-field admin-field-compact"><span class="admin-field-label">${esc(c.dateDays)}</span><input type="text" inputmode="numeric" data-admin-date-days value="${esc(state.dateHelper.days)}" aria-label="${esc(c.dateDays)}"></label>
 <button type="button" class="primary" data-admin-date-compute>${esc(c.dateCompute)}</button>
 <output class="calculator-display admin-date-result" data-admin-date-result aria-live="polite">${result?esc(formatIsoDate(result,lang)):esc(c.dateResult)}</output>
 <button type="button" class="text-button admin-date-copy" data-admin-date-copy>${esc(c.dateCopy)}</button></aside>`;
}

function feedbackHtml(bank,sheet,lang,state){
 const c=L[lang];
 const results=state.results?.[sheet.id];
 if(!results)return "";
 const specs=sheetFieldSpecs(bank,sheet);
 const free=specs.find(spec=>spec.kind==="free");
 const allCorrect=Object.values(results).every(result=>result.correct);
 const attempts=state.attempts?.[sheet.id]||0;
 const revealed=!!state.revealed?.[sheet.id];
 const model=free?`<div class="admin-model"><h4>${esc(c.modelTitle)}</h4><ul>${(free.raw.modelPoints?.[lang]||[]).map(point=>`<li>${esc(point)}</li>`).join("")}</ul></div>`:"";
 if(allCorrect){
  return `<div class="admin-feedback admin-feedback-correct" role="status"><strong>${esc(c.correct)}</strong><p>${esc(c.completedHint)}</p>${model}</div>`;
 }
 const reveal=attempts>=2&&!revealed?`<button type="button" class="text-button" data-admin-reveal>${esc(c.reveal)}</button>`:"";
 const revealedNote=revealed?`<p class="admin-revealed">${esc(L[lang].expected)} ✓</p>`:"";
 return `<div class="admin-feedback admin-feedback-wrong" role="status"><strong>${esc(c.wrong)}</strong><p><b>${esc(c.guidance)}:</b> ${esc(c.guidanceText)}</p>${revealedNote}${reveal}${model}</div>`;
}

function orderFormHtml(sheet,lang,state){
 const c=L[lang],order=sheet.order,specs=orderFieldSpecs(order);
 const byKey=Object.fromEntries(specs.map(spec=>[spec.key,spec]));
 const buyerFields=["buyerName","buyerNif","buyerAddress"].map(key=>renderField(byKey[key],state,sheet.id,lang)).join("");
 const supplierFields=["supplierName","supplierNif","supplierAddress"].map(key=>renderField(byKey[key],state,sheet.id,lang)).join("");
 const headFields=["orderNumber","orderDate"].map(key=>renderField(byKey[key],state,sheet.id,lang)).join("");
 const rows=order.items.map((item,index)=>{
  const number=index+1;
  const cell=key=>`<td>${renderField(byKey[key],state,sheet.id,lang)}</td>`;
  return `<tr><th scope="row">${number}</th>${cell(`item${number}Ref`)}${cell(`item${number}Qty`)}${cell(`item${number}Price`)}${cell(`item${number}Line`)}</tr>`;
 }).join("");
 const conditionKeys=["discountPercent"];
 if(order.transport)conditionKeys.push("transportCost","transportPayer","transportCarrier");
 conditionKeys.push("deliveryAddress","paymentDays","paymentMethod","maxDeliveryDays","latestDelivery");
 if(order.specialInstructions)conditionKeys.push("specialInstructions");
 const conditions=conditionKeys.map(key=>renderField(byKey[key],state,sheet.id,lang)).join("");
 const totals=["subtotal","discountAmount","totalBeforeTax"].map(key=>renderField(byKey[key],state,sheet.id,lang)).join("");
 return `<div class="admin-order-grid"><div class="admin-order-form">
 <fieldset class="admin-fieldset"><legend>${esc(c.orderSections.order)}</legend><div class="admin-field-grid">${headFields}</div></fieldset>
 <fieldset class="admin-fieldset"><legend>${esc(c.orderSections.buyer)}</legend><div class="admin-field-grid">${buyerFields}</div></fieldset>
 <fieldset class="admin-fieldset"><legend>${esc(c.orderSections.supplier)}</legend><div class="admin-field-grid">${supplierFields}</div></fieldset>
 <fieldset class="admin-fieldset"><legend>${esc(c.orderSections.items)}</legend><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th scope="col">#</th><th scope="col">${esc(c.itemColumns.reference)}</th><th scope="col">${esc(c.itemColumns.quantity)}</th><th scope="col">${esc(c.itemColumns.unitPrice)}</th><th scope="col">${esc(c.itemColumns.lineTotal)}</th></tr></thead><tbody>${rows}</tbody></table></div></fieldset>
 <fieldset class="admin-fieldset"><legend>${esc(c.orderSections.conditions)}</legend><div class="admin-field-grid">${conditions}</div></fieldset>
 <fieldset class="admin-fieldset"><legend>${esc(c.orderSections.totals)}</legend><div class="admin-field-grid">${totals}</div></fieldset>
 <div class="admin-actions"><button type="button" class="primary" data-admin-check>${esc(c.check)}</button><button type="button" class="text-button" data-admin-reset>${esc(c.reset)}</button></div>
 ${feedbackHtml(undefined,sheet,lang,state)}
 </div><div class="admin-tools">${calculatorHtml(lang,state)}${dateHelperHtml(lang,state)}</div></div>`;
}

function questionFormHtml(bank,sheet,lang,state){
 const c=L[lang],specs=questionFieldSpecs(bank,sheet);
 const fields=specs.map(spec=>spec.kind==="multi"?renderMultiField(spec,state,sheet.id,lang):renderField(spec,state,sheet.id,lang)).join("");
 return `<div class="admin-question-form">${fields}<div class="admin-actions"><button type="button" class="primary" data-admin-check>${esc(c.check)}</button><button type="button" class="text-button" data-admin-reset>${esc(c.reset)}</button></div>${feedbackHtml(bank,sheet,lang,state)}</div>`;
}

function sheetNavHtml(bank,lang,state){
 return `<nav class="admin-sheet-nav" aria-label="${esc(lang==="es"?"Hojas de ejercicios":"Fulls d’exercicis")}">${bank.sheets.map(sheet=>{
  const done=(state.completed||[]).includes(sheet.id)?" admin-sheet-done":"";
  return `<button type="button" class="${done.trim()}" data-admin-sheet="${esc(sheet.id)}" aria-pressed="${String(state.sheetId===sheet.id)}">${sheet.number}</button>`;
 }).join("")}</nav>`;
}

export function renderAdministrativeExercisesHtml(bank,language="ca",state){
 validateAdministrativeExercisesData(bank);
 const l=language==="es"?"es":"ca",c=L[l];
 const safe=state||createAdministrativeExerciseState();
 const sheet=bank.sheets.find(item=>item.id===safe.sheetId)??bank.sheets[0];
 const translationNote=sheet.sourceLanguage==="ca"&&l==="es"?`<p class="admin-translation-note">${esc(c.translationNote)}</p>`:"";
 const body=sheet.kind==="order"?orderFormHtml(sheet,l,safe):questionFormHtml(bank,sheet,l,safe);
 const reference=sheet.kind==="order"?orderReferenceHtml(l):resourcePanelHtml(bank,l);
 return `<div class="admin-exercises" data-admin-exercises><header class="admin-head"><p class="eyebrow">${esc(c.eyebrow)}</p><h2>${esc(bank.title[l])}</h2><p>${esc(bank.intro[l])}</p><p class="practical-source"><strong>${esc(c.source)}:</strong> ${esc(c.sourceLine(bank.source))}</p><details class="admin-trace"><summary>${esc(c.traceDetails)}</summary><p>${esc(c.traceSummary)}</p><p>${esc(bank.source.traceabilityNote[l])}</p></details></header>
 ${sheetNavHtml(bank,l,safe)}
 <article class="admin-sheet"><header class="admin-sheet-head"><p class="eyebrow">${esc(c.sheetOf(sheet.number,bank.sheets.length))}</p><h3>${esc(sheet.title[l])}</h3>${translationNote}<div class="admin-scenario"><h4>${esc(c.scenario)}</h4><p>${esc(sheet.scenario[l]).replace(/\n/g,"<br>")}</p></div></header>${reference}${body}</article></div>`;
}

function calculatorStateFrom(state){return state.calc||{display:"0",accumulator:null,operator:null,waiting:false};}

export function bindAdministrativeExercises({root,bank,language="ca",state,rerender}){
 const container=root.querySelector?.("[data-admin-exercises]");
 if(!container||!state)return;
 const l=language==="es"?"es":"ca";
 const sheetId=state.sheetId;
 const store=()=>{state.answers[sheetId]=state.answers[sheetId]||{};return state.answers[sheetId];};
 const clearFieldHighlight=key=>{
  if(state.results?.[sheetId]&&key in state.results[sheetId])delete state.results[sheetId][key];
  const wrap=container.querySelector(`[data-admin-field="${key}"]`);
  if(wrap){wrap.classList.remove("admin-field-correct","admin-field-incorrect");const note=wrap.querySelector("[data-admin-field-note]");if(note)note.textContent="";}
 };
 for(const input of container.querySelectorAll("[data-admin-input]")){
  const key=input.dataset.adminInput;
  input.addEventListener("input",()=>{store()[key]=input.value;clearFieldHighlight(key);});
  input.addEventListener("change",()=>{store()[key]=input.value;clearFieldHighlight(key);});
  if(input.hasAttribute("data-admin-numeric"))input.addEventListener("focusin",()=>{state.focusField=key;});
 }
 for(const checkbox of container.querySelectorAll("[data-admin-multi]")){
  const key=checkbox.dataset.adminMulti;
  checkbox.addEventListener("change",()=>{
   const values=[...container.querySelectorAll(`[data-admin-field="${key}"] input[type="checkbox"]`)].filter(box=>box.checked).map(box=>box.value);
   store()[key]=values;clearFieldHighlight(key);
  });
 }
 for(const button of container.querySelectorAll("[data-admin-sheet]"))button.addEventListener("click",()=>{state.sheetId=button.dataset.adminSheet;state.focusField=null;const next=bank.sheets.find(item=>item.id===state.sheetId);state.dateHelper=next?.kind==="order"?{base:next.order.orderDate,days:String(next.order.maxDeliveryDays),result:""}:{base:"",days:"",result:""};rerender();});
 for(const button of container.querySelectorAll("[data-admin-reset]"))button.addEventListener("click",()=>{
  state.answers[sheetId]={};state.attempts[sheetId]=0;delete state.results[sheetId];state.revealed[sheetId]=false;state.completed=(state.completed||[]).filter(id=>id!==sheetId);state.focusField=null;rerender();
 });
 for(const button of container.querySelectorAll("[data-admin-reveal]"))button.addEventListener("click",()=>{state.revealed[sheetId]=true;rerender();});
 const check=container.querySelector("[data-admin-check]");
 if(check)check.addEventListener("click",()=>{
  const sheet=bank.sheets.find(item=>item.id===sheetId);
  if(!sheet)return;
  const {results,allCorrect}=evaluateAdministrativeSheet(bank,sheetId,state.answers,l);
  state.results[sheetId]=results;
  if(allCorrect){if(!state.completed.includes(sheetId))state.completed.push(sheetId);}
  else{state.attempts[sheetId]=(state.attempts[sheetId]||0)+1;state.completed=(state.completed||[]).filter(id=>id!==sheetId);}
  rerender();
 });
 const display=container.querySelector("[data-admin-calc-display]");
 if(display){
  const calc=calculatorStateFrom(state);
  const show=value=>{calc.display=String(value).replace(".",",");display.textContent=calc.display;};
  const currentValue=()=>Number(String(calc.display).replace(",","."));
  const apply=()=>{
   if(calc.accumulator===null||!calc.operator)return currentValue();
   const result=calculateAdminPair(calc.accumulator,calc.operator,currentValue());
   calc.accumulator=null;calc.operator=null;calc.waiting=true;
   if(!Number.isFinite(result)){show("0");return Number.NaN;}
   const rounded=r2(result);show(String(rounded));return rounded;
  };
  for(const button of container.querySelectorAll("[data-admin-calc-key]"))button.addEventListener("click",()=>{
   const value=button.dataset.adminCalcKey;
   if(/[0-9]/.test(value)){if(calc.waiting||calc.display==="0"){calc.display=value;calc.waiting=false;}else calc.display+=value;display.textContent=calc.display;return;}
   if(value===","){if(calc.waiting){calc.display="0,";calc.waiting=false;}else if(!calc.display.includes(","))calc.display+=",";display.textContent=calc.display;return;}
   if(value==="⌫"){calc.display=calc.display.length>1?calc.display.slice(0,-1):"0";display.textContent=calc.display;return;}
   const now=currentValue();
   if(!Number.isFinite(now))return;
   if(calc.operator&&calc.accumulator!==null&&!calc.waiting){const chained=apply();if(!Number.isFinite(chained))return;calc.accumulator=chained;}else calc.accumulator=now;
   calc.operator=value;calc.waiting=true;
  });
  container.querySelector("[data-admin-calc-equals]")?.addEventListener("click",()=>{apply();});
  container.querySelector("[data-admin-calc-clear]")?.addEventListener("click",()=>{calc.display="0";calc.accumulator=null;calc.operator=null;calc.waiting=false;display.textContent="0";});
  container.querySelector("[data-admin-calc-use]")?.addEventListener("click",()=>{
   const sheet=bank.sheets.find(item=>item.id===sheetId);
   const specs=sheet?sheetFieldSpecs(bank,sheet):[];
   const target=specs.find(spec=>spec.key===state.focusField&&spec.kind==="number");
   if(!target){const message=container.querySelector("[data-admin-calc-target]");if(message)message.textContent=L[l].calcNoTarget;return;}
   if(calc.operator&&calc.accumulator!==null&&!calc.waiting)apply();
   store()[target.key]=calc.display;state.focusField=target.key;rerender();
  });
 }
 const dateBase=container.querySelector("[data-admin-date-base]");
 const dateDays=container.querySelector("[data-admin-date-days]");
 if(dateBase)dateBase.addEventListener("input",()=>{state.dateHelper.base=dateBase.value;});
 if(dateDays)dateDays.addEventListener("input",()=>{state.dateHelper.days=dateDays.value;});
 container.querySelector("[data-admin-date-compute]")?.addEventListener("click",()=>{
  const result=addDays(state.dateHelper.base,state.dateHelper.days);
  state.dateHelper.result=result;rerender();
 });
 container.querySelector("[data-admin-date-copy]")?.addEventListener("click",()=>{
  if(!state.dateHelper.result)return;
  store().latestDelivery=state.dateHelper.result;clearFieldHighlight("latestDelivery");rerender();
 });
}
