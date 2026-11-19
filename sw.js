// Dienstplan: Programmdateien zwischenspeichern, damit die App auch ohne Netz startet. Immer zuerst aus dem Internet laden,
// damit neue Fassungen sofort ankommen; nur ohne Netz den gespeicherten Stand nehmen. Die Plandaten liegen nicht hier, sondern im Speicher des Browsers.
const C = "dienstplan-5";
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(["./", "./index.html", "./anleitung.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon.svg"])).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x !== "dienstplan-empfang").map(x => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => { const u = new URL(e.request.url);
  // Spec 004: Android „Teilen → Dienstplan“ schickt die Datei per POST an ./empfang. Sie wird kurz zwischengelegt, die App holt sie dann ab.
  if (e.request.method === "POST" && u.origin === location.origin && u.pathname.endsWith("/empfang")) {
    e.respondWith((async () => {
      try { const f = (await e.request.formData()).get("datei");
        if (f && f.text) { const c = await caches.open("dienstplan-empfang");
          await c.put("./empfangen-datei", new Response(await f.text(), { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Dateiname": encodeURIComponent(f.name || "Datei") } })); }
      } catch (x) {}
      return Response.redirect("./?empfang=1", 303);
    })());
    return;
  }
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => { if (r.ok) { const k = r.clone(); caches.open(C).then(c => c.put(e.request, k)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))); });
