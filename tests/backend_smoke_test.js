// Isolated Apps Script integration smoke test. No real email, no HTTP requests.
const fs=require('fs');
const vm=require('vm');
const crypto=require('crypto');
const path=require('path');
const assert=require('assert');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'backend/Code.gs'),'utf8')
  .replaceAll('https://raw.githubusercontent.com/GasDirect/', 'https://raw.githubusercontent.com/TEST_GITHUB_OWNER/');
const products=JSON.parse(fs.readFileSync(path.join(root,'data/products.json'),'utf8'));
const emails=[];
const cache=new Map();
const scripts = {
  console: {error() {},warn() {},log() {}},
  MailApp: { sendEmail: message=>emails.push(message), getRemainingDailyQuota:()=>50 },
  HtmlService: {
    XFrameOptionsMode:{ALLOWALL:1},
    createHtmlOutput: html=>({html,setXFrameOptionsMode(){return this;}})
  },
  CacheService: { getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},
  Utilities: {
    Charset:{UTF_8:1},DigestAlgorithm:{SHA_256:1},
    computeDigest:(algorithm,v)=>Array.from(crypto.createHash('sha256').update(v).digest()).map(b=>b>127?b-256:b),
    formatDate:()=> 'Nov 3, 2026, 11:00 PM EST'
  },
  UrlFetchApp: {
    fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify(products)}),
    fetchAll: reqs=>reqs.map(req => { assert(req.url.includes('/assets/email-thumbnails/foger/kits/')); assert(req.url.endsWith('.png')); return ({getResponseCode:()=>200, getBlob:()=>({
      getBytes:()=>[1,2,3],getContentType:()=> 'image/png',
      setContentType(){return this;},setName(){return this;}
    })})})
  },Date,JSON,Object,Array,Number,String,Math
};
vm.createContext(scripts);
vm.runInContext(source,scripts,{filename:'backend/Code.gs'});
const setup = scripts.verifyBackendSetup();
assert.equal(setup.ready,true);
assert.equal(setup.catalogProducts,182);
assert.equal(setup.emailRecipient,'lpgasbilling@gmail.com');
assert.equal(setup.remainingDailyRecipientQuota,50);
assert.equal(emails.length,0);
const base=()=>({version:1, requestId:'test-request-id', clientId:'test-client-id',
  startedAt:Date.now()-3000, submittedAt:new Date().toISOString(), submittedLocal:'Now',timeZone:'America/New_York',
  store:'South 60 Market',storeId:'south-60',employeeName:'Test Staff',generalNotes:'Please review',honeypot:'',
  items:[
    {id:'foger-kit-001',retailer:'FAKE BRAND',productName:'FAKE PRODUCT',quantity:2,note:'2 kits'},
    {id:'foger-pod-001',retailer:'FAKE BRAND',productName:'FAKE PRODUCT',quantity:1,note:'1 pod'}
  ]
});
const post=p=>scripts.doPost({parameter:{payload:JSON.stringify(p)}}).html;
const firstRequest=base();
const first=post(firstRequest);
assert(first.includes('"ok":true'));
assert.equal(emails.length,1);
assert(emails[0].subject.startsWith('Vape Order Request'));
assert(emails[0].body.includes('Cool Mint'));
assert(!emails[0].body.includes('FAKE PRODUCT'));
assert(!emails[0].body.includes('FAKE BRAND'));
assert(emails[0].htmlBody.includes('src="cid:'));
assert(!emails[0].htmlBody.includes('object-fit:contain'));
assert(!emails[0].htmlBody.includes('height:auto'));
assert(emails[0].htmlBody.includes('No image'));
assert.equal(Object.keys(emails[0].inlineImages).length,1);
const again=post(firstRequest);
assert(again.includes('"duplicate":true'));
assert.equal(emails.length,1);
const forged=base();forged.items[0].id='unknown-brand-001';
const rejected=post(forged);
assert(rejected.includes('"ok":false'));
assert.equal(emails.length,1);
const future=base();future.items=[{
  id:'breeze-disposable-001',productName:'Something else',retailer:'Wrong',quantity:4,note:''
}];
products.products.push({...products.products[0],id:'breeze-disposable-001',retailer:'Breeze',retailerKey:'breeze',brand:'Breeze',productName:'Breeze Test Product',category:'Disposables',image:''});
const allowed=post(future);
assert(allowed.includes('"ok":true'));
assert.equal(emails.length,2);
assert(emails[1].body.includes('Breeze Test Product'));
console.log('PASS: new backend catalog identity, kit-photo inline and pod placeholder, duplicate guard, invalid ID rejection, future brand, no actual email.');
