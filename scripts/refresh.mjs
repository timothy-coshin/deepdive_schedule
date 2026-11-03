import fs from 'node:fs/promises';
import {formatKST,addDays,normalizeFeed,emptyFeed} from '../src/feed.mjs';

// Backend-only: never expose API URLs, tokens, HTML, or response headers in the public data file.
const providers=[
  ['deepstation','DEEPSTATION_FEED_URL','DEEPSTATION_FEED_TOKEN'],
  ['paradive','PARADIVE_FEED_URL','PARADIVE_FEED_TOKEN'],
];
const output=emptyFeed();
const start=formatKST();
const end=addDays(start,62);
await Promise.all(providers.map(async ([facility,urlKey,tokenKey])=>{
  const uri=(process.env[urlKey]||'').trim();
  if(!uri)return;
  output.sources[facility]={connected:true,state:'error'};
  try {
    const url=new URL(uri);
    if(url.protocol!=='https:')throw new Error('HTTPS endpoint required');
    url.searchParams.set('start',start);url.searchParams.set('end',end);
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    let resp;
    try {
      resp=await fetch(url,{method:'GET',redirect:'error',signal:controller.signal,
        headers:{'Accept':'application/json',...(process.env[tokenKey]?{'Authorization':`Bearer ${process.env[tokenKey]}`}:{})}});
    } finally {clearTimeout(timeout)}
    if(!resp.ok)throw new Error(`HTTP ${resp.status}`);
    const size=Number(resp.headers.get('content-length'));
    if (size>1_000_000)throw new Error('Payload too large');
    const text=await resp.text();
    if(text.length>1_000_000)throw new Error('Payload too large');
    const raw=JSON.parse(text);
    const slots=normalizeFeed(raw,facility);
    output.slots.push(...slots.filter(s=>s.date>=start&&s.date<=end));
    output.sources[facility]={connected:true,state:'ok',slotCount:slots.length,checkedAt:new Date().toISOString()};
  }catch(error){
    // Do not publish the exception because it may contain URL/token details.
    output.sources[facility]={connected:true,state:'error',checkedAt:new Date().toISOString()};
    process.stderr.write(`[${facility}] source unavailable or invalid\n`);
  }
}));
output.slots.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)||a.facility.localeCompare(b.facility));
await fs.mkdir('data',{recursive:true});
await fs.writeFile('data/availability.json',JSON.stringify(output,null,2)+'\n','utf8');
console.log(`Availability snapshot: ${output.slots.length} verified slots, ${start} to ${end}`);
