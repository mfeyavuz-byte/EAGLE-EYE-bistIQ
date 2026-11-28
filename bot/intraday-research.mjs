// Çalıştır: node bot/intraday-research.mjs <portfolio-sim --cache dosyası> · GÜN İÇİ / 2–3 GÜN kuralları — saatlik 2 yıl, 196 hisse. Giriş = sinyalden SONRAKİ saatin kapanışı (gecikme payı).
// Getiri: gün sonuna (EOD) ve 3 güne (30 saat) — aynı saatteki tüm likit hisselerin ortalamasına göre FAZLA. Eğitim ilk %60 / test son %40.
import { readFileSync } from "node:fs";
import { fetchHourly, istDay } from "./data.mjs";
const C = JSON.parse(readFileSync(process.argv[2], "utf8")), HR = C.HR, XH = await fetchHourly("XU100");
const byDay = a => { const m = new Map(); for (const b of a) { const d = istDay(b.ts); (m.get(d) || m.set(d, []).get(d)).push(b); } return [...m.entries()]; };
const XD = new Map(byDay(XH).map(([d, bs]) => [d, bs])), xDays = [...XD.keys()];
const prevX = new Map(xDays.map((d, i) => [d, i ? XD.get(xDays[i - 1]).at(-1).close : null]));
const S = {}, uni = {};   // kural → [{ts, f:[eod,3g]}] · ts → [f]
const R = (k, o) => (S[k] = S[k] || []).push(o);
for (const s in HR) {
  const a = HR[s] || []; if (a.length < 400) continue;
  const days = byDay(a), flat = a, idxOf = new Map(flat.map((b, i) => [b.ts, i]));
  const volBy = {};   // gün içi sıra k → son 20 günün birikimli hacmi (RVOL için)
  for (let di = 1; di < days.length; di++) {
    const [d, bs] = days[di], pbs = days[di - 1][1], pc = pbs.at(-1).close, ph = Math.max(...pbs.map(b => b.high));
    const dv = pbs.reduce((x, b) => x + (b.volume || 0), 0); if (dv * pc < 5e6) { continue; }
    const hist = days.slice(Math.max(0, di - 20), di).map(([, x]) => x);
    let cum = 0, pcum = hist.map(() => 0), brokeHi = false;
    const or = bs[0], orH = or.high;
    for (let k = 0; k < bs.length - 1; k++) {
      const b = bs[k], i = idxOf.get(b.ts); if (i == null || i + 31 >= flat.length) continue;
      cum += b.volume || 0; hist.forEach((x, h) => { pcum[h] += x[k]?.volume || 0; });
      const ent = flat[i + 1].close, eodBar = bs.at(-1), eod = istDay(flat[i + 1].ts) === d ? (eodBar.close / ent - 1) * 100 : null, f3 = (flat[i + 31].close / ent - 1) * 100;
      if (eod == null) continue;
      const o = { ts: b.ts, f: [eod, f3] }; (uni[b.ts] = uni[b.ts] || []).push(o.f);
      const avgCum = pcum.reduce((x, y) => x + y, 0) / Math.max(1, hist.length), rvol = avgCum > 0 ? cum / avgCum : 0;
      // 1) ORB: ilk saat (açılış aralığı) tepesini 12:30'a kadar (k≤3) hacimle ilk kez kıran kapanış
      if (k >= 1 && k <= 3 && b.close > orH && bs.slice(1, k).every(x => x.close <= orH) && (b.volume || 0) > (or.volume || 1) * 0.5) R("1 ORB: açılış saati tepesi kırılımı (≤12:30)", o);
      // 2) RVOL: saat k'ya kadar birikimli hacim son 20 günün aynı saatine göre ≥2×, fiyat dünkü kapanış ve açılışın üstünde
      if (k >= 1 && k <= 5 && rvol >= 2 && b.close > pc && b.close > bs[0].open) R("2 RVOL ≥2× + yükselişte (≤14:30)", o);
      // 3) Dünkü tepe kırılımı: saatlik kapanış dünkü tepenin üstünde (gün içinde ilk kez)
      if (!brokeHi && b.close > ph) { brokeHi = true; if (k <= 5) R("3 dünkü tepenin ilk kez üstü (≤14:30)", o); }
      // 4) Gün içi göreli güç: endeks dünkü kapanışa göre ≤−%1 iken hisse ≥+%1 (11:30–13:30)
      const xb = XD.get(d)?.find(x => x.ts === b.ts), xp = prevX.get(d);
      if (k >= 1 && k <= 3 && xb && xp && xb.close / xp - 1 <= -0.01 && b.close / pc - 1 >= 0.01) R("4 endeks ≤−%1 iken hisse ≥+%1", o);
      // 5) Gap tutunması: ≥+%3 boşlukla açılış, ilk saat açılışın üstünde kapanış (k=0)
      if (k === 0 && bs[0].open / pc - 1 >= 0.03 && b.close > b.open) R("5 ≥+%3 gap + ilk saat tutunma", o);
    }
  }
}
// 6) GENİŞLİK: gün içi saat k'da hisselerin yüzde kaçı dünkü kapanış üstünde; aynı gün <%30'dan ≥%60'a çıkış → XU100 gün sonu ve 3 gün (koşulsuza göre)
const brd = {}; for (const s in HR) { for (const [d, bs] of byDay(HR[s] || [])) bs.forEach((b, k) => { const key = d + "|" + k; (brd[key] = brd[key] || []).push(b); }); }
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const um = {}; for (const t in uni) um[t] = [avg(uni[t].map(f => f[0])), avg(uni[t].map(f => f[1]))];
const rep = (n, a) => { a.sort((p, q) => p.ts - q.ts); const c = Math.floor(a.length * 0.6), ex = (xs, j) => avg(xs.map(o => o.f[j] - um[o.ts][j]));
  console.log(`${n.padEnd(40)} n=${String(a.length).padStart(5)} · gün sonu fazla %${ex(a, 0).toFixed(2)} (eğitim ${ex(a.slice(0, c), 0).toFixed(2)} / test ${ex(a.slice(c), 0).toFixed(2)}) · 3g fazla %${ex(a, 1).toFixed(2)} (eğitim ${ex(a.slice(0, c), 1).toFixed(2)} / test ${ex(a.slice(c), 1).toFixed(2)}) · 3g kazanma %${Math.round(avg(a.map(o => o.f[1] > um[o.ts][1] ? 1 : 0)) * 100)}`); };
for (const k of Object.keys(S).sort()) rep(k, S[k]);
// genişlik (piyasa seviyesi): önceki gün kapanışına göre — hisse bazında pc gerekiyor; yaklaşık: gün içi açılışa göre
const ev = [], all = [];
for (let di = 1; di < xDays.length - 3; di++) {
  const d = xDays[di], xs = XD.get(d); let lowSeen = false, fired = false;
  for (let k = 0; k < xs.length - 1 && !fired; k++) {
    const bs = brd[d + "|" + k] || []; if (bs.length < 50) continue;
    const up = bs.filter(b => b.close > (brd[d + "|0"] || []).find(x => x === b)?.open || b.close > b.open).length / bs.length;
    if (up < 0.3) lowSeen = true;
    if (lowSeen && up >= 0.6) { fired = true; const ent = xs[k + 1]?.close; if (ent) ev.push([(xs.at(-1).close / ent - 1) * 100, (XD.get(xDays[di + 3]).at(-1).close / ent - 1) * 100]); }
  }
  all.push([(xs.at(-1).close / xs[0].close - 1) * 100, (XD.get(xDays[di + 3]).at(-1).close / xs.at(-1).close - 1) * 100]);
}
console.log(`6 GENİŞLİK <%30→≥%60 (XU100)             n=${ev.length} gün · gün sonu %${avg(ev.map(x => x[0])).toFixed(2)} · 3g %${avg(ev.map(x => x[1])).toFixed(2)} (koşulsuz 3g %${avg(all.map(x => x[1])).toFixed(2)})`);
