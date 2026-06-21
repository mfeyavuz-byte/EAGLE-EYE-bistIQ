#!/usr/bin/env node
// EAGLE EYE — Otonom motor botu (bulutta, cihaz gerekmez)
// 1) 197 BIST hissesini UYGULAMANIN KENDİ MOTORUYLA tarar (getSignals) -> AL/SAT -> Telegram
// 2) AI TRADER sanal portföyünü yönetir (aç/kapat, TP/SL/trailing) -> Telegram
// State Gist'te (feybot_paper.json). Bağımlılıksız (Node 20+ ESM).

import { getSignals, enrichData, getHigherTrend } from "./engine.mjs";
import { fetchDaily, fetchWeekly, fetchIndexClose } from "./data.mjs";
import { mcpCall } from "./mcp.mjs";
import { fetchNews } from "./news.mjs";
import syms from "./symbols.json" with { type: "json" };
import SECTORS from "./sectors.json" with { type: "json" };
import { analyzeNewsImpact } from "./news-impact.mjs";
import { pathToFileURL } from "node:url";

const TG_TOKEN = process.env.TG_TOKEN || "";
const TG_CHAT  = process.env.TG_CHAT  || "";
const GIST_TOKEN = process.env.GH_GIST_TOKEN || "";
const GIST_ID    = process.env.GIST_ID || "";
const PAPER_FILE = "feybot_paper.json";
const START = +(process.env.START_CASH || 500000);   // başlangıç sermayesi (varsayılan 500.000₺)
const MIN_CONF = +(process.env.MIN_CONF || 65);       // sinyal kalite barı (güven); 50→65
const MIN_ADX = +(process.env.MIN_ADX || 20);         // trend gücü barı (ADX); trendsiz=gürültü
const SENT_FILE  = "eagle_sent.json";
const CONC = +(process.env.CONC || 8);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtTime = () => new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
const sectorOf = sym => Object.entries(SECTORS).find(([, ss]) => ss.includes(sym))?.[0];
// BIST seansı: hafta içi 09:55–18:05 İstanbul. Dışındaysa YENİ pozisyon açılmaz.
function isTradingHours() {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const wd = p.find(x => x.type === "weekday").value;            // Mon..Sun
  if (wd === "Sat" || wd === "Sun") return false;
  const mins = (+p.find(x => x.type === "hour").value) * 60 + (+p.find(x => x.type === "minute").value);
  return mins >= 595 && mins <= 1085;                            // 09:55 .. 18:05
}

// ---------- Telegram ----------
async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT) { console.log("[TG] yapılandırılmamış"); return false; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, disable_web_page_preview: true }),
    });
    if (!r.ok) console.error("[TG] hata", r.status, (await r.text().catch(() => "")).slice(0, 120));
    return r.ok;
  } catch (e) { console.error("[TG]", e.message); return false; }
}

// ---------- Gist state ----------
// Okuma BAŞARISIZ (rate-limit/5xx/ağ/parse) ile gerçekten BOŞ gist'i ayırt et:
// başarısızlıkta "bilinmiyor" döndür → çağıran ASLA sıfırlamaz/yazmaz (eski bug: tek hata portföyü siliyordu).
const READ_FAILED = Symbol("gist_read_failed");
async function gistGet(file, fallback) {
  if (!GIST_TOKEN || !GIST_ID) return fallback;
  try {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: "Bearer " + GIST_TOKEN, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) return READ_FAILED;                 // geçici hata (rate-limit/5xx) — boş SAYMA
    const g = await r.json();
    const c = g.files?.[file]?.content;
    return c ? JSON.parse(c) : fallback;           // gist var, dosya yok = gerçekten ilk kez
  } catch { return READ_FAILED; }                  // ağ/parse hatası — durum bilinmiyor
}
async function gistPut(files) {
  if (!GIST_TOKEN || !GIST_ID) return;
  try {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + GIST_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
  } catch (e) { console.error("[Gist] kaydedilemedi:", e.message); }
}

// ---------- Tarama (motor) ----------
async function scanOne(sym) {
  // SİNYAL = GÜNLÜK mum (çok-günlük pozisyon için doğru tf; MA50/MA200/ADX geçerli).
  const daily = await fetchDaily(sym);
  if (daily.length < 60) return null;                                  // yeterli geçmiş yoksa atla
  const ed = enrichData(daily);
  const last = ed[ed.length - 1];
  if (!last) return null;
  const _ago = daily[Math.max(0, daily.length - 60)]; const ret60 = _ago ? (last.close - _ago.close) / _ago.close * 100 : 0;
  // Likidite: günlük ortalama işlem hacmi (son 20 gün) × fiyat < 5M TL ise ele
  const avgVol = daily.slice(-20).reduce((a, b) => a + (b.volume || 0), 0) / Math.min(20, daily.length);
  if (avgVol * last.close < 5e6) return null;
  const weekly = await fetchWeekly(sym);                               // ÜST TREND = haftalık
  const k = getSignals(ed, getHigherTrend(weekly), weekly);
  if (!k || k.final === "NÖTR") return null;
  // KALİTE FİLTRESİ — daha isabetli, daha az gürültü. DİP DÖNÜŞLER muaf (karşı-trend doğrulanmış giriş).
  const isDip = !!k.dipSignal;
  if (k.confidence < MIN_CONF) return null;                                 // zayıf sinyalleri ele (varsayılan 65)
  if (!isDip && (k.adx || 0) < MIN_ADX) return null;                        // trendsiz/choppy gürültü (dip hariç)
  if (!isDip && (k.htfNote || "").includes("⚠")) return null;               // üst zaman dilimi çelişkili (dip hariç)
  if (!isDip && k.final === "AL" && k.higherTrend === "ASAGI") return null; // düşen trende momentum-AL yok (dip hariç)
  if (k.final === "SAT" && k.higherTrend === "YUKARI") return null;         // yükselen trende karşı SATMA
  if (!isDip && k.final === "AL" && (last.volume || 0) < avgVol * 0.7) return null; // hacim kuruması = teyitsiz AL
  if (!isDip && k.final === "AL" && (last.rsi || 0) >= 63) return null; // aşırı-alımda/geç girişi ele (backtest: erken giriş %42 vs geç %34)
  return { sym, signal: k.final, confidence: k.confidence, price: last.close, dip: isDip ? (k.dipSignal.score || 0) : 0, atr: (last.atr && last.atr > 0) ? last.atr : null, avgVol: Math.round(avgVol),
           stopLoss: k.stopLoss, target1: k.target1, mod: k.mod, adx: Math.round(k.adx || 0), htf: k.higherTrend, ret60: +ret60.toFixed(1), rr: (k.target1 && k.stopLoss && last.close > k.stopLoss) ? +((k.target1 - last.close) / (last.close - k.stopLoss)).toFixed(2) : 0 };
}
async function scanAll() {
  const out = [];
  for (let i = 0; i < syms.length; i += CONC) {
    const r = await Promise.all(syms.slice(i, i + CONC).map(s => scanOne(s).catch(() => null)));
    r.forEach(x => x && out.push(x));
  }
  out.sort((a, b) => a.signal !== b.signal ? (a.signal === "AL" ? -1 : 1) : b.confidence - a.confidence);
  return out;
}

// ---------- Kurulum (setup) etiketi + performans öğrenme ----------
// Her AL adayını kurulum tipine etiketle; kapanan işlemlerden tip-bazlı beklenti ölç.
function setupOf(s) { return s.dip ? "dip" : (s.htf === "YUKARI" ? "trend" : "counter"); }
function setupStats(trades) {
  const m = {};
  for (const t of trades || []) { const k = t.setup || "?"; (m[k] = m[k] || { n: 0, w: 0, pnl: 0 }); m[k].n++; if ((t.pnl || 0) > 0) m[k].w++; m[k].pnl += (t.pnl || 0); }
  return m;
}
// ≥10 kapanan işlemde net zararda olan kurulumları otomatik durdur (ampirik budama)
function disabledSetups(trades) {
  const out = new Set();
  for (const [k, v] of Object.entries(setupStats(trades))) if (v.n >= 10 && v.pnl < 0) out.add(k);
  return out;
}

// PORTFÖY YÖNETİCİSİ (anahtarsız, kural-tabanlı): kurulumun GERÇEK beklentisine göre risk çarpanı
function riskMult(setup, st) {
  const s = setupStats(st.trades)[setup];
  if (!s || s.n < 5) return 1;            // yeterli kanıt yok → nötr
  const exp = s.pnl / s.n;                // işlem başına beklenti (₺)
  return exp > 0 ? 1.3 : exp < 0 ? 0.6 : 1;
}

// MCP olay/analist/temel katmanı (sunucu-tarafı; yalnız en güçlü adaylar — hız + fail-safe).
// Sinyalleri yerinde zenginleştirir: s.blackout (kazanç yakın), s.weakFund (zararda), s.analyst + güven tilt'i.
async function mcpEnrich(cands) {
  const now = Date.now();
  for (const s of cands) {
    const [ear, an, fr] = await Promise.all([
      mcpCall("get_earnings", { symbol: s.sym, market: "bist" }),
      mcpCall("get_analyst_data", { symbol: s.sym, market: "bist" }),
      mcpCall("get_financial_ratios", { symbol: s.sym, market: "bist" }),
    ]);
    if (ear?.next_earnings_date) {                                  // kazanç kara listesi: ≤3 gün → gap riski, açma
      const days = Math.round((Date.parse(ear.next_earnings_date) - now) / 864e5);
      if (days >= 0 && days <= 3) { s.blackout = true; s.mcpNote = `bilanço ${days}g`; }
    }
    const cons = an?.summary?.consensus || "", up = an?.upside_potential;   // analist teyidi → güven tilt'i
    if (/strong buy/i.test(cons)) s.confidence = Math.min(99, s.confidence + 8);
    else if (/buy/i.test(cons)) s.confidence = Math.min(99, s.confidence + 4);
    else if (/sell/i.test(cons)) s.confidence = Math.max(0, s.confidence - 6);
    if (cons) s.analyst = cons + (typeof up === "number" ? ` ${up.toFixed(0)}%` : "");
    const pe = fr?.valuation?.pe_ratio;                             // temel kapısı: zarar eden şirket (PE≤0) → ele
    if (typeof pe === "number" && pe <= 0) { s.weakFund = true; s.mcpNote = (s.mcpNote ? s.mcpNote + " · " : "") + "zararda(PE<0)"; }
  }
}

// ---------- Performans analitiği (beklenti / drawdown / Sharpe) ----------
function perfStats(st) {
  const cl = st.trades || [], n = cl.length;
  const wins = cl.filter(t => (t.pnl || 0) > 0), losses = cl.filter(t => (t.pnl || 0) <= 0);
  const sum = a => a.reduce((x, t) => x + (t.pnl || 0), 0);
  const winR = n ? wins.length / n * 100 : 0;
  const avgW = wins.length ? sum(wins) / wins.length : 0, avgL = losses.length ? sum(losses) / losses.length : 0;
  const expc = n ? sum(cl) / n : 0;                                       // işlem başına beklenti (₺)
  const lossSum = Math.abs(sum(losses));
  const pf = lossSum > 0 ? sum(wins) / lossSum : (sum(wins) > 0 ? Infinity : 0);
  const eq = (st.equityLog || []).map(e => e.eq);
  let peak = -Infinity, maxDD = 0;
  for (const v of eq) { if (v > peak) peak = v; const dd = peak > 0 ? (peak - v) / peak * 100 : 0; if (dd > maxDD) maxDD = dd; }
  const rets = []; for (let i = 1; i < eq.length; i++) if (eq[i - 1] > 0) rets.push((eq[i] - eq[i - 1]) / eq[i - 1]);
  const mean = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const sd = rets.length ? Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length) : 0;
  const sharpe = sd > 0 ? mean / sd * Math.sqrt(252) : 0;                 // yıllıklandırılmış (basit)
  return { n, winR, avgW, avgL, expc, pf, maxDD, sharpe };
}
function perfReport(st) {
  const p = perfStats(st);
  let m = `📊 PERFORMANS\n${fmtTime()}\n`;
  m += `\n📈 İşlem: ${p.n} · İsabet: %${p.winR.toFixed(0)}`;
  m += `\n💰 Beklenti/işlem: ${p.expc >= 0 ? "+" : ""}${Math.round(p.expc)}₺ · PF: ${isFinite(p.pf) ? p.pf.toFixed(2) : "∞"}`;
  m += `\n📊 Ort. kazanç: +${Math.round(p.avgW)}₺ · ort. kayıp: ${Math.round(p.avgL)}₺`;
  m += `\n📉 Max drawdown: %${p.maxDD.toFixed(1)} · Sharpe: ${p.sharpe.toFixed(2)}`;
  const ss = setupStats(st.trades);
  if (Object.keys(ss).length) m += "\n🧪 Kurulum: " + Object.entries(ss).map(([k, v]) => `${k} ${v.w}/${v.n} (${v.pnl >= 0 ? "+" : ""}${Math.round(v.pnl)}₺)`).join(" · ");
  return m;
}

// ---------- AI TRADER (paper trading) ----------
async function currentPrice(sym, scanMap) {
  if (scanMap[sym]) return scanMap[sym].price;
  const d = await fetchDaily(sym);                 // taramada yoksa güncel fiyat = son günlük kapanış
  return d.length ? d[d.length - 1].close : null;
}

async function runPaper(signals, xuNow, bearRegime = false, _test = null) {
  const today = new Date().toISOString().slice(0, 10);
  let st = _test && "state" in _test ? _test.state : await gistGet(PAPER_FILE, null);
  // KRİTİK: Gist okunamadıysa (geçici hata) state'i BİLMİYORUZ → bu run'ı ATLA, ASLA sıfırlama/yazma.
  if (st === READ_FAILED) {
    console.log("⚠ Gist okunamadı (geçici) — AI TRADER bu run atlandı, portföy KORUNDU (sıfırlama YOK).");
    return;
  }
  // Yalnız gist GERÇEKTEN boşsa (ilk kez) temiz başlat. VAR OLAN portföy ASLA silinmez (start değişse bile).
  const valid = st && typeof st.cash === "number" && st.pos && typeof st.pos === "object";
  if (!valid) {
    const keepOffset = (st && st.tgOffset) || 0;
    st = { cash: START, start: START, pos: {}, trades: [], dayKey: today, dayStart: START, startDate: today, xuStart: xuNow || null, lastReportHour: -1, hourOpens: [], hourCloses: [], tgOffset: keepOffset };
    await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
    console.log(`🆕 İlk kez: portföy ${START.toLocaleString("tr-TR")}₺ ile başlatıldı.`);
  }
  // Migrasyon: eksik alanları tamamla — pozisyonları ASLA silmeden.
  st.pos = st.pos || {}; st.trades = st.trades || [];
  if (typeof st.start !== "number") st.start = st.cash;
  if (!st.dayStart) st.dayStart = st.start;
  if (!st.dayKey) st.dayKey = today;
  if (!st.startDate) st.startDate = today;
  if (!st.xuStart && xuNow) st.xuStart = xuNow;   // endeks başlangıcı (relatif getiri için)
  const scanMap = Object.fromEntries(signals.map(s => [s.sym, s]));
  const satSet = new Set(signals.filter(s => s.signal === "SAT").map(s => s.sym));
  const opened = [], closed = [];
  const equity = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * ((scanMap[s]?.price) || p.entry), 0);

  // Pozisyon yönetiminin TAMAMI (alım + satım) sadece BIST seansında: hafta içi 09:55–18:05.
  // Açılış (09:55) dahil → gece verilen kararlar sabah açılışta uygulanır.
  const trading = _test && "forceTrading" in _test ? _test.forceTrading : isTradingHours();
  if (!trading) {
    console.log("⏰ Piyasa dışı — pozisyon yönetimi yok (ne alım ne satım).");
  } else {

  // --- KAPAMA: TP/SL/trailing + SAT sinyali ---
  for (const [sym, ps] of Object.entries({ ...st.pos })) {
    const cur = await currentPrice(sym, scanMap);
    if (cur == null || !isFinite(cur)) continue;
    ps.last = cur;   // güncel fiyatı pozisyona yaz (performans/valuation için)
    const pct = (cur - ps.entry) / ps.entry;
    if (pct >= 0.02) { const np = Math.max(ps.peak || 0, cur); if (np > (ps.peak || 0)) ps.peak = np; }
    // BREAKEVEN: +%2'de stop'u girişe çek (kârı koru, başabaşa kilitle)
    if (pct >= 0.02 && (!ps.sl || ps.sl < ps.entry)) ps.sl = ps.entry;
    const trailLv = ps.peak ? +((ps.atr && ps.atr > 0 ? ps.peak - 3 * ps.atr : ps.peak * 0.985)).toFixed(2) : null;  // ATR chandelier (yoksa %1.5)
    const daysHeld = ps.date ? Math.round((Date.parse(today) - Date.parse(ps.date)) / 864e5) : 0;
    // KISMİ KÂR: ilk hedefe ulaşınca yarısını sat (bir kez), kalanı trailing'e bırak
    if (!ps.partial && ps.tp && cur >= ps.tp && ps.lot >= 2) {
      const half = Math.floor(ps.lot / 2);
      const pnl = +((cur - ps.entry) * half).toFixed(0), pnlPct = +(pct * 100).toFixed(2);
      st.cash += half * cur;
      st.trades.unshift({ sym, entry: ps.entry, exit: cur, lot: half, pnl, pnlPct, open: ps.date, close: today, reason: "TP-yarı", setup: ps.setup || "?" });
      ps.lot -= half; ps.partial = true; ps.tp = +(cur * 1.05).toFixed(2);   // kalan için hedefi yukarı taşı
      closed.push(`💰 ${sym} YARI KÂR @ ${cur}₺ · +%${pnlPct} (${pnl >= 0 ? "+" : ""}${pnl}₺) · kalan ${ps.lot} lot trailing'de`);
      continue;
    }
    // TAM KAPAMA: stop(breakeven dahil) / trailing / SAT sinyali / (kısmi yapılmadıysa hedef)
    const hitSL = ps.sl && cur <= ps.sl, hitTS = !!trailLv && cur <= trailLv, hitSIG = satSet.has(sym);
    const hitTP = !ps.partial && ps.tp && cur >= ps.tp;
    const hitTIME = daysHeld >= 14 && Math.abs(pct) < 0.02;   // ÖLÜ PARA: 14 günde kıpırdamadı → sermayeyi boşalt
    if (hitSL || hitTS || hitSIG || hitTP || hitTIME) {
      const reason = hitSL ? (ps.sl === ps.entry ? "BE" : "SL") : hitTS ? "TS" : hitSIG ? "SIG" : hitTP ? "TP" : "ZAMAN";
      const label = { SL: "Zarar Durdur", BE: "Başabaş (kâr korundu)", TS: "Trailing Stop", SIG: "SAT sinyali", TP: "Hedef", ZAMAN: "Ölü para (zaman stopu)" }[reason];
      const pnl = +((cur - ps.entry) * ps.lot).toFixed(0), pnlPct = +(pct * 100).toFixed(2);
      st.cash += ps.lot * cur;
      st.trades.unshift({ sym, entry: ps.entry, exit: cur, lot: ps.lot, pnl, pnlPct, open: ps.date, close: today, reason, setup: ps.setup || "?" });
      delete st.pos[sym];
      closed.push(`${pct >= 0 ? "📈" : "📉"} ${sym} @ ${cur}₺ · ${label} · K/Z %${pnlPct} (${pnl >= 0 ? "+" : ""}${pnl}₺)`);
    }
    // PYRAMIDING: kazanan (+%4) + hâlâ AL sinyalli pozisyona BİR kez ekle (R:R edge'ini büyüt)
    if (st.pos[sym] && !ps.pyr && pct >= 0.04 && scanMap[sym]?.signal === "AL") {
      const pyrSl = (ps.atr && ps.atr > 0) ? 2 * ps.atr : cur * 0.03;
      let addQ = Math.floor(equity * 0.01 * (bearRegime ? 0.5 : 1) * 0.5 / pyrSl);   // yarım tranş, aynı risk paritesi
      if (addQ * cur > st.cash) addQ = Math.floor(st.cash / cur);
      if (addQ > 0) {
        const nl = ps.lot + addQ;
        ps.entry = +(((ps.entry * ps.lot) + (cur * addQ)) / nl).toFixed(2);   // ağırlıklı ortalama giriş
        ps.lot = nl; st.cash -= addQ * cur; ps.pyr = true;
        ps.sl = Math.max(ps.sl || 0, +(cur - pyrSl).toFixed(2));              // stop'u yukarı çek
        opened.push(`➕ ${sym} EKLEME ${addQ} lot @ ${cur}₺ (pyramid) · ort. giriş ${ps.entry}₺ · stop ${ps.sl}`);
      }
    }
  }

  // --- AÇMA: ATR-tabanlı risk + piyasa rejimi + kurulum öğrenme ---
  // Seçim: güven+potansiyel+R:R+RS+sektör+dip. Boyut: işlem başına SABİT %risk (lot = risk / ATR-stop mesafesi).
  const MAX_POS = bearRegime ? 2 : 5;                 // düşüş rejiminde daha az pozisyon
  const RISK_PCT = 0.01 * (bearRegime ? 0.5 : 1);     // equity'nin %1'i risk (bear'de %0.5)
  const MAXCOST = 0.30;                               // tek pozisyon en fazla portföyün %30'u
  const upside = s => (s.target1 && s.price) ? (s.target1 - s.price) / s.price * 100 : 0;
  const ddOK = !st.dayStart || (equity - st.dayStart) / st.dayStart > -0.03;
  const disabled = disabledSetups(st.trades);         // ampirik: net-zararlı kurulumları durdur
  let candidates = signals.filter(s => s.signal === "AL" && !st.pos[s.sym] && !disabled.has(setupOf(s)) && !s.blackout && !s.weakFund);
  if (bearRegime) candidates = candidates.filter(s => s.dip);   // düşüş rejiminde SADECE dip dönüşleri
  candidates = candidates
    .map(s => ({ ...s, _score: (s.confidence || 0) + upside(s) * 0.6 + (s.rr || 0) * 3 + (s.rs || 0) * 0.5 + (s.secStrong ? 5 : 0) + (s.dip ? s.dip * 2.5 : 0) }))   // güven+potansiyel+R:R+göreli güç+sektör+dip(backtest:en iyi kenar)
    .sort((a, b) => b._score - a._score);
  for (const sig of candidates) {
    if (Object.keys(st.pos).length >= MAX_POS || !ddOK) break;
    const sec = sectorOf(sig.sym);                                       // SEKTÖR LİMİTİ: aynı sektörde en fazla 2 poz
    if (sec && Object.keys(st.pos).filter(s => sectorOf(s) === sec).length >= 2) continue;
    const conf = sig.confidence || 0, j = sig.price, up = upside(sig);
    // ATR-tabanlı stop (2×ATR) + 2R hedef; ATR yoksa %3 stop'a düş (volatiliteye duyarlı).
    const slDist = (sig.atr && sig.atr > 0) ? +(2 * sig.atr).toFixed(2) : +(j * 0.03).toFixed(2);
    const sl = +(j - slDist).toFixed(2), tp = +(j + 2 * slDist).toFixed(2);
    // RİSK PARİTESİ: her işlem equity'nin sabit %'sini riske atar → lot = risk / stop-mesafesi
    const setup = setupOf(sig);
    const rm = riskMult(setup, st);                                       // PORTFÖY YÖNETİCİSİ: beklentisi yüksek kuruluma çok, zayıfa az risk
    let Q = slDist > 0 ? Math.floor(equity * RISK_PCT * rm / slDist) : 0;
    if (Q * j > equity * MAXCOST) Q = Math.floor(equity * MAXCOST / j);   // tek-pozisyon tavanı
    if (Q * j > st.cash) Q = Math.floor(st.cash / j);                     // nakit sınırı
    if (sig.avgVol && Q > sig.avgVol * 0.05) Q = Math.floor(sig.avgVol * 0.05);  // LİKİDİTE: günlük hacmin en fazla %5'i
    if (Q > 0 && sl < j) {
      st.cash -= Q * j;
      st.pos[sig.sym] = { lot: Q, entry: j, date: today, sl, tp, peak: 0, setup, atr: (sig.atr && sig.atr > 0) ? sig.atr : null };
      const costPct = Math.round(Q * j / equity * 100);
      const why = `setup ${setup}(×${rm})${sig.analyst ? " · analist " + sig.analyst : ""}${sig.rs != null ? " · RS " + sig.rs : ""} · R:R ${sig.rr || "?"}`;
      opened.push(`📈 ${sig.sym} · ${Q} lot @ ${j}₺ (%${costPct} · ${setup}) · güven %${conf} · pot %${up.toFixed(1)} · stop ${sl} · hedef ${tp}\n   ↳ ${why}`);
    }
  }
  } // seans (trading) bloğu sonu

  const newDay = st.dayKey !== today;
  if (newDay) st.dayStart = equity;        // yeni gün: günlük drawdown referansını sıfırla
  st.dayKey = today;
  // Günlük equity logu (performans/analitik) — gün başına 1 nokta
  const eqEnd = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * ((scanMap[s]?.price) || p.last || p.entry), 0);
  st.equityLog = st.equityLog || [];
  if (!st.equityLog.length || st.equityLog[st.equityLog.length - 1].d !== today) st.equityLog.push({ d: today, eq: Math.round(eqEnd) });
  else st.equityLog[st.equityLog.length - 1].eq = Math.round(eqEnd);
  st.equityLog = st.equityLog.slice(-260);
  st.trades = st.trades.slice(0, 300);
  // YENİ POZİSYON açıldıysa saatlik raporu BEKLEMEDEN hemen bildir (kapanış + saatlik özet aynen devam)
  if (opened.length) { try { await sendTG(`🆕 AI TRADER — yeni işlem · ${fmtTime()}\n` + opened.join("\n")); } catch {} }
  // Aç/kapat'ları saatlik özete de biriktir (saat başı rapor olduğu gibi sürer)
  st.hourOpens = (st.hourOpens || []).concat(opened);
  st.hourCloses = (st.hourCloses || []).concat(closed);
  await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
  return st;
}

// ---------- Telegram komutları (/durum /pozisyonlar) ----------
function buildStatus(st) {
  const priceOf = p => p.last || p.entry;
  const eq = st.cash + Object.entries(st.pos).reduce((a, [, p]) => a + p.lot * priceOf(p), 0);
  const portRet = (eq - st.start) / st.start * 100;
  const lines = Object.entries(st.pos).map(([s, p]) => {
    const cur = priceOf(p), pr = (cur - p.entry) / p.entry * 100;
    return `• ${s} ${p.lot} lot · ${p.entry}₺→${cur}₺ · K/Z ${pr >= 0 ? "+" : ""}${pr.toFixed(1)}%`;
  });
  let m = `📊 AI TRADER — DURUM (anlık)\n${fmtTime()}\n`;
  m += `\n💼 Değer: ${Math.round(eq).toLocaleString("tr-TR")}₺ · Nakit: ${Math.round(st.cash).toLocaleString("tr-TR")}₺`;
  m += `\n📈 Toplam getiri: ${portRet >= 0 ? "+" : ""}${portRet.toFixed(2)}%`;
  m += `\n\n📌 Açık pozisyonlar (${lines.length}/5):\n` + (lines.join("\n") || "yok");
  return m;
}
async function handleCommands(st) {
  if (!TG_TOKEN || !TG_CHAT || !st) return;
  let updates = [];
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${st.tgOffset || 0}&timeout=0`);
    const j = await r.json();
    updates = j.result || [];
  } catch { return; }
  if (!updates.length) return;
  let off = st.tgOffset || 0, replied = 0;
  for (const u of updates) {
    off = u.update_id + 1;
    const txt = (u.message?.text || "").trim().toLowerCase().split("@")[0];
    if (String(u.message?.chat?.id) !== String(TG_CHAT)) continue;
    if (txt === "/durum" || txt === "/pozisyonlar" || txt === "/start") {
      await sendTG(buildStatus(st)); replied++; await sleep(300);
    } else if (txt === "/performans" || txt === "/perf") {
      await sendTG(perfReport(st)); replied++; await sleep(300);
    }
  }
  st.tgOffset = off;
  await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
  if (replied) console.log(`${replied} Telegram komutu yanıtlandı.`);
}

// ---------- Ana ----------
async function main() {
  const t0 = Date.now();
  console.log("Tarama başlıyor:", syms.length, "sembol");
  let signals = await scanAll();
  console.log(`Tarama bitti ${((Date.now() - t0) / 1e3).toFixed(1)}s · ${signals.length} sinyal (${signals.filter(s => s.signal === "AL").length} AL, ${signals.filter(s => s.signal === "SAT").length} SAT)`);

  const xuNow = await fetchIndexClose("XU100").catch(() => null);  // endeks (XU100) anlık

  // ---------- GÖRELİ GÜÇ (RS vs XU100) + SEKTÖR LİDERLİĞİ ----------
  const idxRows = await fetchDaily("XU100").catch(() => []);
  const idxRet60 = idxRows.length >= 60 ? (idxRows[idxRows.length - 1].close - idxRows[idxRows.length - 60].close) / idxRows[idxRows.length - 60].close * 100 : 0;
  // PİYASA REJİMİ: XU100 kendi MA200'ünün altındaysa düşüş rejimi → savunma (az poz · sadece dip · yarı risk)
  const _xc = idxRows.map(r => r.close);
  const xuMA200 = _xc.length >= 200 ? _xc.slice(-200).reduce((a, b) => a + b, 0) / 200 : null;
  const bearRegime = !!(xuMA200 && xuNow && xuNow < xuMA200);
  console.log(`Rejim: XU100 ${xuNow ?? "?"} vs MA200 ${xuMA200 ? xuMA200.toFixed(0) : "?"} → ${bearRegime ? "DÜŞÜŞ (savunma)" : "NORMAL"}`);
  for (const s of signals) s.rs = +((s.ret60 || 0) - idxRet60).toFixed(1);   // endekse göre fazla getiri
  const _rsCut = signals.length;
  signals = signals.filter(s => s.signal !== "AL" || s.dip || s.rs > -3);     // endeksten belirgin zayıf AL'ı ele (dip hariç)
  // Sektör gücü: ortalama RS'in medyan üstündeki sektörler "güçlü"
  const secRS = {}, secN = {};
  for (const s of signals) { const sec = sectorOf(s.sym); if (sec) { secRS[sec] = (secRS[sec] || 0) + s.rs; secN[sec] = (secN[sec] || 0) + 1; } }
  const secAvg = Object.fromEntries(Object.keys(secRS).map(k => [k, secRS[k] / secN[k]]));
  const _sv = Object.values(secAvg).sort((a, b) => b - a); const _med = _sv.length ? _sv[Math.floor(_sv.length / 2)] : 0;
  for (const s of signals) { const sec = sectorOf(s.sym); s.secStrong = !!(sec && secAvg[sec] != null && secAvg[sec] >= _med); }
  console.log(`Göreli güç: XU100 60g %${idxRet60.toFixed(1)} · zayıf-RS elenen AL: ${_rsCut - signals.length}`);

  // ---------- HABER-DUYARLI SİNYAL: haberin etkisine göre güveni ayarla ----------
  let news = [];
  try { news = await fetchNews(); } catch (e) { console.error("Haber çekme:", e.message); }
  const newsScores = {};   // sembol -> toplam haber etki skoru
  for (const it of news) {
    try {
      const r = analyzeNewsImpact(it.title || "", it.desc || "");
      for (const [sym, sc] of (r.affected || [])) newsScores[sym] = (newsScores[sym] || 0) + sc;
    } catch {}
  }
  let adjusted = 0;
  for (const s of signals) {
    const ns = newsScores[s.sym] || 0;
    if (!ns) continue;
    const adj = Math.max(-15, Math.min(15, Math.round(ns * 8)));   // ±15 puan tavan
    // Pozitif haber AL'a +, SAT'a − (haber satışı çürütür); negatif tersi
    s.confidence = Math.max(0, Math.min(99, s.confidence + (s.signal === "AL" ? adj : -adj)));
    s.news = (ns > 0 ? "📰+" : "📰") + ns.toFixed(1);
    adjusted++;
  }
  if (adjusted) {
    // haber ayarından sonra güce göre yeniden sırala
    signals.sort((a, b) => a.signal !== b.signal ? (a.signal === "AL" ? -1 : 1) : b.confidence - a.confidence);
    console.log(`Haber-duyarlı: ${adjusted} sinyal ayarlandı (${news.length} başlık)`);
  }

  // Haberleri Gist'e yaz (app proxy başarısız olursa oradan okur)
  if (GIST_ID && GIST_TOKEN && news.length) {
    try {
      await gistPut({ "eagle_news.json": { content: JSON.stringify({ ts: Date.now(), items: news }) } });
      console.log(`Haber: ${news.length} başlık Gist'e yazıldı`);
    } catch (e) { console.error("Haber Gist:", e.message); }
  }

  // Her run: tara + pozisyon yönet (sessiz, state'e biriktir). Mesaj saat başı gider.
  let st = null;
  if (GIST_ID && GIST_TOKEN) {
    // MCP olay/analist/temel katmanı — yalnız en güçlü 6 AL adayı (hız + fail-safe; bot sunucu-tarafı, CORS yok)
    if (isTradingHours()) { try { await mcpEnrich(signals.filter(s => s.signal === "AL").slice(0, 6)); } catch {} }
    st = await runPaper(signals, xuNow, bearRegime);
  } else {
    console.log("⚠ Gist yok — AI TRADER atlandı (state kalıcı olmadan paper trading her çalışmada sıfırlanır). GH_GIST_TOKEN + GIST_ID secret'larını ekle.");
  }

  // Telegram komutlarına cevap ver (/durum, /pozisyonlar) — her run
  if (st) await handleCommands(st);

  // ---------- SAAT BAŞI RAPOR (her saat 1 kez; tarama 20+ kez/gün ama mesaj saatlik) ----------
  const istHour = +new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", hour: "2-digit", hour12: false });
  const manual = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  const doReport = !st || manual || st.lastReportHour !== istHour;
  let sent = 0;

  if (doReport) {
    // 1) HİSSE TARA — güncel en güçlü AL/SAT
    const al = signals.filter(s => s.signal === "AL").slice(0, 15), sa = signals.filter(s => s.signal === "SAT").slice(0, 15);
    const f = s => `${s.sym} %${s.confidence} @${s.price}₺ · stop ${s.stopLoss} · hedef ${s.target1}${s.news ? " · " + s.news : ""}`;
    let m1 = "🦅 EAGLE EYE — HİSSE TARA (motor)\n" + fmtTime();
    if (!signals.length) m1 += "\n\n⚠ Tarama 0 sinyal döndü — Yahoo/veri kaynağı geçici sorun olabilir.";
    if (al.length) m1 += `\n\n📈 EN GÜÇLÜ AL (${al.length}):\n` + al.map(f).join("\n");
    if (sa.length) m1 += `\n\n📉 SAT (${sa.length}):\n` + sa.map(f).join("\n");
    m1 += "\n\n⚠ Yatırım tavsiyesi değildir · ~15dk gecikmeli olabilir.";
    await sendTG(m1); sent++; await sleep(400);

    // 2) AI TRADER durumu (saatlik): yeni pozisyon?, açık pozisyonlar + açılıştan beri K/Z
    if (st) {
      const priceOf = s => signals.find(x => x.sym === s)?.price || st.pos[s]?.last || st.pos[s]?.entry;
      const eq = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * priceOf(s), 0);
      const portRet = (eq - st.start) / st.start * 100;
      const idxRet = (st.xuStart && xuNow) ? (xuNow - st.xuStart) / st.xuStart * 100 : null;
      const rel = idxRet != null ? portRet - idxRet : null;
      const openLines = Object.entries(st.pos).map(([s, p]) => {
        const cur = priceOf(s), pr = (cur - p.entry) / p.entry * 100;
        return `• ${s} ${p.lot} lot · giriş ${p.entry}₺ → ${cur}₺ · K/Z ${pr >= 0 ? "+" : ""}${pr.toFixed(1)}%`;
      });
      const ho = st.hourOpens || [], hc = st.hourCloses || [];
      let m2 = `📊 AI TRADER — DURUM\n${fmtTime()}\n`;
      m2 += `\n🆕 Bu saat: ${ho.length ? ho.length + " yeni pozisyon açıldı" : "yeni pozisyon açılmadı"}`;
      if (ho.length) m2 += "\n" + ho.join("\n");
      if (hc.length) m2 += `\n\n✅ Bu saat ${hc.length} kapanış:\n` + hc.join("\n");
      m2 += `\n\n📌 Açık pozisyonlar (${openLines.length}/5) — açılıştan beri K/Z:\n` + (openLines.join("\n") || "yok");
      m2 += `\n\n💼 Değer: ${Math.round(eq).toLocaleString("tr-TR")}₺ · Nakit: ${Math.round(st.cash).toLocaleString("tr-TR")}₺`;
      m2 += `\n📈 Toplam getiri: ${portRet >= 0 ? "+" : ""}${portRet.toFixed(2)}%`;
      if (idxRet != null) {
        m2 += `\n🏛 XU100: ${idxRet >= 0 ? "+" : ""}${idxRet.toFixed(2)}%`;
        m2 += `\n⚖️ Endekse relatif: ${rel >= 0 ? "+" : ""}${rel.toFixed(2)}% ${rel >= 0 ? "✅ üstünde" : "🔻 altında"}`;
      }
      m2 += `\n🌐 Rejim: ${bearRegime ? "DÜŞÜŞ — savunma (az poz · sadece dip · yarı risk)" : "NORMAL"}`;
      const ss = setupStats(st.trades);
      if (Object.keys(ss).length) m2 += "\n🧪 Kurulum (kazanan/toplam): " + Object.entries(ss).map(([k, v]) => `${k} ${v.w}/${v.n}${v.pnl ? ` (${v.pnl >= 0 ? "+" : ""}${Math.round(v.pnl)}₺)` : ""}`).join(" · ");
      await sendTG(m2); sent++; await sleep(400);
      // Günde 1 kez performans özeti (beklenti/drawdown/Sharpe/kurulum)
      if (st.lastPerfDay !== st.dayKey && (st.trades || []).length) { await sendTG(perfReport(st)); sent++; st.lastPerfDay = st.dayKey; await sleep(400); }
      // raporu kaydet: bu saati işaretle, saatlik birikimi sıfırla
      st.lastReportHour = istHour; st.hourOpens = []; st.hourCloses = [];
      await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
      console.log(`Rapor gönderildi · değer ~${Math.round(eq)}₺ · getiri ${portRet.toFixed(2)}% · poz ${openLines.length}`);
    }
  } else {
    console.log(`Saat ${istHour} raporu zaten gönderildi — sessiz tarama/yönetim. Birikim: ${(st.hourOpens || []).length} açılış, ${(st.hourCloses || []).length} kapanış.`);
  }

  console.log(`${sent} Telegram mesajı gönderildi. Toplam ${((Date.now() - t0) / 1e3).toFixed(1)}s`);
}
// Doğrudan çalıştırınca tetikle; import edilince (test harness) tetikleme.
const _entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === _entry) {
  main().catch(async e => {
    console.error("FATAL:", e);
    try { await sendTG("⚠ EAGLE EYE bot HATASI: " + (e?.message || e)); } catch {}
    process.exit(1);
  });
}
export { runPaper, perfStats, setupStats, disabledSetups, riskMult, setupOf };
