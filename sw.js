const V='formula-pixel-v3',CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','favicon.png','favicon.ico','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
  if(q.mode==='navigate'){
    // HTML: rede primeiro (deploys novos aparecem na hora), cache como fallback offline
    e.respondWith(Promise.race([fetch(q),new Promise((_,j)=>setTimeout(j,3500))]).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put('index.html',c))}return r}).catch(()=>caches.match('index.html').then(h=>h||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(q).then(hit=>{
    const net=fetch(q).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(q,c))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
