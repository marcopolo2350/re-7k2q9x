/* Rose's EATS household sharing: transactional local store (IndexedDB), reused unchanged from the Phase 5 sync engine.
   Records and their metadata are written in ONE transaction, so an interruption leaves either all of a change or none of it.
   The app's main state stays in localStorage (unchanged); this store is derived from it and can be rebuilt. */
"use strict";
const RStore = (() => {
  const VERSION = 1;
  const P = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
  class Store {
    constructor(name) { this.name = name; this.db = null; this.fault = null; }
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((ok, no) => {
        const r = indexedDB.open(this.name, VERSION);
        r.onupgradeneeded = e => { const db = r.result; if (e.oldVersion < 1) { db.createObjectStore("rec", { keyPath: "k" }); db.createObjectStore("out", { keyPath: "id" }); db.createObjectStore("meta"); db.createObjectStore("keys"); db.createObjectStore("park", { keyPath: "id" }); db.createObjectStore("att"); } };
        r.onsuccess = () => { this.db = r.result; this.db.onversionchange = () => { this.db.close(); this.db = null; }; ok(this.db); };
        r.onerror = () => no(r.error); r.onblocked = () => no(new Error("storage blocked by another tab"));
      });
    }
    /* fn receives promise-based store handles and may await ONLY those (no crypto/network inside a transaction).
       this.fault = {type:"quota"|"crash", once:true} makes the next write transaction abort after fn ran (test hook). */
    async tx(names, mode, fn) {
      const db = await this.open();
      return new Promise((ok, no) => {
        const t = db.transaction(names, mode); let res, err;
        const st = {}; for (const n of names) { const o = t.objectStore(n); st[n] = { get: k => P(o.get(k)), put: (v, k) => P(k === undefined ? o.put(v) : o.put(v, k)), del: k => P(o.delete(k)), all: () => P(o.getAll()), keys: () => P(o.getAllKeys()), clear: () => P(o.clear()), count: () => P(o.count()) }; }
        t.oncomplete = () => ok(res); t.onabort = () => no(err || t.error || new Error("transaction aborted"));
        Promise.resolve().then(() => fn(st)).then(r => {
          res = r;
          if (mode === "readwrite" && this.fault) { const f = this.fault; if (f.once !== false) this.fault = null; err = Object.assign(new Error(f.type === "quota" ? "storage full (simulated)" : "app closed mid-write (simulated)"), { name: f.type === "quota" ? "QuotaExceededError" : "AbortError" }); t.abort(); }
        }, e => { err = e; try { t.abort(); } catch (x) {} });
      });
    }
    get(store, k) { return this.tx([store], "readonly", s => s[store].get(k)); }
    put(store, v, k) { return this.tx([store], "readwrite", s => s[store].put(v, k)); }
    all(store) { return this.tx([store], "readonly", s => s[store].all()); }
    close() { if (this.db) { this.db.close(); this.db = null; } }
    destroy() { this.close(); return new Promise(ok => { const r = indexedDB.deleteDatabase(this.name); r.onsuccess = r.onerror = r.onblocked = () => ok(); }); }
  }
  return { Store, VERSION };
})();
