// Simulate the isolated service-worker activation and scope gate (no browser needed).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
const events={};
const removed=[];
const cacheEntries=['store-order-v4-2026-10-08-cachefix1','employee-vape-order-v0-2026-11-02','employee-vape-order-v1-2026-11-03','other-app-cache'];
const caches={
  keys:async()=>cacheEntries,
  delete:async key=>{removed.push(key);return true},
  open:async()=>({addAll:async()=>{},put:async()=>{}}),
  match:async()=>null
};
const ctx={
 self:{
  addEventListener:(type,cb)=>events[type]=cb,
  registration:{scope:'https://example.com/employee-vape-ordering-site/'},
  clients:{claim:async()=>{}},skipWaiting:async()=>{}
 },caches, URL, location:{origin:'https://example.com'},fetch:async()=>({ok:true,clone(){return this}}),Promise
};
vm.createContext(ctx);vm.runInContext(source,ctx);
const activatePromises=[];events.activate({waitUntil:p=>activatePromises.push(p)});
Promise.all(activatePromises).then(()=>{
  assert.deepEqual(removed,['employee-vape-order-v0-2026-11-02']);
  let responded=false;
  events.fetch({request:{method:'GET',url:'https://example.com/employee-ordering-site/index.html'},respondWith(){responded=true;}});
  assert.equal(responded,false);
  events.fetch({request:{method:'GET',url:'https://example.com/employee-vape-ordering-site/index.html',mode:'navigate'},respondWith(){responded=true;}});
  assert.equal(responded,true);
  console.log('PASS: service worker only deletes new-site caches; unrelated app caches untouched; outside-scope requests ignored.');
}).catch(e=>{console.error(e);process.exit(1)});
