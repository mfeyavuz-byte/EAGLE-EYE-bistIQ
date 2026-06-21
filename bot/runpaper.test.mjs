// runPaper ENTEGRASYON TESTİ — ağsız, mock state + sentetik sinyallerle tüm zinciri yürütür.
// Çalıştır: node bot/runpaper.test.mjs   (env token YOK → gistPut/sendTG no-op, currentPrice scanMap'ten okur)
import { runPaper } from "./run.mjs";

let fail = 0;
const ok = (c, m) => { if (c) console.log("  ✓ " + m); else { console.log("  ✗ " + m); fail++; } };
const today = new Date().toISOString().slice(0, 10);
const old = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
const sig = (sym, signal, price, x = {}) => ({ sym, signal, price, confidence: 75, target1: x.tp ?? null, stopLoss: x.sl ?? null, dip: x.dip ?? 0, htf: x.htf ?? "YUKARI", rs: x.rs ?? 3, rr: x.rr ?? 2, atr: x.atr ?? null, avgVol: x.avgVol ?? 1e6, secStrong: false });

// ---------- SENARYO 1: normal rejim — kapama + zaman-stopu + pyramiding + açma ----------
console.log("SENARYO 1 (normal rejim):");
{
  const state = {
    cash: 200000, start: 500000, pos: {
      WINR:  { lot: 100, entry: 100, sl: 95, tp: 120, peak: 0, atr: 2, date: today, setup: "trend" },  // +%12 → pyramid
      STOPX: { lot: 50,  entry: 80,  sl: 78, tp: 90,  peak: 0, atr: 1, date: today, setup: "dip" },     // ≤ sl → SL
      DEADX: { lot: 100, entry: 50,  sl: 45, tp: 60,  peak: 0, atr: 1, date: old,   setup: "trend" },   // 30g yatay → ZAMAN
    }, trades: [], dayKey: today, dayStart: 218000, startDate: today, xuStart: 14000, equityLog: [],  // dayStart≈equity (drawdown kesici tetiklenmesin)
  };
  const signals = [
    sig("WINR", "AL", 112, { sl: 95, tp: 120, atr: 2 }),   // kazanan + AL → pyramid
    sig("STOPX", "NÖTR", 77),                               // stop'un altı → SL
    sig("DEADX", "NÖTR", 50.2),                             // yatay → zaman-stopu
    sig("NEWA", "AL", 50, { sl: 48, tp: 56, atr: 1, rr: 2 }),
    sig("NEWB", "AL", 20, { sl: 19, tp: 22, atr: 0.5, rr: 2 }),
  ];
  const st = await runPaper(signals, 14000, false, { state, forceTrading: true });
  ok(st && st.pos, "runPaper çöküşsüz döndü");
  ok(!st.pos.STOPX, "STOPX kapandı (SL)");
  ok(st.trades.some(t => t.sym === "STOPX" && t.reason === "SL"), "STOPX trade reason=SL");
  ok(!st.pos.DEADX, "DEADX kapandı (zaman stopu)");
  ok(st.trades.some(t => t.sym === "DEADX" && t.reason === "ZAMAN"), "DEADX trade reason=ZAMAN");
  ok(st.pos.WINR && st.pos.WINR.pyr === true, "WINR pyramid yapıldı (pyr=true)");
  ok(st.pos.WINR && st.pos.WINR.lot > 100, "WINR lot arttı (" + st.pos.WINR?.lot + ")");
  ok(st.pos.WINR && st.pos.WINR.entry > 100 && st.pos.WINR.entry < 112, "WINR ağırlıklı ortalama giriş (" + st.pos.WINR?.entry + ")");
  ok(st.pos.NEWA && st.pos.NEWA.lot > 0 && st.pos.NEWA.sl < st.pos.NEWA.entry, "NEWA açıldı, stop<giriş");
  ok(st.pos.NEWA && st.pos.NEWA.atr === 1, "NEWA pozda atr saklandı (chandelier için)");
  ok(st.pos.NEWB && st.pos.NEWB.lot > 0, "NEWB açıldı");
  ok(st.equityLog.length === 1 && st.equityLog[0].d === today, "equity log gün için 1 nokta");
  ok(st.cash >= 0, "nakit negatife düşmedi (" + Math.round(st.cash) + ")");
  // risk paritesi: NEWA riski ≈ equity*%1 (slDist=2 → lot*2 ≈ %1)
  const eqApprox = 220000, riskTL = (st.pos.NEWA?.lot || 0) * 2;
  ok(Math.abs(riskTL / eqApprox - 0.01) < 0.004, "NEWA risk ~%1 (risk paritesi) → %" + (riskTL / eqApprox * 100).toFixed(2));
}

// ---------- SENARYO 2: düşüş rejimi — sadece dip açılır, momentum elenir ----------
console.log("SENARYO 2 (düşüş rejimi):");
{
  const state = { cash: 500000, start: 500000, pos: {}, trades: [], dayKey: today, dayStart: 500000, startDate: today, xuStart: 14000, equityLog: [] };
  const signals = [
    sig("DIPC", "AL", 30, { sl: 28, tp: 36, atr: 1, dip: 3 }),   // dip → açılmalı
    sig("TRNC", "AL", 40, { sl: 38, tp: 48, atr: 1, dip: 0 }),   // momentum → elenmeli
  ];
  const st = await runPaper(signals, 14000, true, { state, forceTrading: true });
  ok(st.pos.DIPC, "düşüş rejiminde DİP açıldı");
  ok(!st.pos.TRNC, "düşüş rejiminde momentum (dip değil) ELENDİ");
}

// ---------- SENARYO 3: kurulum öğrenme — net-zararlı kurulum açılmaz ----------
console.log("SENARYO 3 (öğrenme: zararlı kurulum durdurulur):");
{
  const trades = Array.from({ length: 11 }, () => ({ setup: "counter", pnl: -100, sym: "X" }));
  const state = { cash: 500000, start: 500000, pos: {}, trades, dayKey: today, dayStart: 500000, startDate: today, xuStart: 14000, equityLog: [] };
  const signals = [ sig("CNT", "AL", 25, { sl: 24, tp: 28, atr: 0.5, dip: 0, htf: "ASAGI" }) ];  // setup=counter (dip yok, htf≠YUKARI)
  const st = await runPaper(signals, 14000, false, { state, forceTrading: true });
  ok(!st.pos.CNT, "≥10 işlemde net-zararlı 'counter' kurulumu AÇILMADI");
}

console.log(fail ? `\n❌ ${fail} ASSERT BAŞARISIZ` : "\n✅ TÜM ENTEGRASYON TESTLERİ GEÇTİ");
process.exit(fail ? 1 : 0);
