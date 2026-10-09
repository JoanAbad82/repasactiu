import {chromium} from '@playwright/test';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:390,height:844}});
const cdp=await page.context().newCDPSession(page);
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
const requests=new Map();
const measurements=[];
let stage='initial';
cdp.on('Network.requestWillBeSent',event=>{
  if(event.request.url.startsWith('http://127.0.0.1:4173/')){
    requests.set(event.requestId,{stage,url:new URL(event.request.url).pathname,bytes:0});
  }
});
cdp.on('Network.loadingFinished',event=>{
  const item=requests.get(event.requestId);if(item){item.bytes=Math.round(event.encodedDataLength||0);}
});
const snapshot=async(label)=>{
  await page.waitForLoadState('networkidle');
  const items=[...requests.values()].filter(r=>r.stage===label);
  measurements.push({stage:label,requests:items.length,transferBytes:items.reduce((n,x)=>n+x.bytes,0),jsonRequests:items.filter(x=>x.url.endsWith('.json')).length,jsonBytes:items.filter(x=>x.url.endsWith('.json')).reduce((n,x)=>n+x.bytes,0),paths:items.map(x=>x.url)});
};
await page.goto('http://127.0.0.1:4173/');
await page.getByText('1009 preguntes').waitFor();
await snapshot('initial');
const actions=[
  ['study','#home-shortcut-study','.study-selector-head'],
  ['dictionary','#home-shortcut-dictionary','#concept-dictionary-screen h1'],
  ['examples','#home-shortcut-examples','#commercial-correspondence-screen h1'],
  ['hangman','#hangman-card','[data-hangman-entry]']
];
for(const [key,button,target] of actions){
  stage=key;
  await page.locator(button).click();
  await page.locator(target).first().waitFor({timeout:20000});
  await snapshot(key);
  await page.locator('#home-link').click();
}
console.log(JSON.stringify({measurements},null,2));
await browser.close();
