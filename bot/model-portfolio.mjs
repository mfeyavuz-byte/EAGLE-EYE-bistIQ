// MODEL PORTFÖY (aylık + 3 aylık) — her Pazartesi 08:00 Telegram. Kullanıcı isteği: HER HAFTA DOLU portföy (nakit önerisi yok).
// Kurallar ölçülerek seçildi (2026-11-26, 12 ay, her Pazartesi kurulan eşit ağırlıklı portföy, sektör ≤2, getiri − tüm likit hisseler):
//  AYLIK  = Stage-2 skoru: +%2.03/ay (6a RS sırası +2.18, düşük oynaklık +1.84). Aday 8'den azsa düşük oynaklık, sonra 6a RS ile doldurulur.
//  3 AYLIK = düşük oynaklık (MA200 üstü, endeksten güçlü, en sakin): −%0.35 — test edilen hiçbir yöntem 3 ayda piyasayı geçmedi,
//           bu en az kayıplısı (Stage-2/RS −%4) → mesajda açıkça yazılır. Aday 10'dan azsa 6a RS ile doldurulur.
import { enrichData } from "./engine.mjs";
import SEC from "./sectors.json" with { type: "json" };
const secOf = s => Object.entries(SEC).find(([, a]) => a.includes(s))?.[0] || s;
const sma = (a, j, n) => { if (j < n - 1) return null; let x = 0; for (let k = j - n + 1; k <= j; k++) x += a[k].close; return x / n; };

// data: { SYM: günlük mumlar }, idx: XU100 günlük. Saf fonksiyon (test edilebilir).
export function buildModels(data, idx) {
  const xi = idx.length - 1, x200 = sma(idx, xi, 200);
  const bear = !!(x200 && idx[xi].close < x200), ir120 = xi >= 120 ? (idx[xi].close - idx[xi - 120].close) / idx[xi - 120].close * 100 : 0;
  const S = [], L = [], F = [];   // F: yedek — tüm likit hisseler, 6a göreli güç sırası
  for (const [s, a] of Object.entries(data)) {
    const j = a.length - 1; if (j < 250) continue;
    const c = a[j].close, v20 = a.slice(j - 19, j + 1).reduce((x, b) => x + (b.volume || 0), 0) / 20; if (v20 * c < 5e6) continue;
    const ed = enrichData(a), e = ed[j], pr = ed[j - 21];
    const rs6 = (c - a[j - 120].close) / a[j - 120].close * 100 - ir120, m200 = sma(a, j, 200);
    F.push({ sym: s, price: c, sc: rs6, stop: +(Math.min(...a.slice(j - 20, j + 1).map(b => b.low)) * 0.98).toFixed(2), rs: +rs6.toFixed(1), tag: "RS" });
    if (e.ma50 && e.ma200 && e.ma50 > e.ma200 && c > e.ma50 && pr?.ma200 && e.ma200 > pr.ma200 && e.rsi >= 50 && e.rsi <= 72 && (e.adx || 0) >= 20 && rs6 > 0) {
      const ext = (c / e.ma50 - 1) * 100;
      S.push({ sym: s, price: c, sc: rs6 * 0.6 + (e.adx || 0) * 0.4 + ((e.obv != null && pr.obv != null && e.obv > pr.obv) ? 10 : 0) - Math.max(0, ext - 15) * 0.5, stop: +(e.ma50 * 0.97).toFixed(2), rs: +rs6.toFixed(1), tag: "Stage-2" });
    }
    if (m200 && c > m200 && rs6 > 0) {
      const rr = []; for (let k = j - 119; k <= j; k++) rr.push(a[k].close / a[k - 1].close - 1);
      const mu = rr.reduce((x, y) => x + y, 0) / rr.length, vol = Math.sqrt(rr.reduce((x, y) => x + (y - mu) ** 2, 0) / rr.length);
      L.push({ sym: s, price: c, sc: -vol, stop: +(m200 * 0.98).toFixed(2), rs: +rs6.toFixed(1), vol: +(vol * Math.sqrt(252) * 100).toFixed(0), tag: "düşük oynaklık" });
    }
  }
  // Öncelik sırasıyla doldur (her liste kendi skoruna göre), sektör ≤2, aynı hisse bir kez → portföy HER ZAMAN N hisse (veri yetiyorsa)
  const pick = (lists, N) => { const out = [], cnt = {}, seen = new Set();
    for (const arr of lists) for (const x of [...arr].sort((p, q) => q.sc - p.sc)) { if (out.length >= N) break; const k = secOf(x.sym); if (seen.has(x.sym) || (cnt[k] || 0) >= 2) continue; seen.add(x.sym); cnt[k] = (cnt[k] || 0) + 1; out.push(x); }
    return out; };
  return { bear, xu: idx[xi].close, x200, monthly: pick([S, L, F], 8), quarterly: pick([L, F], 10) };
}

export function modelMsg(m, when) {
  const fmt = arr => { const w = +(100 / arr.length).toFixed(1); return arr.map((x, i) => `${i + 1}. ${x.sym} @${x.price}₺ · %${w} · ${x.tag} · RS6a ${x.rs >= 0 ? "+" : ""}${x.rs}${x.vol != null ? ` · oynaklık %${x.vol}` : ""} · stop ${x.stop}`).join("\n"); };
  let t = `💼 MODEL PORTFÖY — bu haftanın en iyi seçimi\n${when}\n\n🌐 Piyasa: XU100 ${m.xu} · MA200 ${m.x200 ? Math.round(m.x200) : "?"} → ${m.bear ? "düşüş trendi (stop'lara sadık kal)" : "yükseliş trendi"}`;
  t += `\n\n🗓 AYLIK MODEL — ${m.monthly.length} hisse, eşit ağırlık (~1 ay tut)\nSeçim: Stage-2 trend lideri; yetmezse düşük oynaklıklı güçlü, sonra endeksten en güçlü · sektör ≤2\n` + fmt(m.monthly);
  t += `\n\n📆 3 AYLIK MODEL — ${m.quarterly.length} hisse, eşit ağırlık (~3 ay tut)\nSeçim: MA200 üstü + endeksten güçlü + en düşük oynaklık; yetmezse endeksten en güçlü · sektör ≤2\n` + fmt(m.quarterly);
  t += "\n\n📏 Ölçüm (son 12 ay, her Pazartesi kurulan portföy): aylık seçim piyasa ortalamasını ayda ort. +%2.0 geçti. 3 aylıkta test edilen hiçbir yöntem piyasayı geçmedi; bu seçim en az kayıplısı → stop'lara uy.";
  return t + "\n\n⚠ Yatırım tavsiyesi değildir · Her Pazartesi 08:00 güncellenir.";
}
