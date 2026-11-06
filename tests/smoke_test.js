// Node-only smoke test for the copied/adapted front-end. No npm dependencies, no network.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { webcrypto } = require('crypto');
const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'data/config.json'), 'utf8'));
const originalCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data/products.json'), 'utf8'));
const flavorGroups = JSON.parse(fs.readFileSync(path.join(root, 'data/flavor-groups.json'), 'utf8'));
assert.equal(flavorGroups.brands.foger.length,14);

function node(name) {
  const handlers = {};
  const el = {
    id: name, _html: '', textContent: '', value: '', hidden: false, disabled: false,
    getBoundingClientRect:()=>({height:160,top:0,bottom:160,left:0,right:100}),
    dataset: {}, classList: { toggle() {}, add() {}, remove() {} },
    addEventListener(type, cb) { handlers[type] = cb; },
    emit(type, event) { return handlers[type](event || { target: this }); },
    setAttribute() {}, focus() {}, submit() { el.submits = (el.submits || 0) + 1; },
    closest() { return this; },
    querySelectorAll() { return []; }
  };
  Object.defineProperty(el, 'innerHTML', { get: () => el._html, set: value => { el._html = value; } });
  return el;
}

async function loadSite(products, existingStorage) {
  const elements = new Map();
  const local = existingStorage || new Map();
  const registered = {};
  const el = id => elements.get(id) || (elements.set(id,node(id)),elements.get(id));
  const document = {
    title: '', body: { style: {} }, documentElement: { style: {setProperty() {}} },
    getElementById: el, querySelector: () => node('query'),
    addEventListener(name,cb) { registered[name] = cb; }
  };
  const window = { innerHeight:900, addEventListener(name,cb) { registered['window.'+name] = cb; }, scrollTo() {} };
  const localStorage = {
    getItem: key => local.has(key) ? local.get(key) : null,
    setItem: (key,value) => local.set(key,String(value)),
    removeItem: key => local.delete(key)
  };
  const context = {
    document,window,localStorage,console,crypto:webcrypto,
    requestAnimationFrame: cb => cb(), setTimeout,clearTimeout, Date, Intl, URL,
    CSS: { escape: s => s }, navigator:{}, location:{protocol:'http:',origin:'http://test.invalid',href:'http://test.invalid/vape/'},
    fetch: async url => ({ ok: true, json: async () => (url.includes('config') ? config : url.includes('flavor-groups') ? flavorGroups : products) })
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets/app.js'),'utf8'),context,{filename:'assets/app.js'});
  await registered.DOMContentLoaded();
  return {el, local, registered, context};
}
function cardCount(html) { return (html.match(/<article class="product-card /g)||[]).length; }
function photoCount(html) { return (html.match(/<img class="product-image" /g)||[]).length; }
function placeholderCount(html) { return (html.match(/<div class="product-placeholder" /g)||[]).length; }

(async () => {
  assert.equal(originalCatalog.products.length, 182);
  const site = await loadSite(originalCatalog);
  const { el, local } = site;
  assert.equal(el('resultCount').textContent,'182 products');
  assert.equal(cardCount(el('catalogContent').innerHTML),182);
  assert.equal((el('catalogContent').innerHTML.match(/class="flavor-nav"/g)||[]).length,2);
  assert.equal((el('catalogContent').innerHTML.match(/class="flavor-section"/g)||[]).length,28);
  assert(el('catalogContent').innerHTML.includes('data-flavor-jump="sour-gush-extreme"'));
  assert(el('catalogContent').innerHTML.includes('data-flavor-select='));
  assert.equal(photoCount(el('catalogContent').innerHTML),182);
  // Image fit: only the Foger Kit source formats with built-in whitespace get scaled.
  function simulateImageLoad(path, width, height) {
    const classes = new Set(['product-image']);
    el('catalogContent').emit('load',{target:{
      classList:{contains:name=>classes.has(name),add:name=>classes.add(name)},
      getAttribute:()=>path,naturalWidth:width,naturalHeight:height
    }});
    return classes;
  }
  assert(!simulateImageLoad('./assets/products/foger/kits/cool-mint.webp',346,700).has('product-image--wide'));
  assert(simulateImageLoad('./assets/products/foger/kits/blackberry-passion-refresher.webp',900,563).has('product-image--wide'));
  assert(simulateImageLoad('./assets/products/foger/kits/strawberry-slush.webp',550,550).has('product-image--square'));
  assert(!simulateImageLoad('./assets/products/breeze/example.webp',900,563).has('product-image--wide'));
  assert.equal(placeholderCount(el('catalogContent').innerHTML),0);
  assert(el('brandFilters').innerHTML.includes('data-brand="foger"'));
  assert(!el('brandFilters').innerHTML.includes('data-brand="breeze"'));
  assert(!el('catalogContent').innerHTML.includes('Price not listed'));

  el('searchInput').value = 'Cool Mint';
  el('searchInput').emit('input');
  assert.equal(el('resultCount').textContent,'2 products');
  assert.equal(cardCount(el('catalogContent').innerHTML),2);
  assert(!el('catalogContent').innerHTML.includes('class="flavor-nav"'));
  const action = (id,a) => el('catalogContent').emit('click', {target:{closest:()=>({dataset:{id,action:a}})}});
  action('foger-kit-001','add');
  action('foger-pod-001','add');
  action('foger-kit-001','increase');
  assert.equal(el('cartSummary').textContent,'2 selected · 3 total units');
  assert(el('catalogContent').innerHTML.includes('data-action="toggle-note"'));
  el('catalogContent').emit('input',{target:{dataset:{noteId:'foger-kit-001'},value:'Ship two kits'}});
  el('cartButton').emit('click');
  assert.equal((el('reviewGroups').innerHTML.match(/class="review-item"/g)||[]).length,2);
  assert(el('reviewGroups').innerHTML.includes('Ship two kits'));
  assert(el('reviewGroups').innerHTML.includes('Foger'));
  el('storeSelect').value = 'south-60';
  el('storeSelect').emit('change');
  el('employeeName').value = 'Test Staff';
  el('employeeName').emit('input');
  el('sendOrder').emit('click');
  // A simulated form submit verifies the configured backend without a network request.
  assert(el('submissionStatus').textContent.includes('Sending your order request'));
  assert.equal(el('submissionForm').submits || 0, 1);
  assert.equal(el('submissionForm').action, config.backend.appsScriptUrl);
  const requestId = JSON.parse(el('submissionPayload').value).requestId;
  site.registered['window.message']({data:{
    source:'employee-vape-order-backend', requestId, ok:false,
    message:'Simulated backend error: no email was sent'
  }});
  assert(el('submissionStatus').textContent.includes('no email was sent'));
  assert(![...local.keys()].some(k=>k.startsWith('storeOrder.')));
  assert([...local.keys()].some(k=>k.startsWith('employeeVapeOrder.')));
  const reload = await loadSite(originalCatalog, local);
  assert.equal(reload.el('cartSummary').textContent, '2 selected · 3 total units');
  reload.el('cartButton').emit('click');
  assert(reload.el('reviewGroups').innerHTML.includes('Ship two kits'));
  assert.equal(reload.el('storeSelect').value,'south-60');
  assert.equal(reload.el('employeeName').value,'Test Staff');
  console.log('PASS: 182 Foger cards, 182 Kit and Pod photos, search, cart, notes, configured form submission and simulated backend response, isolated browser storage.');

  const copy = JSON.parse(JSON.stringify(originalCatalog));
  for(const [key,name] of [['breeze','Breeze'], ['raz','RAZ'], ['geek-bar','Geek Bar'], ['future-new','Future New']]) {
    copy.products.push({...copy.products[0], id:`${key}-disposable-example`,retailer:key==='future-new'?'Future New':name,retailerKey:key,brand:name,category:'Disposables',subcategory:'Demo',productName:`Example ${name} Disposable`,image:'',displayOrder:1000+copy.products.length});
  }
  const multi = await loadSite(copy);
  assert.equal(multi.el('resultCount').textContent,'186 products');
  for(const key of ['foger','breeze','raz','geek-bar','future-new']) assert(multi.el('brandFilters').innerHTML.includes(`data-brand="${key}"`));
  assert.equal(cardCount(multi.el('catalogContent').innerHTML),186);
  // Click one of the brand tabs: element must be a real member of querySelectorAll
  const button = { dataset:{brand:'geek-bar'}, classList:{toggle(){}},setAttribute(){} };
  multi.el('brandFilters').querySelectorAll = ()=>[button];
  multi.el('brandFilters').emit('click',{target:{closest:()=>button}});
  assert.equal(multi.el('resultCount').textContent,'1 product');
  multi.el('catalogContent').emit('click',{target:{closest:()=>({dataset:{id:'geek-bar-disposable-example',action:'add'}})}});
  multi.el('cartButton').emit('click');
  assert(multi.el('reviewGroups').innerHTML.includes('Geek Bar'));
  console.log('PASS: new brand buttons, filtering and cart-review grouping work without changing JavaScript.');
})().catch(err => {console.error(err); process.exit(1)});
