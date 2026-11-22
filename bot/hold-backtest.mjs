// TUTUŞ LİSTESİ ölçümü — çalıştır: node bot/hold-backtest.mjs (~1 dk, Yahoo). Haftalık (5g) ve aylık (21g) tutuş adaylarının geçmiş 12 ay ölçümü: aday ort. ileri getiri − tüm likit hisselerin ortalaması
import { enrichData } from "./engine.mjs";
import { fetchDaily, istDay } from "./data.mjs";
import syms from "./symbols.json" with { type: "json" };
const D = {}; for (let b = 0; b < syms.length; b += 8) await Promise.all(syms.slice(b, b + 8).map(async s => { D[s] = await fetchDaily(s); }));
const IDX = await fetchDaily("XU100"), E = {}; for (const s of syms) if (D[s].length > 260) E[s] = enrichData(D[s]);
const sma = (a, j, n) => { if (j < n - 1) return null; let x = 0; for (let k = j - n + 1; k <= j; k++) x += a[k].close; return x / n; };
const days = IDX.map(x => istDay(x.ts)).slice(-275, -21);   // 21g ileri getiri ölçülebilsin
const pos = {}; for (const s in E) { pos[s] = new Map(D[s].map((b, j) => [istDay(b.ts), j])); }
const R = { P: [], B: [], M: [], W1: [], W2: [], ALL5: [], ALL21: [] }, byDay = [];
for (const day of days) {
  const xi = IDX.findIndex(x => istDay(x.ts) === day); const ir20 = (IDX[xi].close - IDX[xi - 20].close) / IDX[xi - 20].close * 100, ir120 = (IDX[xi].close - IDX[xi - 120].close) / IDX[xi - 120].close * 100;
  const cand = { P: [], B: [], M: [], W1: [], W2: [] }, all5 = [], all21 = [];
  for (const s in E) {
    const j = pos[s].get(day); if (j == null || j < 240 || j + 21 >= D[s].length) continue;
    const a = D[s], e = E[s][j], c = a[j].close, v20 = a.slice(j - 19, j + 1).reduce((x, b) => x + (b.volume || 0), 0) / 20;
    if (v20 * c < 5e6) continue;
    const f5 = (a[j + 5].close - c) / c * 100, f21 = (a[j + 21].close - c) / c * 100; all5.push(f5); all21.push(f21);
    const m20 = sma(a, j, 20), m20p = sma(a, j - 5, 20), m50 = sma(a, j, 50), m200 = sma(a, j, 200), rs20 = (c - a[j - 20].close) / a[j - 20].close * 100 - ir20;
    // P: yükselen trendde MA20'ye geri çekilme
    if (m20 > m50 && m50 > m200 && m20 > m20p && c >= m20 * 0.99 && c <= m20 * 1.03 && e.rsi >= 40 && e.rsi <= 60 && rs20 > 0) cand.P.push({ s, sc: rs20, f5 });
    // B: 20 günlük zirve kırılımı + hacim
    const hi20 = Math.max(...a.slice(j - 20, j).map(b => b.high));
    if (c > hi20 && (a[j].volume || 0) > v20 * 1.5 && c > m50 && e.rsi < 75 && rs20 > 0) cand.B.push({ s, sc: rs20, f5 });
    // M: mevcut aylık (Stage-2) kuralı — position-scan.mjs ile aynı kapılar
    const pr = E[s][j - 21];
    if (e.ma50 && e.ma200 && e.ma50 > e.ma200 && c > e.ma50 && pr?.ma200 && e.ma200 > pr.ma200 && e.rsi >= 50 && e.rsi <= 72 && (e.adx || 0) >= 20) {
      const rs = (c - a[j - 120].close) / a[j - 120].close * 100 - ir120; if (rs > 0) { const ext = (c / e.ma50 - 1) * 100; const sc = rs * 0.6 + (e.adx || 0) * 0.4 + ((e.obv != null && pr.obv != null && e.obv > pr.obv) ? 10 : 0) - Math.max(0, ext - 15) * 0.5; cand.M.push({ s, sc, f21 }); cand.W1.push({ s, sc, f5 }); if (c >= m20 * 0.99 && c <= m20 * 1.03) cand.W2.push({ s, sc, f5 }); }
    }
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null, b5 = avg(all5), b21 = avg(all21);
  const row = { day, b5, b21 };
  for (const k of ["P", "B", "W1", "W2"]) { const t = cand[k].sort((x, y) => y.sc - x.sc).slice(0, 10); if (t.length) { R[k].push(...t.map(x => x.f5 - b5)); row[k] = t.map(x => x.f5); } }
  { const t = cand.M.sort((x, y) => y.sc - x.sc).slice(0, 12); if (t.length) { R.M.push(...t.map(x => x.f21 - b21)); row.M = t.map(x => x.f21); } }
  byDay.push(row);
}
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0, half = Math.floor(byDay.length / 2);
for (const [k, h, lab] of [["M", 21, "AYLIK: Stage-2 listesi 21 gün"], ["W1", 5, "HAFTALIK: Stage-2 listesi 5 gün"], ["W2", 5, "HAFTALIK: Stage-2 + MA20 geri çekilme"], ["P", 5, "HAFTALIK: trendde MA20 geri çekilme"], ["B", 5, "HAFTALIK: 20g zirve kırılımı+hacim"]]) {
  const part = rows => { const ex = [], raw = [], win = []; for (const r of rows) if (r[k]) for (const f of r[k]) { const b = h === 5 ? r.b5 : r.b21; ex.push(f - b); raw.push(f); win.push(f > b ? 1 : 0); } return { n: ex.length, ex: avg(ex), raw: avg(raw), win: avg(win) * 100 }; };
  const A = part(byDay), H1 = part(byDay.slice(0, half)), H2 = part(byDay.slice(half));
  console.log(`${lab}\n   ${A.n} aday-gün · ort ${h}g getiri %${A.raw.toFixed(2)} · piyasaya göre FAZLA %${A.ex.toFixed(2)} · piyasayı geçme %${A.win.toFixed(0)} · 1. yarı fazla %${H1.ex.toFixed(2)} · 2. yarı %${H2.ex.toFixed(2)}`);
}
console.log(`dönem ${byDay[0].day} → ${byDay.at(-1).day} (${byDay.length} gün)`);
