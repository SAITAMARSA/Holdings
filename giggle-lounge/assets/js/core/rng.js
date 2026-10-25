/* Randomness engine.
 *  - RNG.secure()           crypto-seeded, for things only this device needs to roll
 *  - RNG.fromSeed(seed, k)  deterministic stream: every phone given the same (seed, k) rolls the same
 *    numbers, so a game can be replayed from the shared event log. The server picks `seed` with
 *    random_int(), so each session is genuinely different.
 *  - bag()                  "shuffle bag": every item appears once before any repeats (no streaks)
 */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});

  function strHash(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function sfc32(a, b, c, d) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  class RNG {
    constructor(seedString) {
      const h = strHash(String(seedString));
      this._f = sfc32(h(), h(), h(), h());
      for (let i = 0; i < 12; i++) this._f();      // warm up
    }
    static fromSeed(seed, key) { return new RNG(seed + "::" + (key || "")); }
    static secure() {
      const a = new Uint32Array(4);
      (window.crypto || window.msCrypto).getRandomValues(a);
      return new RNG(Array.from(a).join("-"));
    }
    next() { return this._f(); }
    int(n) { return Math.floor(this._f() * n); }                 // 0 .. n-1
    range(lo, hi) { return lo + this.int(hi - lo + 1); }          // inclusive
    chance(p) { return this._f() < p; }
    pick(arr) { return arr[this.int(arr.length)]; }
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    sample(arr, n) { return this.shuffle(arr).slice(0, n); }
    // pick one by weight: weights is an array parallel to items
    weighted(items, weights) {
      let total = 0;
      for (let i = 0; i < weights.length; i++) total += weights[i];
      let r = this._f() * total;
      for (let i = 0; i < items.length; i++) { r -= weights[i]; if (r <= 0) return items[i]; }
      return items[items.length - 1];
    }
    die(sides) { return 1 + this.int(sides || 6); }
    // an endless no-repeat-until-exhausted sequence
    bag(items) {
      const self = this;
      let q = [];
      return function () {
        if (!q.length) q = self.shuffle(items);
        return q.pop();
      };
    }
  }

  PP.RNG = RNG;
})();
