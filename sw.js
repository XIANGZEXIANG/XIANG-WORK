/* 只缓存公开外壳，绝不缓存解密后的内容。由 build.js 自动生成，请勿手改。 */
var CACHE = 'ibc-gate-v2';
var CORE = ["./index.html","./manifest.json","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./apple-touch-icon.png"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }))
      .then(function () { return c.match("./index.html"); })
      /* 同一份密文补一个目录键，两种入口断网都能回退，且不重复下载 */
      .then(function (r) { return r ? c.put("./", r.clone()) : null; });
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url; try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  var name = url.pathname.split('/').pop() || 'index.html';
  var isShell = req.mode === 'navigate' || CORE.indexOf('./' + name) >= 0;
  if (!isShell) return;   /* 其它请求一律直连，不拦截、不缓存 */
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { return c.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) {
      return hit || caches.match('./index.html');
    });
  }));
});
