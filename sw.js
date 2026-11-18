/* Service worker: permite instalar la app y usarla sin conexión.
   - Las páginas (index.html, linea.html, arbol.html, juegos.html), los datos y el código compartido
     (datos.js, parentesco.js) y los estilos (comun.css) se piden
     primero a la red, para recibir siempre la última versión, y si no hay conexión se usa la
     copia guardada.
   - Los iconos y las imágenes se sirven desde la caché.
   Si cambias los iconos o el manifiesto, o añades archivos a ASSETS, sube el número de versión de CACHE. */
const CACHE = 'linea-biblica-v5';
const ASSETS = [
  './',
  './index.html',
  './linea.html',
  './arbol.html',
  './juegos.html',
  './datos.js',
  './parentesco.js',
  './comun.css',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Páginas, datos y estilos: red primero (cambian con cada versión del proyecto)
const redPrimero = req => req.mode === 'navigate' || /\.(html|js|css|webmanifest)$/.test(new URL(req.url).pathname);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  if (redPrimero(req)){
    // Cada archivo se guarda con su propia dirección; sin conexión se usa esa copia
    // (y, si es una página que no está guardada, la portada)
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok && !res.redirected){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, {ignoreSearch:true})
          .then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  // Resto (iconos e imágenes): caché primero
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
