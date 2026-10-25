/* Forgiving answer matching for guessing games: typos, missing "the", extra words, aliases. */
(function () {
  "use strict";
  const PP = (window.PP = window.PP || {});
  const STOP = new Set("the a an of and in on at to my i is it for with your you".split(" "));

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function tokens(s) { return norm(s).split(" ").filter((t) => t && !STOP.has(t)); }
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (!m || !n) return m || n;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  const tokEq = (a, b) => a === b || (a.length >= 5 && b.length >= 5 && lev(a, b) <= 1) || (a.length >= 8 && lev(a, b) <= 2);

  // returns "ok" | "close" | "no"
  function one(guess, answer) {
    const g = norm(guess), a = norm(answer);
    if (!g) return "no";
    if (g === a) return "ok";
    const gt = tokens(guess), at = tokens(answer);
    if (!at.length) return g === a ? "ok" : "no";
    if (!gt.length) return "no";
    const hit = at.filter((t) => gt.some((u) => tokEq(t, u))).length;
    if (hit === at.length && gt.length <= at.length + 2) return "ok";
    const gj = gt.join(""), aj = at.join("");
    if (gj === aj) return "ok";                                        // "spiderman" vs "spider man"
    if (aj.length >= 4 && lev(gj, aj) <= Math.max(1, Math.floor(aj.length / 6))) return "ok";
    if (at.length >= 2 && hit / at.length >= 0.5) return "close";
    return "no";
  }

  PP.match = function (guess, answer, aliases) {
    let best = one(guess, answer);
    if (best === "ok") return best;
    for (const al of aliases || []) { const r = one(guess, al); if (r === "ok") return r; if (r === "close") best = "close"; }
    return best;
  };
  PP.norm = norm;

  /* words you can't say when describing a title */
  PP.bannedWords = function (title) {
    const out = [];
    tokens(title).forEach((t) => { if (t.length >= 3 && !out.includes(t)) out.push(t); });
    return out;
  };
})();
