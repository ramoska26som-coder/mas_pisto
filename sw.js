/* Service worker de Más Pisto (panel + verificador).
   Estrategia: RED PRIMERO. Siempre intenta traer la versión más nueva
   (así los cambios subidos a GitHub Pages llegan de inmediato) y solo
   usa la copia guardada si no hay internet. */
const CACHE = 'mp-v2.1';
const SHELL = ['./panel.html', './verificador.html', './icono-192.png', './icono-512.png',
               './icono-v-192.png', './icono-v-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo interceptamos lo nuestro (mismo origen). Supabase y demás van directo.
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Guardar copia fresca para cuando no haya internet
        const copia = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

/* Al tocar una notificación: enfocar la app si está abierta, o abrirla. */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow('./panel.html');
    })
  );
});
