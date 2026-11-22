// PORTFÖY SİMÜLATÖRÜ — AI TRADER'ı geçmişte gün gün AYNI KODLA yeniden oynatır. Yalnız ölçüm aracı: canlıya etkisi yok,
// gist'e/Telegram'a ASLA yazmaz (anahtarlar silinir + simülasyon sırasında dış ağ tamamen kapatılır).
// Kullanım: node bot/portfolio-sim.mjs [başlangıç YYYY-AA-GG] [--ters-yol]   (varsayılan 2026-06-16 = botun canlıya başladığı gün)
//   --ters-yol: gün içi sıra varsayımını tersine çevirir (kırmızı mumda önce dip) → sonucun bu varsayıma duyarlılığını sınar.
//
// Her gün, o günün verisiyle (gelecek sızıntısı yok): scanAll (canlı tarayıcı) → marketContext (rejim/genişlik/RS, canlı kod)
// → runPaper (canlı AI TRADER). Gün içi: 20 dk'da bir tarayan botu taklit etmek için fiyat açılış → tepe/dip → kapanış yolunda
// 13 noktada gezdirilir (kırmızı mumda önce tepe, yeşilde önce dip — standart varsayım); AL/SAT sinyalleri kapanışta.
// Dahil DEĞİL (geçmişe dönük üretilemez): haber puanı, MCP katmanı (bilanço kara listesi / PE<0 / analist).
// Sınır: tek dönem, kısa örnek → ince ayar için değil, bariz yapısal hataları görmek için.
for (const k of ["GH_GIST_TOKEN", "GIST_ID", "TG_TOKEN", "TG_CHAT", "XAI_API_KEY", "GEMINI_API_KEY"]) delete process.env[k];
const { scanAll, marketContext, runPaper, perfStats } = await import("./run.mjs");
const { fetchDaily, fetchWeekly, istDay, weeklyAsOf } = await import("./data.mjs");
const { default: syms } = await import("./symbols.json", { with: { type: "json" } });

const ARGS = process.argv.slice(2), FROM = ARGS.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || "2026-06-16", REV = ARGS.includes("--ters-yol"), START = 500000, STEPS = 4;   // segment başına 4 nokta → günde 13 kontrol

console.log(`Veri çekiliyor (${syms.length} hisse × günlük+haftalık + XU100)…`);
const D = {}, W = {};
for (let b = 0; b < syms.length; b += 8) await Promise.all(syms.slice(b, b + 8).map(async s => { [D[s], W[s]] = await Promise.all([fetchDaily(s), fetchWeekly(s)]); }));
const IDX = await fetchDaily("XU100");
const days = IDX.map(x => istDay(x.ts)).filter(d => d >= FROM);
if (days.length < 5) { console.log("Yeterli gün yok."); process.exit(1); }
const upto = (a, day) => { let j = -1; for (let k = (a || []).length - 1; k >= 0; k--) if (istDay(a[k].ts) <= day) { j = k; break; } return j; };
const bar = (s, day) => { const a = D[s] || [], j = upto(a, day); return j < 0 ? null : (istDay(a[j].ts) === day ? a[j] : { open: a[j].close, high: a[j].close, low: a[j].close, close: a[j].close }); };   // o gün işlem yoksa düz

// --- 1) Her günün sinyalleri (bir kez; tüm senaryolar aynı sinyalleri kullanır) ---
console.log(`Sinyaller yeniden üretiliyor: ${days.length} işlem günü (${days[0]} → ${days.at(-1)})…`);
async function buildDays(opts) {
const DAY = {};
for (const day of days) {
  const io = { opts,
    fetchDaily: async s => { const a = D[s] || [], j = upto(a, day); return j < 0 ? [] : a.slice(0, j + 1); },
    fetchWeekly: async s => { const a = D[s] || [], j = upto(a, day); return j < 0 ? [] : weeklyAsOf(W[s] || [], a, j); },
  };
  const sig = await scanAll(io);
  const ir = IDX.slice(0, upto(IDX, day) + 1), xuNow = ir.at(-1)?.close ?? null;
  const mc = marketContext(sig, ir, xuNow);
  DAY[day] = { signals: mc.signals, mc, xuNow, nAL: sig.filter(s => s.signal === "AL").length, nSAT: sig.filter(s => s.signal === "SAT").length };
}
// genişlik patlaması: AL oranı ≤%10'dan 10 gün içinde ≥%40'a → 20 gün düşüş rejimini kaldır (DENEY)
let on = -1; days.forEach((d, i) => { const b = DAY[d].mc.breadth; if (b >= 0.4 && days.slice(Math.max(0, i - 10), i).some(x => DAY[x].mc.breadth <= 0.1)) on = i; DAY[d].thrust = on >= 0 && i - on < 20; });
return DAY;
}
const DAY = await buildDays({}), DAYT = SCEN_NEED_TOBO() ? await buildDays({ tobo: true }) : null;
function SCEN_NEED_TOBO() { return true; }
const L = DAY[days.at(-1)];
console.log(`Doğrulama (son gün ${days.at(-1)}): ${L.nAL + L.nSAT} sinyal (${L.nAL} AL, ${L.nSAT} SAT) · XU100 ${L.xuNow} vs MA200 ${L.mc.xuMA200?.toFixed(0)} · genişlik %${Math.round(L.mc.breadth * 100)} · risk ölçeği ${L.mc.volScale} — canlı taramayla aynı olmalı`);

// --- 2) Senaryolar ---
const SCEN = [
  ["B", "BUGÜNKÜ KOD (taban)", true, {}],
  ["F", "düşüş rejiminde HİÇ alım yok", true, { bearMode: "none" }],
  ["G", "düşüş rejiminde yalnız LİDER (RS≥5, MA50 üstü)", true, { bearMode: "leader" }],
  ["H", "başarısız kırılım çıkışı (3 gün içinde girişin %1 altı)", true, { failExit: true }],
  ["I", "zayıflama çıkışı (MA20 altı + hacim + RS<−5)", true, { weakExit: true }],
  ["J", "TOBO kurulumu eklendi", true, {}, "tobo"],
  ["K", "genişlik patlaması → savunmadan erken çıkış", true, {}, "thrust"],
];
const pathPrice = (b, k, N) => {
  if (N === 1) return b.close;
  const [x1, x2] = (b.close < b.open) !== REV ? [b.high, b.low] : [b.low, b.high], seg = [[b.open, x1], [x1, x2], [x2, b.close]];
  if (k === 0) return b.open;
  const si = Math.floor((k - 1) / STEPS), f = ((k - 1) % STEPS + 1) / STEPS, [p, q] = seg[si];
  return +(p + (q - p) * f).toFixed(4);
};
// elde tutulan (sinyalsiz) hisse için zayıflama çıkışının girdileri: MA20, hacim oranı, RS
function held(s, day, mc) {
  const a = D[s] || [], j = upto(a, day); if (j < 60) return {};
  const c = a.slice(j - 19, j + 1), ma20 = c.reduce((x, b) => x + b.close, 0) / 20, v20 = c.reduce((x, b) => x + (b.volume || 0), 0) / 20;
  const ret60 = (a[j].close - a[j - 59].close) / a[j - 59].close * 100;
  return { ma20, volR: v20 > 0 ? (a[j].volume || 0) / v20 : 0, rs: ret60 - mc.idxRet60 };
}
const realFetch = globalThis.fetch; let leaks = 0;
async function simulate(cfg, intraday, mode) {
  const DD = mode === "tobo" ? DAYT : DAY;
  globalThis.fetch = async u => { leaks++; throw new Error("simülasyonda ağ KAPALI: " + u); };   // ikinci güvenlik katmanı
  const log = console.log; console.log = (...a) => { if (!String(a[0]).startsWith("[TG]")) log(...a); };
  let st = { cash: START, start: START, pos: {}, trades: [], dayKey: null, dayStart: START, startDate: days[0], xuStart: null, equityLog: [], lastReportHour: -1, hourOpens: [], hourCloses: [], tgOffset: 0 };
  const N = intraday ? 1 + 3 * STEPS : 1, bearDays = { n: 0 };
  try {
    for (const day of days) {
      const { signals, mc, xuNow, thrust } = DD[day];
      const bear = mc.bearRegime && !(mode === "thrust" && thrust);
      if (bear) bearDays.n++;
      for (let k = 0; k < N; k++) {
        const last = k === N - 1;
        const sigs = last ? signals.map(s => ({ ...s })) : [];
        for (const s of Object.keys(st.pos)) if (!sigs.some(x => x.sym === s)) { const b = bar(s, day); if (b) sigs.push({ sym: s, signal: "NÖTR", confidence: 0, price: pathPrice(b, k, N), ...(last ? held(s, day, mc) : {}) }); }
        st = await runPaper(sigs, xuNow, bear, { state: st, forceTrading: true, today: day, cfg, isClose: last }, { breadth: mc.breadth, volScale: mc.volScale });
      }
      st.hourOpens = []; st.hourCloses = [];
    }
  } finally { globalThis.fetch = realFetch; console.log = log; }
  const lastDay = days.at(-1), eq = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * (bar(s, lastDay)?.close || p.last || p.entry), 0);
  return { st, eq, bearDays: bearDays.n };
}

const xu0 = DAY[days[0]].xuNow, xu1 = L.xuNow, fmt = n => Math.round(n).toLocaleString("tr-TR");
const res = [];
for (const [id, label, intraday, cfg, mode] of SCEN) res.push({ id, label, ...(await simulate(cfg, intraday, mode)) });
console.log(`\nSONUÇ${REV ? " (TERS gün içi yol)" : ""} — ${days[0]} → ${days.at(-1)} (${days.length} işlem günü · ${res[0].bearDays} gün düşüş rejimi) · başlangıç ${fmt(START)}₺ · aynı dönem XU100 %${((xu1 - xu0) / xu0 * 100).toFixed(1)}`);
console.log("Sen. | Son değer   | Getiri  | Max DD | İşlem | İsabet | PF   | Beklenti/işlem | Açık poz");
for (const r of res) {
  const p = perfStats(r.st);
  console.log(`  ${r.id}  | ${fmt(r.eq).padStart(10)}₺ | ${((r.eq / START - 1) * 100).toFixed(2).padStart(6)}% | %${p.maxDD.toFixed(1).padStart(4)} | ${String(p.n).padStart(5)} | %${p.winR.toFixed(0).padStart(4)}  | ${(isFinite(p.pf) ? p.pf.toFixed(2) : "∞").padStart(4)} | ${(Math.round(p.expc) + "₺").padStart(14)} | ${Object.keys(r.st.pos).length}`);
}
for (const r of res) console.log(`  ${r.id}: ${r.label}`);
console.log("\nÇıkış sebebine göre (adet · toplam K/Z):");
for (const r of res) {
  const by = {}; for (const t of r.st.trades) { const k = t.reason; (by[k] = by[k] || { n: 0, pnl: 0 }); by[k].n++; by[k].pnl += t.pnl; }
  console.log(`  ${r.id}: ` + Object.entries(by).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `${k} ${v.n} (${v.pnl >= 0 ? "+" : ""}${fmt(v.pnl)}₺)`).join(" · "));
}
console.log("\nKuruluma göre (kazanan/adet · K/Z):");
for (const r of res) {
  const by = {}; for (const t of r.st.trades) { const k = t.setup; (by[k] = by[k] || { n: 0, w: 0, pnl: 0 }); by[k].n++; if (t.pnl > 0) by[k].w++; by[k].pnl += t.pnl; }
  console.log(`  ${r.id}: ` + Object.entries(by).map(([k, v]) => `${k} ${v.w}/${v.n} (${v.pnl >= 0 ? "+" : ""}${fmt(v.pnl)}₺)`).join(" · "));
}
console.log(`\nAğ sızıntısı (simülasyon sırasında dış istek): ${leaks} ${leaks ? "✗" : "✓"}`);
process.exit(leaks ? 1 : 0);
