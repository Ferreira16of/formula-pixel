const V='formula-pixel-v5',CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','favicon.png','favicon.ico','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// Compara o index.html da rede com o guardado; se mudou, guarda e avisa as abas abertas
const chk=async()=>{
  try{
    const r=await fetch('index.html',{cache:'no-store'});
    if(!r.ok)return;
    const t=await r.text();
    if(!t.includes('id="c"'))return;
    const c=await caches.open(V),old=await c.match('index.html'),o=old?await old.text():null;
    if(o===t)return;
    await c.put('index.html',new Response(t,{headers:{'Content-Type':'text/html; charset=utf-8'}}));
    if(o!==null)(await self.clients.matchAll()).forEach(x=>x.postMessage({t:'update'}));
  }catch(_){}
};
self.addEventListener('message',e=>{if(e.data==='check')e.waitUntil(chk())});
self.addEventListener('fetch',e=>{
  const q=e.request;
  if(q.method!=='GET'||new URL(q.url).origin!==location.origin)return;
  if(q.mode==='navigate'){
    const pth=new URL(q.url).pathname,home=pth==='/'||pth.endsWith('/index.html')||pth.endsWith('/');
    if(!home)return;
    // HTML: rede primeiro (deploys novos aparecem na hora); sem internet, vai direto pro cache
    const net=self.navigator.onLine===false?Promise.reject():Promise.race([fetch(q),new Promise((_,j)=>setTimeout(j,3500))]);
    e.respondWith(net.then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put('index.html',c))}return r}).catch(()=>caches.match('index.html').then(h=>h||caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(q).then(hit=>{
    const net=fetch(q).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(q,c))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
