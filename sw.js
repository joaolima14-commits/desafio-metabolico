
const CACHE='desafio-metabolico-v1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./pages.json','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('fetch',event=>{event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return resp}).catch(()=>cached))) });
