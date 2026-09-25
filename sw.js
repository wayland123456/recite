/* 背诵打卡 · Service Worker
   策略：优先走网络（改版后学生能立刻拿到新版），断网时才用缓存兜底。
   这样既支持离线打开 / 加到手机桌面，又不会出现「页面改了但学生看到旧的」。 */
const CACHE = 'recite-v6';

self.addEventListener('install', e => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  /* 页面（HTML）一律绕过 HTTP 缓存：改版后刷新即可拿到新版，不用等 CDN max-age */
  const isDoc = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').indexOf('text/html') > -1;
  const target = isDoc ? new Request(req.url, { cache: 'no-store', headers: req.headers }) : req;

  e.respondWith(
    fetch(target)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});
