/* Rose's EATS service worker. Regenerate with build_sw.ps1 after changing any precached file. */
const VERSION="b0040b45fc";
const SHELL="shell-"+VERSION;
const IMGS="imgs-v1";
const PRECACHE=['./', 'index.html', 'data.js?v=3', 'world.js?v=3', 'newrecipes.js?v=3', 'egypt.js?v=1', 'egypt-chef.js?v=1','egypt-guide.js?v=1', 'classify-fixes.js?v=1', 'photos.js?v=10', 'illus.js?v=1', 'chef.js?v=12', 'guide.js?v=6', 'risk.js?v=2', 'variations.js?v=2', 'app.js?v=20', 'kitchen.js?v=10', 'life.js?v=6', 'nutdb.js?v=3', 'nutrition.js?v=4', 'life2.js?v=2', 'closure.js?v=1', 'org.js?v=2', 'search.js?v=1', 'toc.js?v=1', 'share/bip39.js?v=1', 'share/crypto.js?v=1', 'share/model.js?v=1', 'share/store.js?v=1', 'share/pantry-tx.js?v=1', 'share/house.js?v=4', 'share/hook.js?v=3', 'share/ui.js?v=4'];
self.addEventListener("install",e=>{e.waitUntil(caches.open(SHELL).then(c=>Promise.all(PRECACHE.map(u=>c.add(new Request(u,{cache:"reload"})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("shell-")&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
const isImg=/\.(jpe?g|png|webp)$|\/medium$|\/small$|\/large$/.test(u.pathname)||r.destination==="image";
if(u.origin!==location.origin){if(isImg)e.respondWith(caches.match(r.url).then(hit=>hit||fetch(r)));return}
if(isImg){e.respondWith(caches.match(r.url).then(hit=>{const net=fetch(r).then(res=>{if(res&&res.ok)caches.open(IMGS).then(c=>c.put(r,res.clone()).catch(()=>{}));return res}).catch(()=>hit);return hit||net}));return}
e.respondWith(fetch(r,{cache:"no-cache"}).then(res=>{if(res&&res.ok){const cp=res.clone();caches.open(SHELL).then(c=>c.put(r,cp))}return res}).catch(()=>caches.match(r,{ignoreSearch:false}).then(h=>h||caches.match(r,{ignoreSearch:true})).then(h=>h||(r.mode==="navigate"?caches.match("index.html"):Response.error()))))});
