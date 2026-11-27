#!/usr/bin/env node
// EAGLE EYE — Otonom motor botu (bulutta, cihaz gerekmez)
// 1) ~195 BIST hissesini (bot/symbols.json) UYGULAMANIN KENDİ MOTORUYLA tarar (getSignals) -> AL/SAT -> Telegram
// 2) AI TRADER sanal portföyünü yönetir (aç/kapat, TP/SL/trailing) -> Telegram
// State Gist'te (feybot_paper.json). Bağımlılıksız (Node 20+ ESM).

import { getSignals, enrichData, getHigherTrend } from "./engine.mjs";
import { fetchDaily, fetchWeekly, fetchIndexClose, weekKey } from "./data.mjs";
import { buildModels, modelMsg } from "./model-portfolio.mjs";
import { mcpCall } from "./mcp.mjs";
import { grokXSentiment, geminiAdvise, grokEnabled, geminiEnabled, llmDiag, grokLastError } from "./llm.mjs";
import { positionScan } from "./position-scan.mjs";
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
const NEWS_ARCH  = "eagle_news_scores.json";   // günlük haber puanı arşivi (ölçüm için)
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
// Telegram tek mesaj sınırı 4096 karakter; aşan mesaj TAMAMEN reddedilir → satır sınırından ≤3900'lük parçalara böl
// (3900'den uzun tek satır da kesilmeden parçalanır). Teslim garantisi: Telegram sohbet başına ~1 mesaj/sn ister; peş peşe
// rapor mesajları "429 Too Many Requests" alabilir → eskiden o parça TEKRAR DENENMEDEN kayboluyordu. Artık: mesajlar arası
// ≥1 sn (TG_GAP_MS), 429'da Telegram'ın verdiği retry_after kadar bekleyip yeniden dener, 5xx/ağ hatasında da dener (3 deneme).
let _tgLast = 0;
async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT) { console.log("[TG] yapılandırılmamış"); return false; }
  const LIM = 3900, parts = []; let cur = "";
  const lines = String(text).split("\n").flatMap(l => l.length > LIM ? l.match(new RegExp(`[\\s\\S]{1,${LIM}}`, "g")) : [l]);
  for (const line of lines) {
    const add = cur ? cur + "\n" + line : line;
    if (add.length > LIM && cur) { parts.push(cur); cur = line; } else cur = add;
  }
  if (cur) parts.push(cur);
  const GAP = +(process.env.TG_GAP_MS ?? 1000);
  let ok = true;
  for (const p of parts) {
    let done = false;
    for (let at = 1; at <= 3 && !done; at++) {
      const wait = _tgLast + GAP - Date.now(); if (wait > 0) await sleep(wait);
      try {
        const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
          method: "POST", signal: AbortSignal.timeout(15000), headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: TG_CHAT, text: p, disable_web_page_preview: true }),
        });
        _tgLast = Date.now();
        if (r.ok) { done = true; break; }
        const j = await r.json().catch(() => ({}));
        console.error(`[TG] hata ${r.status} (deneme ${at}/3)`, String(j.description || "").slice(0, 120));
        if (r.status === 429) await sleep(Math.min(+(j.parameters?.retry_after) || 3, 30) * 1000 + 250);
        else if (r.status < 500) break;                         // 400/401/403: tekrar denemek anlamsız (ör. sohbet yok, token geçersiz)
        else await sleep(1500 * at);
      } catch (e) { _tgLast = Date.now(); console.error(`[TG] ${e.message} (deneme ${at}/3)`); await sleep(1500 * at); }
    }
    if (!done) ok = false;
  }
  return ok;
}

// HİSSE TARA mesajı. HİÇBİR AL/SAT KAYBOLMAZ: en güçlü 15'i ayrıntılı, kalanı kısa liste (alfabetik); başlıkta TOPLAM sayı.
// Eskiden yalnız ilk 15 gösteriliyor, başlıkta da gösterilen sayı ("SAT (15)") yazıyordu → liste tam sanılıyordu.
// Geçmiş tekrarı (2026-06-16..11-20, 112 işlem günü): SAT 99 günde 15'i aştı (en kötü 2026-10-16: 118 SAT, 103'ü mesajda yoktu);
// AL hiç aşmadı. Sebep Telegram sınırı DEĞİL (en uzun mesaj ~1.6k krk) — bu kesim. AI TRADER her zaman TÜM sinyalleri kullandı.
// SADE SATIR (kullanıcı isteği 2026-11-28): yalnız giriş · hedef · stop. Seviyeler AI TRADER'ın kendi kuralı:
// stop mesafesi = 2×ATR (ATR yoksa fiyatın %3'ü), hedef = 2 × stop mesafesi. SAT'ta yön ters (stop üstte, hedef altta).
const lv = s => { const p = s.price, d = s.atr > 0 ? 2 * s.atr : p * 0.03, f = v => +v.toFixed(2); return s.signal === "SAT" ? { stop: f(p + d), tgt: f(Math.max(0.01, p - 2 * d)) } : { stop: f(p - d), tgt: f(p + 2 * d) }; };
const sigLine = s => { const l = lv(s); return `${s.sym} · giriş ${s.price}₺ · hedef ${l.tgt}₺ · stop ${l.stop}₺`; };
const SHOW = 5;   // mesajda taraf başına en güçlü 5 (tam liste: /tara)
function buildScanMsg(signals, gErr = 0, newSet = null, full = false) {   // newSet: bugün İLK KEZ AL olanlar → 🆕
  const _as = s => (s.confidence || 0) + (s.er || 0) * 8 + (s.preMom || 0) * 0.4 + (s.ret60 || 0) * 0.3;
  const AL = signals.filter(s => s.signal === "AL").sort((a, b) => _as(b) - _as(a)), SA = signals.filter(s => s.signal === "SAT");
  const f = s => (newSet?.has(s.sym) ? "🆕 " : "") + sigLine(s);
  const sec = (title, arr) => { if (!arr.length) return ""; const n = full ? arr.length : Math.min(SHOW, arr.length);
    return `\n\n${title}${arr.length > n ? ` — en güçlü ${n} (toplam ${arr.length})` : ""}:\n` + arr.slice(0, n).map(f).join("\n"); };
  let m = "🦅 EAGLE EYE — HİSSE TARA (motor)\n" + fmtTime();
  if (!signals.length) m += "\n\n⚠ Tarama 0 sinyal döndü — Yahoo/veri kaynağı geçici sorun olabilir.";
  m += sec("🟢 AL", AL) + sec("🔴 SAT", SA);
  if (!full && (AL.length > SHOW || SA.length > SHOW)) m += "\n\nTam liste: /tara";
  if (gErr) m += `\n\n⛔ GIST ERİŞİLEMİYOR (HTTP ${gErr}) — ${[401, 403, 404].includes(gErr) ? "GH_GIST_TOKEN süresi dolmuş/geçersiz (veya GIST_ID yanlış): GitHub'da yeni token (gist yetkili) oluştur, repo Settings → Secrets → GH_GIST_TOKEN'ı güncelle." : "geçici olabilir."} Bu sürede AI TRADER işlem yapmaz, komutlar cevaplanmaz; portföy korunur.`;
  return m + "\n\n⚠ Yatırım tavsiyesi değildir · ~15dk gecikmeli olabilir.";
}

// ---------- Gist state ----------
// Okuma BAŞARISIZ (rate-limit/5xx/ağ/parse) ile gerçekten BOŞ gist'i ayırt et:
// başarısızlıkta "bilinmiyor" döndür → çağıran ASLA sıfırlamaz/yazmaz (eski bug: tek hata portföyü siliyordu).
const READ_FAILED = Symbol("gist_read_failed");
// Son gist hatası (HTTP durum; -1 = ağ). 0 = sorun yok. Telegram raporuna uyarı olarak yazılır —
// 2026-09'da token süresi dolunca bot 2+ ay SESSİZCE durmuştu (okuma/yazma 401, kimse fark etmedi).
let gistErr = 0;
async function gistGet(file, fallback) {
  if (!GIST_TOKEN || !GIST_ID) return fallback;
  try {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: "Bearer " + GIST_TOKEN, Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(20000),   // takılan bağlantı run'ı dakikalarca kilitlemesin (zaman aşımı → READ_FAILED: güvenli)
    });
    if (!r.ok) { gistErr = r.status; console.error(`[Gist] okunamadı: HTTP ${r.status}`); return READ_FAILED; }   // boş SAYMA
    const g = await r.json();
    const c = g.files?.[file]?.content;
    return c ? JSON.parse(c) : fallback;           // gist var, dosya yok = gerçekten ilk kez
  } catch (e) { gistErr = gistErr || -1; console.error("[Gist] okuma hatası:", e.message); return READ_FAILED; }   // durum bilinmiyor
}
async function gistPut(files) {
  if (!GIST_TOKEN || !GIST_ID) return;
  try {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + GIST_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) { gistErr = r.status; console.error(`[Gist] yazılamadı: HTTP ${r.status}`); }
  } catch (e) { gistErr = gistErr || -1; console.error("[Gist] kaydedilemedi:", e.message); }
}

// ---------- Tarama (motor) ----------
// io: veri çekiciler (varsayılan canlı Yahoo). Portföy simülatörü geçmiş günün verisini AYNI koda verir.
async function scanOne(sym, io = { fetchDaily, fetchWeekly }) {
  // SİNYAL = GÜNLÜK mum (çok-günlük pozisyon için doğru tf; MA50/MA200/ADX geçerli).
  const daily = await io.fetchDaily(sym);
  if (daily.length < 60) return null;                                  // yeterli geçmiş yoksa atla
  const ed = enrichData(daily);
  const last = ed[ed.length - 1];
  if (!last) return null;
  const _ago = daily[Math.max(0, daily.length - 60)]; const ret60 = _ago ? (last.close - _ago.close) / _ago.close * 100 : 0;
  // Likidite: günlük ortalama işlem hacmi (son 20 gün) × fiyat < 5M TL ise ele
  const avgVol = daily.slice(-20).reduce((a, b) => a + (b.volume || 0), 0) / Math.min(20, daily.length);
  const off = io.opts?.off || {};   // SADELEŞTİRME TESTİ (yalnız simülatör): kapatılan filtreler; canlıda boş
  if (!off.liq && avgVol * last.close < 5e6) return null;
  const _cl = daily.slice(-21).map(b => b.close); const _er = _cl.length > 1 ? +(Math.abs(_cl[_cl.length - 1] - _cl[0]) / (_cl.reduce((a, c, k) => k ? a + Math.abs(c - _cl[k - 1]) : 0, 0) || 1)).toFixed(2) : 0;
  const _p10 = ed[ed.length - 11], _r10 = _p10 ? (last.close - _p10.close) / _p10.close * 100 : 0, _obvUp = (last.obv != null && _p10 && _p10.obv != null) ? last.obv > _p10.obv : false;
  const _aa = ed.slice(-60).map(c => c.atr).filter(x => x > 0), _atrAvg = _aa.length ? _aa.reduce((a, b) => a + b, 0) / _aa.length : 0, _atrLow = (last.atr > 0 && _atrAvg > 0) ? last.atr < _atrAvg * 0.85 : false;
  const preMom = (last.squeezeOn ? 30 : 0) + (_obvUp && Math.abs(_r10) < 4 ? 25 : 0) + (_atrLow ? 25 : 0) + (last.squeezeOff && (last.volume || 0) > avgVol * 1.5 ? 20 : 0);
  const _rs20 = []; for (let i = Math.max(1, daily.length - 20); i < daily.length; i++) _rs20.push(+((daily[i].close - daily[i - 1].close) / daily[i - 1].close).toFixed(4));
  const _bw = daily.slice(-121, -1), _bhi = _bw.length ? Math.max(..._bw.map(b => b.high || b.close)) : 0, _blo = _bw.length ? Math.min(..._bw.map(b => b.low || b.close)) : 0;
  const _tightB = _blo > 0 && (_bhi - _blo) / _blo < 0.40, breakout = (_tightB && last.close > _bhi * 1.005 && (last.volume || 0) > avgVol * 1.3) ? 1 : 0, boTarget = breakout ? +(_bhi + (_bhi - _blo)).toFixed(2) : null;
  const weekly = await io.fetchWeekly(sym);                            // ÜST TREND = haftalık
  const k = getSignals(ed, getHigherTrend(weekly), weekly);
  const aboveMa50 = !!(last.ma50 && last.close > last.ma50);
  // TOBO (ters omuz-baş-omuz) boyun kırılımı — DENEY (yalnız simülatör io.opts.tobo; canlıda kapalı)
  if (io.opts?.tobo) {
    const w = daily.slice(-70, -1), n = w.length;
    if (n >= 40) {
      let h = 10; for (let j = 10; j < n - 8; j++) if (w[j].low < w[h].low) h = j;
      const lo = (a, b) => Math.min(...w.slice(a, b).map(x => x.low)), head = w[h].low, ls = lo(0, h - 4), rsh = lo(h + 5, n), neck = Math.max(...w.slice(h, n).map(x => x.high));
      if (ls > head * 1.03 && rsh > head * 1.03 && neck / head < 1.35 && last.close > neck && (last.volume || 0) > avgVol * 1.3) {
        const base = { sym, signal: "AL", confidence: Math.max(70, k?.final === "AL" ? k.confidence : 0), price: last.close, dip: 0, tobo: 1, atr: (last.atr > 0) ? last.atr : null, avgVol: Math.round(avgVol), er: _er, preMom, rets20: _rs20, breakout: 1, boTarget: +(neck + (neck - head)).toFixed(2),
          stopLoss: +rsh.toFixed(2), target1: +(neck + (neck - head)).toFixed(2), mod: "TOBO", adx: Math.round(k?.adx || 0), htf: k?.higherTrend, ret60: +ret60.toFixed(1), aboveMa50 };
        base.rr = last.close > rsh ? +((base.target1 - last.close) / (last.close - rsh)).toFixed(2) : 0;
        return base;
      }
    }
  }
  if (!k || k.final === "NÖTR") return null;
  // KALİTE FİLTRESİ — daha isabetli, daha az gürültü. DİP DÖNÜŞLER muaf (karşı-trend doğrulanmış giriş).
  const isDip = !!k.dipSignal;
  if (!off.conf && k.confidence < MIN_CONF) return null;                                 // zayıf sinyalleri ele (varsayılan 65)
  if (!off.adx && !isDip && (k.adx || 0) < MIN_ADX) return null;
  // 2026-11-27 sadeleştirme: "üst zaman ⚠", "düşen haftalık trende AL yok", "yükselen haftalık trende SAT yok" KALDIRILDI —
  // 12 ay saatlik simülasyonda getiri VE sinyal sayısı birebir aynıydı (motor bu durumları zaten eliyor). Kullanıcı onayıyla.                        // trendsiz/choppy gürültü (dip hariç)
  if (!off.vol && !isDip && k.final === "AL" && (last.volume || 0) < avgVol * 0.7) return null; // hacim kuruması = teyitsiz AL
  if (!off.rsi && !isDip && k.final === "AL" && (last.rsi || 0) >= 63) return null; // aşırı-alımda/geç girişi ele (backtest: erken giriş %42 vs geç %34)
  return { sym, signal: k.final, confidence: k.confidence, price: last.close, dip: isDip ? (k.dipSignal.score || 0) : 0, atr: (last.atr && last.atr > 0) ? last.atr : null, avgVol: Math.round(avgVol), er: _er, preMom, rets20: _rs20, breakout, boTarget,
           stopLoss: k.stopLoss, target1: k.target1, mod: k.mod, adx: Math.round(k.adx || 0), htf: k.higherTrend, ret60: +ret60.toFixed(1), aboveMa50, rr: (k.target1 && k.stopLoss && last.close > k.stopLoss) ? +((k.target1 - last.close) / (last.close - k.stopLoss)).toFixed(2) : 0 };
}
async function scanAll(io) {   // io verilmezse canlı Yahoo (scanOne varsayılanı)
  const out = [];
  for (let i = 0; i < syms.length; i += CONC) {
    const r = await Promise.all(syms.slice(i, i + CONC).map(s => scanOne(s, io).catch(() => null)));
    r.forEach(x => x && out.push(x));
  }
  out.sort((a, b) => a.signal !== b.signal ? (a.signal === "AL" ? -1 : 1) : b.confidence - a.confidence);
  return out;
}

// ---------- Kurulum (setup) etiketi + performans öğrenme ----------
// Her AL adayını kurulum tipine etiketle; kapanan işlemlerden tip-bazlı beklenti ölç.
function setupOf(s) { return s.tobo ? "tobo" : s.dip ? "dip" : (s.htf === "YUKARI" ? "trend" : "counter"); }
function setupStats(trades) {
  const m = {};
  for (const t of trades || []) { const k = t.setup || "?"; (m[k] = m[k] || { n: 0, w: 0, pnl: 0 }); m[k].n++; if ((t.pnl || 0) > 0) m[k].w++; m[k].pnl += (t.pnl || 0); }
  return m;
}
// AMPİRİK BUDAMA + SOĞUMA: ≥10 kapanan işlemi olan ve SON 10 işlemi net zararda olan kurulum, son işleminin kapanışından
// itibaren COOL_DAYS gün durur; sonra küçük riskle (riskMult 0.6) yeniden denenir. Yeni deneme de zarar ederse yine durur.
// Eskiden süresizdi: kapalı kurulum işlem açmadığı için yeni veri hiç gelmiyor → bir kez kapanan ASLA geri açılmıyordu
// (2026-11: trend Temmuz'dan, dip Ağustos'tan kilitliydi → düşüş rejiminde yalnız dip açılabildiği için AI TRADER hiç işlem açamıyordu).
const COOL_DAYS = 30;
function setupPauses(trades, today = new Date().toISOString().slice(0, 10)) {
  const by = {}, out = {};
  for (const t of trades || []) (by[t.setup || "?"] = by[t.setup || "?"] || []).push(t);
  for (const [k, arr] of Object.entries(by)) {
    if (arr.length < 10) continue;
    const last10 = [...arr].sort((a, b) => String(b.close || "").localeCompare(String(a.close || ""))).slice(0, 10);   // en yeni 10
    const pnl10 = last10.reduce((a, t) => a + (t.pnl || 0), 0);
    const ago = (Date.parse(today) - Date.parse(last10[0].close)) / 864e5;   // tarih yoksa NaN → güvenli taraf: durdur
    if (pnl10 < 0 && !(ago >= COOL_DAYS)) out[k] = { pnl10: Math.round(pnl10), daysLeft: isFinite(ago) ? Math.ceil(COOL_DAYS - ago) : COOL_DAYS };
  }
  return out;
}
function disabledSetups(trades, today) {
  return new Set(Object.keys(setupPauses(trades, today)));
}

// PORTFÖY YÖNETİCİSİ (anahtarsız, kural-tabanlı): kurulumun GERÇEK beklentisine göre risk çarpanı
function riskMult(setup, st) {
  const s = setupStats(st.trades)[setup];
  if (!s || s.n < 3) return 1;            // yeterli kanıt yok → nötr
  const wr = (s.w + 4) / (s.n + 8);       // Bayes (Beta 4,4): küçük örneği %50e shrink
  return wr > 0.55 ? 1.3 : wr < 0.45 ? 0.6 : 1;
}
function corr(a, b) {
  if (!a || !b || a.length < 5 || b.length < 5) return 0;
  const n = Math.min(a.length, b.length), x = a.slice(-n), y = b.slice(-n);
  const mx = x.reduce((q, v) => q + v, 0) / n, my = y.reduce((q, v) => q + v, 0) / n;
  let nu = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { const u = x[i] - mx, w = y[i] - my; nu += u * w; dx += u * u; dy += w * w; }
  return (dx && dy) ? nu / Math.sqrt(dx * dy) : 0;
}

// MCP olay/analist/temel katmanı (sunucu-tarafı; yalnız en güçlü adaylar — hız + fail-safe).
// Sinyalleri yerinde zenginleştirir: s.blackout (kazanç yakın), s.weakFund (zararda), s.analyst + güven tilt'i.
async function mcpEnrich(cands) {
  const now = Date.now();
  for (const s of cands) {
    const c0 = s.confidence;
    const [ear, an, fr] = await Promise.all([
      mcpCall("get_earnings", { symbol: s.sym, market: "bist" }),
      mcpCall("get_analyst_data", { symbol: s.sym, market: "bist" }),
      mcpCall("get_financial_ratios", { symbol: s.sym, market: "bist" }),
    ]);
    if (ear?.next_earnings_date) {                                  // kazanç kara listesi: ≤3 gün → gap riski, açma
      const days = Math.round((Date.parse(ear.next_earnings_date) - now) / 864e5);
      if (days >= 0 && days <= 3) { s.blackout = true; s.mcpNote = `bilanço ${days}g`; }
    }
    // analist teyidi → güven tilt'i. Yeni BorsaMCP upside_potential vermiyor → ortalama hedef fiyattan (mean_target) hesapla
    const cons = an?.summary?.consensus || "", mt = +(an?.summary?.mean_target) || 0;
    const up = typeof an?.upside_potential === "number" ? an.upside_potential : (mt > 0 && s.price > 0 ? (mt - s.price) / s.price * 100 : undefined);
    if (/strong buy/i.test(cons)) s.confidence = Math.min(99, s.confidence + 8);
    else if (/buy/i.test(cons)) s.confidence = Math.min(99, s.confidence + 4);
    else if (/sell/i.test(cons)) s.confidence = Math.max(0, s.confidence - 6);
    if (cons) s.analyst = cons + (typeof up === "number" ? ` ${up.toFixed(0)}%` : "");
    const pe = fr?.valuation?.pe_ratio;                             // temel kapısı: zarar eden şirket (PE≤0) → ele
    if (typeof pe === "number" && pe <= 0) { s.weakFund = true; s.mcpNote = (s.mcpNote ? s.mcpNote + " · " : "") + "zararda(PE<0)"; }
    s._mcpAdj = s.confidence - c0;                                  // güven ayarı → günlük önbelleğe yazılır
  }
}

// ENDEKS TARA — bot, scan_stocks'u 5 endeks için sunucu-tarafı çalıştırır (CORS yok) → eagle_index.json'a yazılır, app okur.
const IDX_LIST = ["XU100", "XU030", "XUSIN", "XUMAL", "XUHIZ"];
async function scanIndices() {
  const indices = {};
  for (const ix of IDX_LIST) {
    const r = await mcpCall("scan_stocks", { index: ix, timeframe: "1d", condition: "close > 0" }, 20000).catch(() => null);
    const arr = (r && Array.isArray(r.stocks)) ? r.stocks : [];
    indices[ix] = arr.map(s => ({ sym: s.symbol, name: s.name || s.symbol, close: +(+s.close || 0).toFixed(2), chg: +(+s.change || 0).toFixed(2), vol: s.volume || 0 }));
  }
  return { ts: Date.now(), indices };
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

// Elde tutulan hisse için zayıflama girdileri (portföy simülatöründeki held() ile AYNI formül): MA20, hacim oranı, RS(60g) − endeks
async function heldInfo(sym, idxRet60 = 0) {
  const a = await fetchDaily(sym), j = a.length - 1; if (j < 60) return {};
  const c = a.slice(j - 19, j + 1), ma20 = c.reduce((x, b) => x + b.close, 0) / 20, v20 = c.reduce((x, b) => x + (b.volume || 0), 0) / 20;
  return { ma20, volR: v20 > 0 ? (a[j].volume || 0) / v20 : 0, rs: (a[j].close - a[j - 59].close) / a[j - 59].close * 100 - idxRet60 };
}
async function runPaper(signals, xuNow, bearRegime = false, _test = null, mkt = {}) {
  const today = (_test && _test.today) || new Date().toISOString().slice(0, 10);   // _test.today: portföy simülatörünün günü
  // Çıkış ayarları. Varsayılanlar = CANLI davranış; yalnız portföy simülatörü _test.cfg ile senaryo dener
  // (beR: başabaşı +%2 yerine ilk riskin (2×ATR) katında yap · sigExitDip:false → dip kurulumunu SAT sinyali kapatmaz).
  const cfg = { beR: null, sigExitDip: true, failExit: false, weakExit: true, bearMode: "dip", short: false, shortRevOnly: false, avoidWeak: false,   // 2026-11-22 SAATLİK simülasyon: dip + zayıflama çıkışı iki yolda da eski kodu geçti; lider karışıktı → geri alındı
    ...((_test && _test.cfg) || {}) };
  const atClose = !_test || _test.isClose !== false;   // simülatör gün içi noktalarda false verir
  // zayıflama çıkışı simülasyondaki gibi KAPANIŞA YAKIN değerlendirilir (17:30 sonrası; gün içi kısmi hacimle erken tetiklenmesin)
  const nearClose = _test ? atClose : (() => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()); return +p.find(x => x.type === "hour").value * 60 + +p.find(x => x.type === "minute").value >= 1050; })();
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
  // günlük yedek (bozulursa geri yükle). BEKLENİR: ana kayıtla aynı anda gist'e iki PATCH gitmesin (çakışma = işlem kaybı).
  if (st.lastBackupDay !== today && !_test) { const _bk = JSON.stringify(st); st.lastBackupDay = today; await gistPut({ "feybot_paper_backup.json": { content: _bk } }); }
  const scanMap = Object.fromEntries(signals.map(s => [s.sym, s]));
  const satSet = new Set(signals.filter(s => s.signal === "SAT").map(s => s.sym));
  const opened = [], closed = [];
  // Taramada çıkmayan pozisyon → son bilinen fiyat (p.last); eskiden giriş fiyatı kullanılıyordu (boyut/fren hesabı sapıyordu)
  const equity = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * ((scanMap[s]?.price) || p.last || p.entry), 0);
  // YENİ GÜN: günlük zarar frenini BU günün açılış değerine bağla. Eskiden işlemlerden SONRA yapılıyordu →
  // günün ilk taraması (10:00) dünün referansına bakıp yanlışlıkla alım yapmayabiliyordu.
  if (st.dayKey !== today) { st.dayStart = equity; st.dayKey = today; }

  // Pozisyon yönetiminin TAMAMI (alım + satım) sadece BIST seansında: hafta içi 09:55–18:05.
  // Açılış (09:55) dahil → gece verilen kararlar sabah açılışta uygulanır.
  const trading = _test && "forceTrading" in _test ? _test.forceTrading : isTradingHours();
  // MCP (bilanço kara listesi / zararda şirket / analist): her hisse GÜNDE 1 sorgulanır, sonuç state'te saklanır → filtre günün
  // TÜM taramalarında geçerli. Eskiden yalnız günün ilk taramasında uygulanıyor, sonrakilerde unutuluyordu.
  if (trading && !_test) {
    if (st.mcpDay !== today) { st.mcpDay = today; st.mcpC = {}; delete st.lastMcpDay; }
    st.mcpC = st.mcpC || {};
    const todo = signals.filter(s => s.signal === "AL").slice(0, 6).filter(s => !st.mcpC[s.sym]);
    if (todo.length) { try { await mcpEnrich(todo); } catch {} for (const s of todo) st.mcpC[s.sym] = { b: s.blackout ? 1 : 0, w: s.weakFund ? 1 : 0, a: s.analyst || "", d: s._mcpAdj || 0, n: s.mcpNote || "" }; }
    for (const s of signals) {
      const c = st.mcpC[s.sym]; if (!c || todo.includes(s)) continue;
      if (c.b) s.blackout = true; if (c.w) s.weakFund = true; if (c.a) s.analyst = c.a; if (c.n) s.mcpNote = c.n;
      if (c.d) s.confidence = Math.max(0, Math.min(99, s.confidence + c.d));
    }
  }
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
    const beAt = cfg.beR ? cfg.beR * ((ps.atr > 0 ? 2 * ps.atr : ps.entry * 0.03) / ps.entry) : 0.02;
    if (pct >= beAt && (!ps.sl || ps.sl < ps.entry)) ps.sl = ps.entry;
    const trailLv = ps.peak ? +((ps.atr && ps.atr > 0 ? ps.peak - 3 * ps.atr : ps.peak * 0.985)).toFixed(2) : null;  // ATR chandelier (yoksa %1.5)
    const daysHeld = ps.date ? Math.round((Date.parse(today) - Date.parse(ps.date)) / 864e5) : 0;
    // KISMİ KÂR: ilk hedefe ulaşınca yarısını sat (bir kez), kalanı trailing'e bırak
    if (!ps.partial && ps.tp && cur >= ps.tp && ps.lot >= 2) {
      const half = Math.floor(ps.lot / 2);
      const pnl = +((cur - ps.entry) * half).toFixed(0), pnlPct = +(pct * 100).toFixed(2);
      st.cash += half * cur;
      st.trades.unshift({ sym, entry: ps.entry, exit: cur, lot: half, pnl, pnlPct, open: ps.date, close: today, reason: "TP-yarı", setup: ps.setup || "?", feat: ps.feat });
      ps.lot -= half; ps.partial = true; ps.tp = +(cur * 1.05).toFixed(2);   // kalan için hedefi yukarı taşı
      closed.push(`💰 ${sym} YARI KÂR @ ${cur}₺ · +%${pnlPct} (${pnl >= 0 ? "+" : ""}${pnl}₺) · kalan ${ps.lot} lot trailing'de`);
      continue;
    }
    // TAM KAPAMA: stop(breakeven dahil) / trailing / SAT sinyali / (kısmi yapılmadıysa hedef)
    const hitSL = ps.sl && cur <= ps.sl, hitTS = !!trailLv && cur <= trailLv, hitSIG = satSet.has(sym) && (cfg.sigExitDip || ps.setup !== "dip");
    const hitTP = !ps.partial && ps.tp && cur >= ps.tp;
    const hitTIME = daysHeld >= 14 && Math.abs(pct) < 0.02;
    const hitKISA = ps.setup === "kisa" && daysHeld >= 5;   // kısa vade: ~3 iş günü (5 takvim günü) sonra çık
    const sm = scanMap[sym];   // DENEY çıkışları (cfg; canlıda kapalı)
    const hitFAIL = cfg.failExit && atClose && !ps.pyr && daysHeld >= 1 && daysHeld <= 3 && cur < ps.entry * 0.99;
    // ZAYIFLAMA: o gün sinyali OLMAYAN pozisyon MA20 altına hacimle (>1.2×) kapanıyor ve endeksten belirgin zayıf (RS<−5) → çık
    let hitWEAK = false;
    if (cfg.weakExit && nearClose && (!sm || sm.signal === "NÖTR")) {
      const hi = sm?.ma20 != null ? sm : (_test ? {} : await heldInfo(sym, mkt.idxRet60 || 0));
      hitWEAK = hi.ma20 > 0 && cur < hi.ma20 && (hi.volR || 0) > 1.2 && (hi.rs ?? 0) < -5;
    }   // ÖLÜ PARA: 14 günde kıpırdamadı → sermayeyi boşalt
    if (hitSL || hitTS || hitSIG || hitTP || hitTIME || hitFAIL || hitWEAK || hitKISA) {
      const reason = hitSL ? (ps.sl === ps.entry ? "BE" : "SL") : hitTS ? "TS" : hitSIG ? "SIG" : hitTP ? "TP" : hitFAIL ? "FAIL" : hitWEAK ? "WEAK" : hitKISA ? "KISA" : "ZAMAN";
      const label = { SL: "Zarar Durdur", BE: "Başabaş (kâr korundu)", TS: "Trailing Stop", SIG: "SAT sinyali", TP: "Hedef", ZAMAN: "Ölü para (zaman stopu)", FAIL: "Başarısız kırılım", WEAK: "Zayıflama", KISA: "Kısa vade süresi doldu" }[reason];
      const pnl = +((cur - ps.entry) * ps.lot).toFixed(0), pnlPct = +(pct * 100).toFixed(2);
      st.cash += ps.lot * cur;
      st.trades.unshift({ sym, entry: ps.entry, exit: cur, lot: ps.lot, pnl, pnlPct, open: ps.date, close: today, reason, setup: ps.setup || "?", feat: ps.feat });
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
  const defensive = bearRegime || (mkt.breadth != null && mkt.breadth < 0.4);   // breadth proxy: AL oranı <%40 → savunma
  const _eq = (st.equityLog || []).map(e => e.eq), _eqMA = _eq.length >= 20 ? _eq.slice(-20).reduce((a, b) => a + b, 0) / 20 : null;
  const eqRisk = (_eqMA && _eq[_eq.length - 1] < _eqMA) ? 0.6 : 1; st.eqRisk = eqRisk;   // equity-curve de-risking: kendi MA20 altı → risk kıs
  const MAX_POS = defensive ? 2 : 5;                 // düşüş/zayıf-genişlik → az pozisyon
  const RISK_PCT = 0.01 * (defensive ? 0.5 : 1) * (mkt.volScale || 1) * eqRisk;   // %1 risk × vol × equity-curve
  const MAXCOST = 0.30;                               // tek pozisyon en fazla portföyün %30'u
  const upside = s => (s.target1 && s.price) ? (s.target1 - s.price) / s.price * 100 : 0;
  const ddOK = !st.dayStart || (equity - st.dayStart) / st.dayStart > -0.03;
  const disabled = disabledSetups(st.trades, today);  // ampirik: son 10'u net-zararlı kurulumu 30 gün durdur (soğuma)
  let candidates = signals.filter(s => s.signal === "AL" && !st.pos[s.sym] && !disabled.has(setupOf(s)) && !s.blackout && !s.weakFund);
  if (cfg.avoidWeak && mkt.short?.weakSet) candidates = candidates.filter(s => !mkt.short.weakSet.has(s.sym));   // gün ≤−%4: kısa vadede zayıflık sürüyor
  if (defensive) candidates = cfg.bearMode === "none" ? [] : cfg.bearMode === "leader" ? candidates.filter(s => s.leader) : candidates.filter(s => s.dip);   // düşüş/zayıf-genişlik → SADECE dip
  candidates = candidates
    .map(s => ({ ...s, _score: (s.confidence || 0) + upside(s) * 0.6 + (s.rr || 0) * 3 + (s.rs || 0) * 0.8 + (s.secStrong ? 5 : 0) + (s.dip ? s.dip * 2.5 : 0) + (s.ret60 || 0) * 0.3 + (s.er || 0) * 8 + (s.preMom || 0) * 0.4 + (s.breakout || 0) * 15 }))   // güven+potansiyel+R:R+göreli güç+sektör+dip(backtest:en iyi kenar)
    .sort((a, b) => b._score - a._score);
  for (const sig of candidates) {
    if (Object.keys(st.pos).length >= MAX_POS || !ddOK) break;
    const sec = sectorOf(sig.sym);                                       // SEKTÖR LİMİTİ: aynı sektörde en fazla 2 poz
    if (sec && Object.keys(st.pos).filter(s => sectorOf(s) === sec).length >= 2) continue;
    const _topS = candidates[0]?._score || 0, _maxC = Math.max(0, ...Object.values(st.pos).map(pp => corr(sig.rets20, pp.rets20)));
    if (_maxC > 0.8 && (sig._score || 0) < _topS * 0.85) continue;   // yüksek korelasyon + zayıf aday → atla (ikisi de güçlüyse ikisi de alınır)
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
      st.pos[sig.sym] = { lot: Q, entry: j, date: today, sl, tp, peak: 0, setup, atr: (sig.atr && sig.atr > 0) ? sig.atr : null, rets20: sig.rets20, feat: { er: sig.er, preMom: sig.preMom, breakout: sig.breakout, dip: sig.dip, conf: sig.confidence, rs: sig.rs, regime: bearRegime ? "D" : "N", breadth: mkt.breadth != null ? +mkt.breadth.toFixed(2) : null } };
      const costPct = Math.round(Q * j / equity * 100);
      const why = `setup ${setup}(×${rm})${sig.analyst ? " · analist " + sig.analyst : ""}${sig.rs != null ? " · RS " + sig.rs : ""} · R:R ${sig.rr || "?"}`;
      opened.push(`📈 ${sig.sym} · ${Q} lot @ ${j}₺ (%${costPct} · ${setup}) · güven %${conf} · pot %${up.toFixed(1)} · stop ${sl} · hedef ${tp}\n   ↳ ${why}`);
    }
  }
  // ⚡ KISA VADE AÇILIŞLARI (cfg.short; gün SONU, mkt.short): endeks dönüş günü dipten en çok toparlananlar + güçlü kapanış → en çok 3 'kisa' poz
  if (cfg.short && atClose && mkt.short && ddOK && !disabled.has("kisa")) {
    const K = mkt.short, seen = new Set(), list = [...(K.rev ? K.top : []), ...(cfg.shortRevOnly ? [] : K.strong)].filter(r => !seen.has(r.sym) && seen.add(r.sym) && !st.pos[r.sym]);
    let nK = Object.values(st.pos).filter(p => p.setup === "kisa").length;
    for (const r of list) {
      if (nK >= 3 || Object.keys(st.pos).length >= 8) break;
      const j = r.c, slDist = r.atr > 0 ? +(2 * r.atr).toFixed(2) : +(j * 0.03).toFixed(2), sl = +(j - slDist).toFixed(2), tp = +(j + 2 * slDist).toFixed(2);
      let Q = slDist > 0 ? Math.floor(equity * RISK_PCT * riskMult("kisa", st) / slDist) : 0;
      if (Q * j > equity * MAXCOST) Q = Math.floor(equity * MAXCOST / j);
      if (Q * j > st.cash) Q = Math.floor(st.cash / j);
      if (r.avgVol && Q > r.avgVol * 0.05) Q = Math.floor(r.avgVol * 0.05);
      if (Q <= 0 || sl >= j) continue;
      st.cash -= Q * j; nK++;
      st.pos[r.sym] = { lot: Q, entry: j, date: today, sl, tp, peak: 0, setup: "kisa", atr: r.atr > 0 ? +r.atr.toFixed(4) : null, feat: { kisa: K.rev && K.top.some(x => x.sym === r.sym) ? "donus" : "guclu", dr: +r.dr.toFixed(2) } };
      opened.push(`⚡ ${r.sym} · ${Q} lot @ ${j}₺ (kısa vade · ${st.pos[r.sym].feat.kisa === "donus" ? "endeks dönüşü" : "güçlü kapanış"}) · stop ${sl} · hedef ${tp} · en çok 3 iş günü`);
    }
  }
  } // seans (trading) bloğu sonu

  // Günlük equity logu (performans/analitik) — İŞLEM GÜNÜ başına 1 nokta. Seans dışı (hafta sonu elle çalıştırma) nokta
  // eklemez: eskiden Cumartesi/Pazar düz noktalar ekleniyordu → Sharpe/drawdown ve eq-MA20 risk kısıcısı sulanıyordu.
  const eqEnd = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * ((scanMap[s]?.price) || p.last || p.entry), 0);
  st.equityLog = st.equityLog || [];
  if (trading) {
    if (!st.equityLog.length || st.equityLog[st.equityLog.length - 1].d !== today) st.equityLog.push({ d: today, eq: Math.round(eqEnd) });
    else st.equityLog[st.equityLog.length - 1].eq = Math.round(eqEnd);
  }
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

// ---------- Grok / Gemini (yalnız YORUM — alım/satım kararına GİRMEZ) ----------
const grokLine = (sym, g) => `🐦 Grok/X (${sym}): ${g.label} (${g.score >= 0 ? "+" : ""}${g.score})${g.posts != null ? ` · ${g.posts} X gönderisi okundu` : ""}\n${g.ozet}${g.uyari ? "\n⚠ " + g.uyari : ""}`;
// GÜNLÜK AI YORUM (günde 1). Grok sonucu ARTIK MESAJDA AYRI SATIR. Eskiden: (a) GEMINI anahtarı yoksa Grok hiç çağrılmıyordu,
// (b) Grok yalnız Gemini'nin girdisiydi → Gemini başarısızsa parası ödenen Grok sonucu çöpe gidiyordu, (c) hatalar hiç görünmüyordu.
// Dönüş: Telegram mesaj metni | null.
async function aiDaily(st, signals, bearRegime) {
  if (!(geminiEnabled() || grokEnabled()) || st.lastLlmDay === st.dayKey) return null;
  st.lastLlmDay = st.dayKey;   // başarısız olsa da bugün tekrar deneme (Grok+Gemini en fazla 1/gün)
  const top = signals.filter(s => s.signal === "AL").slice(0, 5);
  let g = null, gLine = "";
  if (grokEnabled() && top[0]) {
    g = await grokXSentiment(top[0].sym);
    gLine = g ? grokLine(top[0].sym, g) : `🐦 Grok/X (${top[0].sym}): alınamadı — ${grokLastError() || "bilinmeyen hata"} (/aitest ile kontrol et)`;
  }
  let advice = null;
  if (geminiEnabled()) {
    const ctx = `Borsa İstanbul AI TRADER günlük durum. Kısa (en çok 5 cümle), Türkçe, nesnel yorum yap: öne çıkanlar, riskler, rejim.\n`
      + `Rejim: ${bearRegime ? "DÜŞÜŞ (savunma)" : "NORMAL"}.\n`
      + `Açık pozisyonlar: ${Object.entries(st.pos).map(([s, p]) => `${s} ${p.lot}@${p.entry}`).join(", ") || "yok"}.\n`
      + `En güçlü AL adayları: ${top.map(s => `${s.sym}(güven%${s.confidence}, R:R ${s.rr || "?"}${s.analyst ? ", analist " + s.analyst : ""})`).join(", ") || "yok"}.\n`
      + `Kurulum performansı: ${Object.entries(setupStats(st.trades)).map(([k, v]) => `${k} ${v.w}/${v.n}`).join(", ") || "veri yok"}.`
      + (g ? `\nX (Twitter) duyarlılığı — Grok, ${top[0].sym}: ${g.label} (${g.score}) — ${g.ozet}${g.uyari ? " · uyarı: " + g.uyari : ""}` : "");
    advice = await geminiAdvise(ctx);
  }
  const parts = [];
  if (advice) parts.push(advice); else if (geminiEnabled()) parts.push("Gemini yorumu alınamadı (/aitest ile kontrol et).");
  if (gLine) parts.push(gLine);
  if (!advice && !gLine) return null;   // Gemini kapalı/başarısız + Grok çağrılmadı (AL adayı yok) → mesaj yok
  const tag = [advice && "Gemini", g && "Grok"].filter(Boolean).join("+");
  return `🤖 GÜNLÜK AI YORUM${tag ? ` (${tag})` : ""}\n` + parts.join("\n\n") + "\n\n⚠ Yalnız yorum — AI TRADER kararlarına girmez.";
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
async function handleCommands(st, ctx = {}) {   // ctx: { signals, bearRegime } (o anki tarama)
  if (!TG_TOKEN || !TG_CHAT || !st) return;
  let updates = [];
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${st.tgOffset || 0}&timeout=0`, { signal: AbortSignal.timeout(15000) });
    const j = await r.json();
    updates = j.result || [];
  } catch { return; }
  if (!updates.length) return;
  let off = st.tgOffset || 0, replied = 0;
  for (const u of updates) {
    off = u.update_id + 1;
    const raw = (u.message?.text || "").trim();
    const txt = raw.toLowerCase().split("@")[0];
    if (String(u.message?.chat?.id) !== String(TG_CHAT)) continue;
    if (txt === "/durum" || txt === "/pozisyonlar") {
      await sendTG(buildStatus(st)); replied++; await sleep(300);
    } else if (txt === "/start") {
      await sendTG(buildStatus(st) + "\n\n" + HELP); replied++; await sleep(300);
    } else if (txt === "/performans" || txt === "/perf") {
      await sendTG(perfReport(st)); replied++; await sleep(300);
    } else if (txt === "/aitest") {
      await sendTG("🔧 AI anahtarları test ediliyor…");
      const d = await llmDiag();
      await sendTG(`🔧 AI TEST\n• Gemini (${d.geminiModel}): ${d.gemini}\n• Grok (${d.grokModel}): ${d.grok}`); replied++; await sleep(300);
    } else if (txt === "/komutlar" || txt === "/help" || txt === "/yardim" || txt === "/yardım") {
      await sendTG(HELP); replied++; await sleep(300);
    } else if (txt === "/tara") {
      await sendTG(buildScanMsg(ctx.signals || [], 0, null, true)); replied++; await sleep(300);
    } else if (txt === "/model") {
      await sendTG(await modelStatus(st)); replied++; await sleep(300);
    } else if (txt === "/takip") {
      await sendTG(await watchMsg(ctx.signals || [], !!ctx.bearRegime, st)); replied++; await sleep(300);
    } else if (txt.startsWith("/hisse")) {
      const sym = (raw.split(/\s+/)[1] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!sym) await sendTG("Kullanım: /hisse SEMBOL  (örn. /hisse THYAO)");
      else { const x = await ideaFor(sym, ctx.signals || [], !!ctx.bearRegime, st); await sendTG(`🔎 HİSSE ÖNERİSİ · ${fmtTime()}\n\n${x.text}\n\nKural: yalnız botun kalite filtrelerini geçen sinyal AL/SAT; diğerleri BEKLE + tetik seviyesi.\n⚠ Yatırım tavsiyesi değildir.`); }
      replied++; await sleep(300);
    } else if (txt.startsWith("/yorum")) {
      // Grok + X (Twitter) duyarlılığı — istek üzerine: /yorum ASELS
      const sym = (raw.split(/\s+/)[1] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!sym) await sendTG("Kullanım: /yorum SEMBOL  (örn. /yorum ASELS)");
      else if (!grokEnabled()) await sendTG(`🐦 ${sym}: Grok/X yorumu için XAI_API_KEY secret'ı gerekli.`);
      else {
        await sendTG(`🐦 ${sym} için X gönderileri Grok ile inceleniyor…`);
        const g = await grokXSentiment(sym);
        if (!g) await sendTG(`🐦 ${sym}: Grok/X yorumu alınamadı — ${grokLastError() || "geçici sorun"}`);
        else await sendTG(grokLine(sym, g));
      }
      replied++; await sleep(300);
    }
  }
  st.tgOffset = off;
  await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
  if (replied) console.log(`${replied} Telegram komutu yanıtlandı.`);
}

// PİYASA BAĞLAMI — main() ve portföy simülatörü AYNI kodu kullanır: rejim (XU100 < MA200 → savunma), genişlik (AL oranı),
// piyasa vol ölçeği, göreli güç (RS vs XU100 60g) + zayıf-RS AL elemesi (dip hariç), sektör gücü. Sinyaller yerinde
// zenginleşir (rs, secStrong); filtrelenmiş dizi döner.
function marketContext(signals, idxRows, xuNow, off = {}) {   // off.rs: yalnız sadeleştirme testi
  const idxRet60 = idxRows.length >= 60 ? (idxRows[idxRows.length - 1].close - idxRows[idxRows.length - 60].close) / idxRows[idxRows.length - 60].close * 100 : 0;
  const _xc = idxRows.map(r => r.close);
  const xuMA200 = _xc.length >= 200 ? _xc.slice(-200).reduce((a, b) => a + b, 0) / 200 : null;
  const bearRegime = !!(xuMA200 && xuNow && xuNow < xuMA200);
  const _al = signals.filter(s => s.signal === "AL").length, _sa = signals.filter(s => s.signal === "SAT").length;
  const breadth = (_al + _sa) ? _al / (_al + _sa) : 0.5;
  const _rr = [];
  for (let k = Math.max(1, _xc.length - 20); k < _xc.length; k++) _rr.push((_xc[k] - _xc[k - 1]) / _xc[k - 1]);
  const _m = _rr.reduce((a, b) => a + b, 0) / (_rr.length || 1), sd = Math.sqrt(_rr.reduce((a, b) => a + (b - _m) ** 2, 0) / (_rr.length || 1)) * Math.sqrt(252);
  const volScale = +Math.max(0.5, Math.min(1.3, sd > 0 ? 0.20 / sd : 1)).toFixed(2);
  for (const s of signals) s.rs = +((s.ret60 || 0) - idxRet60).toFixed(1);   // endekse göre fazla getiri
  const n0 = signals.length;
  if (!off.rs) signals = signals.filter(s => s.signal !== "AL" || s.dip || s.rs > -3);     // endeksten belirgin zayıf AL'ı ele (dip hariç)
  // Sektör gücü: ortalama RS'in medyan üstündeki sektörler "güçlü"
  const secRS = {}, secN = {};
  for (const s of signals) { const sec = sectorOf(s.sym); if (sec) { secRS[sec] = (secRS[sec] || 0) + s.rs; secN[sec] = (secN[sec] || 0) + 1; } }
  const secAvg = Object.fromEntries(Object.keys(secRS).map(k => [k, secRS[k] / secN[k]]));
  const _sv = Object.values(secAvg).sort((a, b) => b - a); const _med = _sv.length ? _sv[Math.floor(_sv.length / 2)] : 0;
  for (const s of signals) { const sec = sectorOf(s.sym); s.secStrong = !!(sec && secAvg[sec] != null && secAvg[sec] >= _med); s.leader = s.signal === "AL" && s.rs >= 5 && !!s.aboveMa50; }
  return { signals, bearRegime, breadth, volScale, idxRet60, xuMA200, sd, rsCut: n0 - signals.length };
}

// Bilanço (kazanç) açıklamasına kalan gün — hisse başına günde 1 MCP sorgusu (st.earnC önbelleği); hata → null (fail-safe)
async function earnDays(sym, st) {
  const d = new Date().toISOString().slice(0, 10);
  if (st) { if (!st.earnC || st.earnC.d !== d) st.earnC = { d, m: {} }; if (sym in st.earnC.m) return st.earnC.m[sym]; }
  let v = null;
  try { const e = await mcpCall("get_earnings", { symbol: sym, market: "bist" }); if (e?.next_earnings_date) { const n = Math.round((Date.parse(e.next_earnings_date) - Date.now()) / 864e5); if (n >= 0) v = n; } } catch {}
  if (st) st.earnC.m[sym] = v;
  return v;
}
const earnTag = n => n != null && n <= 3 ? ` · ⚠ bilanço ${n} gün` : "";

// ---------- TAKİP LİSTESİ (kullanıcının hisseleri) — her raporda AYRI mesaj + tetik geçilince ANINDA uyarı ----------
// Kural botun kendisi: yalnız kalite filtrelerini geçen canlı sinyal AL/SAT sayılır; diğerleri BEKLE + tetik/destek seviyeleri.
const WATCH = (process.env.WATCH || "AKSEN,ALARK,ASTOR,EUPWR,KCHOL,TRMET,XBANK,YEOTK").split(",").map(s => s.trim().toUpperCase()).filter(Boolean).sort();   // alfabetik; XBANK = bankacılık endeksi
let _wCache = null;   // bir çalışmada tek hesap (uyarı + rapor aynı veriyi kullanır)
// TEK HİSSE trade önerisi (takip listesi + /hisse komutu). Kural botun kendisi: kalite filtreli canlı sinyal AL/SAT, değilse BEKLE + tetik.
async function ideaFor(sym, signals, bearRegime, st) {
  try {
    const d = await fetchDaily(sym); if (d.length < 60) return { sym, text: `${sym}: veri alınamadı (sembol doğru mu? BIST kodu yazın, örn. THYAO)` };
    const w = await fetchWeekly(sym), ed = enrichData(d), e = ed[ed.length - 1], k = getSignals(ed, getHigherTrend(w), w);
    const j = d.length - 1, c = d[j].close, chg = j > 0 ? (c / d[j - 1].close - 1) * 100 : null, prev = d.slice(Math.max(0, j - 20), j), hi20 = Math.max(...prev.map(b => b.high)), lo20 = Math.min(...prev.map(b => b.low));
    const ma20 = d.slice(Math.max(0, j - 19), j + 1).reduce((x, b) => x + b.close, 0) / Math.min(20, j + 1), live = signals.find(s => s.sym === sym);
    const trend = e.ma50 && e.ma200 ? (c > e.ma50 && e.ma50 > e.ma200 ? "yükseliş" : c < e.ma50 && e.ma50 < e.ma200 ? "düşüş" : "yatay/karışık") : "belirsiz";
    let head, plan, trig = null, mark;   // trig: { t: tür, hit: geçildi mi, text }
    const why = k && k.final !== "NÖTR" ? ` (motor ${k.final} %${k.confidence}, kalite filtresini geçmedi)` : "";
    if (live?.signal === "AL") { mark = "🟢"; head = `🟢 AL (bot sinyali · güven %${live.confidence})`; plan = `Giriş ~${c}₺ · stop ${live.stopLoss} · hedef ${live.target1}${bearRegime && !live.dip ? " · ⚠ düşüş rejimi: AI TRADER yalnız dip alıyor, küçük pozisyon" : ""}`; }
    else if (live?.signal === "SAT") { mark = "🔴"; head = `🔴 SAT (bot sinyali · güven %${live.confidence})`; plan = `Elde varsa çık/azalt, yeni alım yok. İlk dönüş teyidi: MA20 ${ma20.toFixed(2)}₺ üstü kapanış (güçlü teyit ${hi20}₺).`; trig = { t: "ma20", hit: c > ma20, text: `MA20 ${ma20.toFixed(2)}₺ üstüne çıktı (SAT'tan ilk dönüş teyidi)` }; }
    else if (trend === "düşüş" && e.ma50) { mark = "⚪"; head = `⚪ BEKLE${why}`; plan = `Düşüş trendinde alım yok; önce MA50 ${e.ma50.toFixed(2)}₺ üstü kapanış gerekir. Destek 20g dip ${lo20}₺.`; trig = { t: "ma50", hit: c > e.ma50, text: `MA50 ${e.ma50.toFixed(2)}₺ üstüne çıktı (düşüş trendinden çıkış denemesi)` }; }
    else { mark = "⚪"; head = `⚪ BEKLE${why}`; plan = `Alım tetiği: ${hi20}₺ üstü hacimli kapanış · destek MA20 ${ma20.toFixed(2)}₺ / 20g dip ${lo20}₺.`; trig = { t: "hi20", hit: c > hi20, text: `20g zirve ${hi20}₺ üstüne çıktı (alım tetiği)` }; }
    const en = await earnDays(sym, st);
    // SADE SEVİYELER (AL/SAT mesajıyla aynı kural: stop 2×ATR, hedef 2R). BEKLE'de giriş = alım tetiği.
    let tr = 0; for (let q = j - 13; q <= j; q++) tr += Math.max(d[q].high - d[q].low, Math.abs(d[q].high - d[q - 1].close), Math.abs(d[q].low - d[q - 1].close));
    const atr = tr / 14, r2 = v => +v.toFixed(2);
    let lvl;
    if (live?.signal === "AL" || live?.signal === "SAT") { const l = lv(live); lvl = `giriş ${c}₺ · hedef ${l.tgt}₺ · stop ${l.stop}₺${live.signal === "SAT" ? " (elde varsa çık)" : ""}`; }
    else { const g = trig?.t === "ma20" ? ma20 : trig?.t === "ma50" ? e.ma50 : hi20, dd = atr > 0 ? 2 * atr : g * 0.03; lvl = `alım tetiği ${r2(g)}₺ → hedef ${r2(g + 2 * dd)}₺ · stop ${r2(g - dd)}₺ (tetik gelmeden alma)`; }
    // ⚡ kısa vade durumu (gün sonu ölçümlü listeler)
    // KISA VADE YÖNÜ (yalnız ölçülmüş kurallar; 3 günlük ufuk): ↗ dönüş günü toparlanan / güçlü kapanış · ↘ sert düşüş · → sinyal yok
    const K = await shortTermC(), kv = !K ? "→ veri yok" : K.weakSet.has(sym) ? "↘ zayıf (gün ≤−%4, düşüş sürebilir)"
      : K.rev && K.top.some(x => x.sym === sym) ? "↗ dönüş günü güçlü toparlanan" : K.strong.some(x => x.sym === sym) ? "↗ güçlü kapanış" : "→ belirgin kısa vade sinyali yok";
    const isIdx = /^X(BANK|U\d{3}|USIN|UMAL|UHIZ|ELKT|ILTM|GIDA|HOLD|TEKS|KMYA|METL|ULAS|TRZM|SGRT|SPOR)$/.test(sym);   // endeks: puan, ₺ değil
    const out_ = { sym, c, chg, trig, mark, text: `${mark} ${sym} ${c}₺ (${chg == null ? "?" : (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%"}) — ${head.split(" (")[0].replace(/^\S+ /, "")}${earnTag(en)}\n   Kısa vade: ${kv}\n   ${lvl}${trend === "düşüş" && !live ? " · ana trend düşüş" : ""}` };
    if (isIdx) out_.text = out_.text.replace(/₺/g, "");
    return out_;
  } catch (err) { return { sym, text: `${sym}: hata (${err.message})` }; }
}
async function watchEval(signals, bearRegime, st) {
  if (_wCache) return _wCache;
  const out = []; for (const sym of WATCH) out.push(await ideaFor(sym, signals, bearRegime, st));
  return (_wCache = out);
}
async function watchMsg(signals, bearRegime, st) {
  const w = await watchEval(signals, bearRegime, st);
  return `🎯 TAKİP LİSTESİ · ${fmtTime()}\n\n` + w.map(x => x.text).join("\n\n") + "\n\n⚠ Yatırım tavsiyesi değildir.";
}
// TETİK UYARISI: tetik seviyesi ALTINDAN ÜSTÜNE geçince (önceki taramada altındaydı) anında; hisse başına günde 1.
async function watchAlerts(signals, bearRegime, st) {
  const d = new Date().toISOString().slice(0, 10), w = await watchEval(signals, bearRegime, st);
  if (!st.watchHit || st.watchHit.d !== d) st.watchHit = { d, s: [] };
  st.watchPrev = st.watchPrev || {};
  const hits = [];
  for (const x of w) {
    if (!x.trig) continue;
    const before = st.watchPrev[x.sym];
    if (x.trig.hit && before === x.trig.t + ":0" && !st.watchHit.s.includes(x.sym)) { hits.push(x); st.watchHit.s.push(x.sym); }
    st.watchPrev[x.sym] = x.trig.t + ":" + (x.trig.hit ? 1 : 0);
  }
  if (!hits.length) return 0;
  await sendTG(`🎯 TETİK — takip listesi · ${fmtTime()}\n` + hits.map(x => `${x.sym} @${x.c}₺: ${x.trig.text}`).join("\n") + "\n\nGün içi fiyat; teyit için kapanışı bekle.\n⚠ Yatırım tavsiyesi değildir.");
  return 1;
}

// ---------- MODEL PORTFÖY (aylık + 3 aylık) — Pazartesi 08:00 (workflow), kaçarsa haftanın ilk seans raporunda ----------
async function mpData() {
  const data = {};
  for (let i = 0; i < syms.length; i += CONC) await Promise.all(syms.slice(i, i + CONC).map(async s => { data[s] = await fetchDaily(s).catch(() => []); }));
  const idx = await fetchDaily("XU100").catch(() => []);
  return idx.length < 200 ? null : { m: buildModels(data, idx), data, idx };
}
// st verilirse: geçen haftanın modelinin GERÇEK getirisi (stop yiyen stop fiyatından) + birikimli, XU100'e karşı; yeni model st.mp'ye yazılır
async function mpSend(st = null) {
  const r = await mpData();
  if (!r) { console.error("Model portföy: XU100 verisi yok"); return false; }
  const { m, data, idx } = r, wk = weekKey(Date.now()), f = v => v == null ? "?" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  let perf = "";
  if (st?.mp?.monthly && st.mp.wk !== wk) {
    const ret = (list, kind) => { const rr = list.map(x => { const ex = st.mp.stopped?.[kind + ":" + x.sym] ?? data[x.sym]?.at(-1)?.close; return ex ? (ex / x.price - 1) * 100 : null; }).filter(v => v != null); return rr.length ? rr.reduce((a, b) => a + b, 0) / rr.length : null; };
    const h = { wk: st.mp.wk, m: ret(st.mp.monthly, "m"), q: ret(st.mp.quarterly, "q"), x: st.mp.xu ? (idx.at(-1).close / st.mp.xu - 1) * 100 : null };
    st.mpHist = (st.mpHist || []).concat([h]).slice(-52);
    const cum = k => (st.mpHist.reduce((a, y) => a * (1 + (y[k] || 0) / 100), 1) - 1) * 100;
    perf = `📈 Geçen haftanın modeli (${st.mp.date} → bugün, stop yiyen stop fiyatından): aylık ${f(h.m)} · 3 aylık ${f(h.q)} · XU100 ${f(h.x)}\nBirikimli (${st.mpHist.length} hafta): aylık ${f(cum("m"))} · 3 aylık ${f(cum("q"))} · XU100 ${f(cum("x"))}`;
  }
  const all = [...m.monthly, ...m.quarterly];
  const ens = await Promise.all([...new Set(all.map(x => x.sym))].map(async s => [s, await earnDays(s, st)]));
  const em = Object.fromEntries(ens); for (const x of all) x.earn = em[x.sym];
  const ok = await sendTG(modelMsg(m, fmtTime(), perf));
  if (ok && st) st.mp = { wk, date: new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }), xu: idx.at(-1).close, stopped: {},
    monthly: m.monthly.map(({ sym, price, stop }) => ({ sym, price, stop })), quarterly: m.quarterly.map(({ sym, price, stop }) => ({ sym, price, stop })) };
  return ok;
}
// MODEL STOP UYARISI: kapanışa yakın (17:30+) stop altındaki model hissesi → anında "modelden çık" (portföy başına bir kez)
async function mpStops(st) {
  if (!st.mp?.monthly) return 0;
  st.mp.stopped = st.mp.stopped || {};
  const hits = [], px = {};
  for (const [kind, list, name] of [["m", st.mp.monthly, "aylık"], ["q", st.mp.quarterly || [], "3 aylık"]]) for (const x of list) {
    if ((kind + ":" + x.sym) in st.mp.stopped) continue;
    if (!(x.sym in px)) px[x.sym] = (await fetchDaily(x.sym).catch(() => [])).at(-1)?.close ?? null;
    const c = px[x.sym]; if (c && c < x.stop) { st.mp.stopped[kind + ":" + x.sym] = c; hits.push(`${x.sym} @${c}₺ < stop ${x.stop} (${name} model)`); }
  }
  if (!hits.length) return 0;
  await sendTG(`🛑 MODEL PORTFÖY STOP · ${fmtTime()}\n` + hits.join("\n") + "\n\nStop altında → modelden çık (haftalık performansa bu fiyattan yazılır).\n⚠ Yatırım tavsiyesi değildir.");
  return 1;
}
// ---------- ⚡ KISA VADE KATMANI (1–3 gün) — 2026-11-28 ölçümü (2 yıl saatlik → günlük; giriş gün kapanışı; getiri − aynı gün tüm likit hisseler) ----------
//  ENDEKS DÖNÜŞ GÜNÜ (XU100 gün içi dünkü kapanışın ≤%1 altına iner, kapanışı üstünde): dipten en çok toparlanan 10 hisse → 1g +%0.83, 3g +%1.48
//    (yarılar +1.49/+1.47; yalnız 18 gün → küçük örnek). Ertesi gün XU100 ort +%0.45 (normal gün +%0.03), %56 yükseliyor.
//  GÜÇLÜ KAPANIŞ (gün ≥+%4, kapanış gün aralığının üst %20'si, hacim ≥1.5×): 1g +%0.37, 3g +%0.39 (yarılar +0.44/+0.34, n=2183).
//  SERT DÜŞÜŞ (gün ≤−%4): 1g −%0.67, 3g −%1.25 (yarılar −0.95/−1.44) → kısa vadede zayıflık SÜRÜYOR, "dipten al" yanlış.
//  Ölçülüp REDDEDİLENLER (şans düzeyi): saatlik RSI dönüşü, gün içi −%2→dünkü kapanış üstü, 3g −%5→EMA20 geri alma.
// Saf çekirdek (canlı shortTerm + portföy simülatörü AYNI kod): data = { SYM: günlük mumlar (son mum = değerlendirilen gün) }, x = XU100 günlük
function shortCore(data, x) {
  if (!x || x.length < 2) return null;
  const xt = x.at(-1), xp = x.at(-2).close, rows = [];
  for (const [s, a] of Object.entries(data)) {
    const j = a.length - 1; if (j < 21 || istDayOf(a[j].ts) !== istDayOf(xt.ts)) continue;   // o gün işlem görmeyen hisse yok sayılır
    const t = a[j], pc = a[j - 1].close, v20 = a.slice(j - 20, j).reduce((p, b) => p + (b.volume || 0), 0) / 20; if (!pc || v20 * t.close < 5e6) continue;
    let tr = 0; for (let k = j - 13; k <= j; k++) tr += Math.max(a[k].high - a[k].low, Math.abs(a[k].high - a[k - 1].close), Math.abs(a[k].low - a[k - 1].close));
    rows.push({ sym: s, c: t.close, dr: (t.close / pc - 1) * 100, pos: t.high > t.low ? (t.close - t.low) / (t.high - t.low) : 0.5, vr: v20 ? (t.volume || 0) / v20 : 0, rec: (t.close - t.low) / pc * 100, atr: tr / 14, avgVol: v20 });
  }
  return { day: istDayOf(xt.ts), rev: xt.low <= xp * 0.99 && xt.close > xp, xDay: (xt.close / xp - 1) * 100, xLow: (xt.low / xp - 1) * 100,
    top: [...rows].sort((p, q) => q.rec - p.rec).slice(0, 10), strong: rows.filter(r => r.dr >= 4 && r.pos >= 0.8 && r.vr >= 1.5).sort((p, q) => q.dr - p.dr).slice(0, 10),
    weak: rows.filter(r => r.dr <= -4).sort((p, q) => p.dr - q.dr).slice(0, 10), weakSet: new Set(rows.filter(r => r.dr <= -4).map(r => r.sym)) };
}
let _stCache;   // bir çalışmada tek hesap (takip listesi + dönüş uyarısı + gün sonu aynı veriyi kullanır)
const shortTermC = async () => _stCache !== undefined ? _stCache : (_stCache = await shortTerm().catch(() => null));
async function shortTerm() {
  const data = {};
  for (let i = 0; i < syms.length; i += CONC) await Promise.all(syms.slice(i, i + CONC).map(async s => { data[s] = await fetchDaily(s).catch(() => []); }));
  return shortCore(data, await fetchDaily("XU100").catch(() => []));
}
const istDayOf = ts => new Date(ts + 3 * 3600e3).toISOString().slice(0, 10);
const stLine = r => `${r.sym} ${r.c}₺ ${pct(r.dr)}${r.rec != null ? ` · dipten +%${r.rec.toFixed(1)}` : ""}`;
function shortTermMsg(k, final) {
  let m = `⚡ KISA VADE (1–3 gün)${final ? " — gün sonu" : ""}`;
  if (k.rev) m += `\n🔄 ENDEKS DÖNÜŞ GÜNÜ: XU100 gün içi ${pct(k.xLow)} → ${pct(k.xDay)}\n   Dipten en çok toparlananlar (ölçüm: 3 günde piyasayı ort. +%1.5 geçti; 18 gün, küçük örnek):\n   ` + k.top.map(stLine).join("\n   ")
    + `\n   Ertesi gün XU100 ölçümü: ort +%0.45, %56 yükseliş.`;
  m += `\n🚀 Güçlü kapanış (gün ≥+%4, tepeye yakın, hacimli; 3g piyasaya +%0.4): ` + (k.strong.length ? "\n   " + k.strong.map(r => `${r.sym} ${r.c}₺ ${pct(r.dr)}`).join("\n   ") : "bugün yok");
  m += `\n🧊 Uzak dur (gün ≤−%4; 3g piyasaya −%1.3, dipten alma): ` + (k.weak.length ? k.weak.map(r => `${r.sym} ${pct(r.dr)}`).join(", ") : "bugün yok");
  return m;
}

// Model portföyün güncel durumu (kayıt anından beri ve bugün), stop yiyen stop fiyatından — /model ve gün sonu özeti
const pct = v => v == null || !isFinite(v) ? "?" : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
async function mpPerf(st) {
  if (!st?.mp?.monthly) return null;
  const all = [...new Set([...st.mp.monthly, ...(st.mp.quarterly || [])].map(x => x.sym))];
  const D2 = Object.fromEntries(await Promise.all(all.map(async s => [s, (await fetchDaily(s).catch(() => [])).slice(-2)])));
  const avg = v => v.length ? v.reduce((p, q) => p + q, 0) / v.length : null;
  const calc = (list, k) => { const since = [], day = [], rows = [];
    for (const x of list) { const b = D2[x.sym] || [], cur = b.at(-1)?.close ?? null, stp = st.mp.stopped?.[k + ":" + x.sym];
      const r = stp != null ? (stp / x.price - 1) * 100 : cur ? (cur / x.price - 1) * 100 : null;
      if (r != null) since.push(r); if (stp == null && cur && b.length > 1) day.push((cur / b[0].close - 1) * 100);
      rows.push(`${x.sym} ${x.price}→${stp ?? cur ?? "?"}₺ ${pct(r)}${stp != null ? " 🛑" : ""}`); }
    return { since: avg(since), day: avg(day), rows }; };
  const xu = await fetchDaily("XU100").catch(() => []);
  return { m: calc(st.mp.monthly, "m"), q: calc(st.mp.quarterly || [], "q"), xSince: st.mp.xu && xu.length ? (xu.at(-1).close / st.mp.xu - 1) * 100 : null, xDay: xu.length > 1 ? (xu.at(-1).close / xu.at(-2).close - 1) * 100 : null, xu: xu.at(-1)?.close ?? null };
}
async function modelStatus(st) {
  const p = await mpPerf(st);
  if (!p) return "💼 Henüz kayıtlı model portföy yok — her Pazartesi 08:00'de gelir.";
  return `💼 MODEL PORTFÖY — ${st.mp.date} tarihinden beri (stop yiyen 🛑 stop fiyatından)\n${fmtTime()}\n\n🗓 AYLIK: ${pct(p.m.since)} (bugün ${pct(p.m.day)})\n` + p.m.rows.join("\n")
    + `\n\n📆 3 AYLIK: ${pct(p.q.since)} (bugün ${pct(p.q.day)})\n` + p.q.rows.join("\n") + `\n\n🏛 XU100 aynı dönem ${pct(p.xSince)} · bugün ${pct(p.xDay)}\n⚠ Yatırım tavsiyesi değildir.`;
}
// GÜN SONU ÖZETİ (seans bitince ~18:20; Yahoo BIST verisi ~15 dk gecikmeli → kapanış fiyatı oturmuş olsun)
async function daySummary(st) {
  const today = new Date().toISOString().slice(0, 10), istD = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  const eq = st.cash + Object.values(st.pos || {}).reduce((a, p) => a + p.lot * (p.last || p.entry), 0);
  const dp = st.dayKey === today && st.dayStart ? (eq / st.dayStart - 1) * 100 : null;
  const closed = (st.trades || []).filter(t => t.close === today), opened = Object.entries(st.pos || {}).filter(([, p]) => p.date === today);
  let m = `🌇 GÜN SONU ÖZETİ\n${fmtTime()}\n\n📊 AI TRADER: ${Math.round(eq).toLocaleString("tr-TR")}₺ · bugün ${pct(dp)} · başlangıçtan ${pct((eq / st.start - 1) * 100)} · açık ${Object.keys(st.pos || {}).length} poz`;
  m += `\n   Bugün açılan (${opened.length}): ${opened.map(([s, p]) => `${s} @${p.entry}`).join(", ") || "-"}`;
  m += `\n   Bugün kapanan (${closed.length}): ${closed.map(t => `${t.sym} ${pct(t.pnlPct)} ${t.reason}`).join(", ") || "-"}`;
  const p = await mpPerf(st);
  if (p) m += `\n\n🏛 XU100 ${p.xu ?? "?"} · bugün ${pct(p.xDay)}\n💼 Model portföy (${st.mp.date} tarihinden beri): aylık ${pct(p.m.since)} (bugün ${pct(p.m.day)}) · 3 aylık ${pct(p.q.since)} (bugün ${pct(p.q.day)}) · XU100 ${pct(p.xSince)}`;
  else { const xu = await fetchDaily("XU100").catch(() => []); m += `\n\n🏛 XU100 ${xu.at(-1)?.close ?? "?"} · bugün ${pct(xu.length > 1 ? (xu.at(-1).close / xu.at(-2).close - 1) * 100 : null)}`; }
  const sig = Object.entries(st.lastScan?.w || {}).map(([sym, v]) => ({ sym, ...v }));
  const w = await watchEval(sig, false, st);
  m += `\n\n🎯 Takip: ` + w.map(x => `${x.mark || ""}${x.sym} ${x.c ?? "?"}₺ ${pct(x.chg)}`).join(" · ");
  const ls = st.lastScan, alNew = st.alSeen?.d === istD ? st.alSeen.s : [];
  if (ls) m += `\n\n🦅 Son tarama: ${ls.al.length} AL · ${ls.sat.length} SAT${ls.al.length ? `\n   AL: ${ls.al.join(", ")}` : ""}`;
  m += `\n   Bugün ilk kez AL olan: ${alNew.join(", ") || "yok"}`;
  try { const k = await shortTermC(); if (k) m += "\n\n" + shortTermMsg(k, true); } catch (e) { console.error("Kısa vade:", e.message); }
  return m + "\n\n⚠ Yatırım tavsiyesi değildir.";
}
async function runSummaryMode() {
  const st = await gistGet(PAPER_FILE, null), istD = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  if (!st || st === READ_FAILED || typeof st.cash !== "number") { console.error("Gün sonu: gist okunamadı"); return; }
  if (st.lastSummaryDay === istD && process.env.MODE !== "summary") { console.log("Gün sonu özeti bugün zaten gönderildi."); return; }
  const ok = await sendTG(await daySummary(st));
  if (ok) { st.lastSummaryDay = istD; await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } }); }
  console.log(`Gün sonu özeti ${ok ? "gönderildi" : "GÖNDERİLEMEDİ"}`);
}
const HELP = "🤖 KOMUTLAR\n/durum — AI TRADER anlık\n/performans — işlem istatistiği\n/model — model portföy ve getirisi\n/takip — takip listesi (AKSEN, ALARK, ASTOR, EUPWR, KCHOL, TRMET, XBANK, YEOTK)\n/hisse SEMBOL — herhangi bir hisse için trade önerisi (örn. /hisse THYAO)\n/tara — tüm AL/SAT listesi (giriş · hedef · stop)\n/yorum SEMBOL — Grok ile X (Twitter) duyarlılığı\n/aitest — AI anahtar testi\n\nNot: bot seansta 15 dk'da bir çalışır → cevap en geç ~15 dk içinde; seans dışında bir sonraki çalışmada.";
async function runPortfolioMode() {
  const st0 = await gistGet(PAPER_FILE, null), st = (st0 && st0 !== READ_FAILED && typeof st0.cash === "number" && st0.pos) ? st0 : null;
  const ok = await mpSend(st);
  if (ok && st) { st.lastMPWeek = weekKey(Date.now()); await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } }); }
  console.log(`Model portföy ${ok ? "gönderildi" : "GÖNDERİLEMEDİ"} (hafta ${weekKey(Date.now())})`);
}

// ---------- Ana ----------
async function main() {
  if (process.env.EAGLE_MODE === "portfolio") return runPortfolioMode();
  if (process.env.EAGLE_MODE === "summary") return runSummaryMode();
  const t0 = Date.now();
  console.log("Tarama başlıyor:", syms.length, "sembol");
  let signals = await scanAll();
  console.log(`Tarama bitti ${((Date.now() - t0) / 1e3).toFixed(1)}s · ${signals.length} sinyal (${signals.filter(s => s.signal === "AL").length} AL, ${signals.filter(s => s.signal === "SAT").length} SAT)`);

  const xuNow = await fetchIndexClose("XU100").catch(() => null);  // endeks (XU100) anlık

  // ---------- GÖRELİ GÜÇ (RS vs XU100) + SEKTÖR LİDERLİĞİ + PİYASA REJİMİ ----------
  const idxRows = await fetchDaily("XU100").catch(() => []);
  const mc = marketContext(signals, idxRows, xuNow);
  signals = mc.signals;
  const { bearRegime, breadth, volScale } = mc;
  console.log(`Rejim: XU100 ${xuNow ?? "?"} vs MA200 ${mc.xuMA200 ? mc.xuMA200.toFixed(0) : "?"} → ${bearRegime ? "DÜŞÜŞ (savunma)" : "NORMAL"}`);
  console.log(`Genişlik(AL%): ${(breadth * 100).toFixed(0)} · piyasa vol %${(mc.sd * 100).toFixed(0)} → risk ölçeği ${volScale}`);
  console.log(`Göreli güç: XU100 60g %${mc.idxRet60.toFixed(1)} · zayıf-RS elenen AL: ${mc.rsCut}`);

  // ---------- HABER-DUYARLI SİNYAL: haberin etkisine göre güveni ayarla ----------
  let news = [];
  try { news = await fetchNews(); } catch (e) { console.error("Haber çekme:", e.message); }
  const newsScores = {};   // sembol -> toplam haber etki skoru
  for (const it of news) {
    try {
      const r = analyzeNewsImpact(it.title || "", it.desc || "");
      // r.all = etkilenen HİSSELERİN HEPSİ (r.affected görüntüleme için ilk 6 → sektör haberi keyfi 6 hisseye gidiyordu)
      for (const [sym, sc] of (r.all || r.affected || [])) newsScores[sym] = (newsScores[sym] || 0) + sc;
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
    st = await runPaper(signals, xuNow, bearRegime, null, { breadth, volScale, idxRet60: mc.idxRet60 });
  } else {
    console.log("⚠ Gist yok — AI TRADER atlandı (state kalıcı olmadan paper trading her çalışmada sıfırlanır). GH_GIST_TOKEN + GIST_ID secret'larını ekle.");
  }

  // Telegram komutlarına cevap ver (/durum, /pozisyonlar) — her run
  if (st) await handleCommands(st, { signals, bearRegime });

  // ---------- RAPOR: 30 dk'da bir (tarama 15 dk'da bir; yeni AL ayrıca ANINDA) ----------
  const istHour = +new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", hour: "2-digit", hour12: false });
  const istMin = +new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", minute: "2-digit" });
  const slot = istHour * 2 + (istMin >= 30 ? 1 : 0);   // yarım saat dilimi
  const istDay = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });   // YYYY-MM-DD (İstanbul)
  // manual = elle "Run workflow" (her seferinde rapor). Döngü koşusu (EAGLE_MODE=loop) workflow_dispatch olsa da saatlik raporlar.
  const manual = (process.env.EAGLE_MODE || (process.env.GITHUB_EVENT_NAME === "workflow_dispatch" ? "manual" : "")) === "manual";
  // Anahtar GÜN + yarım saat dilimi (dünün son dilimi sabahın raporunu yutmasın). State yoksa (gist erişilemiyor) her taramada
  // mesaj yerine yaklaşık 30 dk'da bir: yalnız dilimin ilk 15 dk'sındaki tarama.
  const doReport = manual || (st ? (st.lastReportSlot !== slot || st.lastReportDay !== istDay) : (istMin % 30) < 15);
  let sent = 0;
  // YENİ AL → rapor beklemeden ANINDA bildir (hisse başına günde 1 kez). Rapor taramasında ayrı mesaj atılmaz, HİSSE TARA'da 🆕.
  let newSet = null, dirty = false;
  if (st) {
    if (!st.alSeen || st.alSeen.d !== istDay) st.alSeen = { d: istDay, s: [] };
    const seen = new Set(st.alSeen.s), fresh = signals.filter(s => s.signal === "AL" && !seen.has(s.sym));
    if (fresh.length) {
      newSet = new Set(fresh.map(s => s.sym)); st.alSeen.s.push(...newSet);
      if (!doReport && isTradingHours()) { await sendTG(`🔔 YENİ AL SİNYALİ · ${fmtTime()}\n` + fresh.map(sigLine).join("\n") + "\n\n⚠ Yatırım tavsiyesi değildir."); sent++; }
      dirty = true;
    }
  }
  // Son taramanın özeti (gün sonu özeti için): AL/SAT listeleri + takip hisselerinin canlı sinyali
  if (st) { st.lastScan = { t: Date.now(), al: signals.filter(s => s.signal === "AL").map(s => s.sym), sat: signals.filter(s => s.signal === "SAT").map(s => s.sym), w: Object.fromEntries(signals.filter(s => WATCH.includes(s.sym)).map(s => [s.sym, { signal: s.signal, confidence: s.confidence, stopLoss: s.stopLoss, target1: s.target1, dip: s.dip }])) }; dirty = true; }
  // ANINDA UYARILAR (seans içinde her tarama): takip listesi tetiği + kapanışa yakın model portföy stop'u
  if (st && isTradingHours()) {
    try { sent += await watchAlerts(signals, bearRegime, st); dirty = true; } catch (e) { console.error("Tetik uyarısı:", e.message); }
    // 🔄 ENDEKS DÖNÜŞÜ (gün içi, günde 1): XU100 bugün dünkü kapanışın ≤%1 altına indi ve şimdi üstünde → anında + o anki en çok toparlananlar
    try {
      const xt = idxRows.at(-1), xp = idxRows.at(-2)?.close;
      if (xt && xp && istDayOf(xt.ts) === istDay && st.revDay !== istDay && xt.low <= xp * 0.99 && xt.close > xp) {
        const k = await shortTermC();
        if (k?.rev) { await sendTG(`🔄 ENDEKS DÖNÜŞÜ (gün içi) · ${fmtTime()}\n` + shortTermMsg(k, false) + "\n\nGün içi fiyat (~15 dk gecikmeli); kesin liste gün sonu özetinde.\n⚠ Yatırım tavsiyesi değildir."); st.revDay = istDay; sent++; dirty = true; }
      }
    } catch (e) { console.error("Endeks dönüşü:", e.message); }
    // 17:30 sonrası HER taramada (kapanışa en yakın fiyat); uyarılan hisse st.mp.stopped'da → tekrar yok
    if (istHour * 60 + istMin >= 1050) { try { sent += await mpStops(st); dirty = true; } catch (e) { console.error("Model stop:", e.message); } }
  }
  if (st && dirty && !doReport) await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });   // rapor taramasında aşağıda kaydedilir

  if (doReport) {
    // 1) HİSSE TARA — TÜM AL/SAT (en güçlü 15 ayrıntılı + kalanı kısa liste)
    await sendTG(buildScanMsg(signals, gistErr, newSet)); sent++;
    // 1b) TAKİP LİSTESİ — kullanıcının hisseleri için ayrı trade önerisi mesajı (her raporda)
    try { await sendTG(await watchMsg(signals, bearRegime, st)); sent++; } catch (e) { console.error("Takip listesi:", e.message); }

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
      m2 += `\n🆕 Son rapordan beri: ${ho.length ? ho.length + " yeni pozisyon açıldı" : "yeni pozisyon açılmadı"}`;
      if (ho.length) m2 += "\n" + ho.join("\n");
      if (hc.length) m2 += `\n\n✅ Son rapordan beri ${hc.length} kapanış:\n` + hc.join("\n");
      m2 += `\n\n📌 Açık pozisyonlar (${openLines.length}/5) — açılıştan beri K/Z:\n` + (openLines.join("\n") || "yok");
      m2 += `\n\n💼 Değer: ${Math.round(eq).toLocaleString("tr-TR")}₺ · Nakit: ${Math.round(st.cash).toLocaleString("tr-TR")}₺`;
      m2 += `\n📈 Toplam getiri: ${portRet >= 0 ? "+" : ""}${portRet.toFixed(2)}%`;
      if (idxRet != null) {
        m2 += `\n🏛 XU100: ${idxRet >= 0 ? "+" : ""}${idxRet.toFixed(2)}%`;
        m2 += `\n⚖️ Endekse relatif: ${rel >= 0 ? "+" : ""}${rel.toFixed(2)}% ${rel >= 0 ? "✅ üstünde" : "🔻 altında"}`;
      }
      m2 += `\n🌐 Rejim: ${bearRegime ? "DÜŞÜŞ — savunma" : "NORMAL"} · genişlik %${Math.round(breadth * 100)} · risk ölçeği ${volScale}${st.eqRisk < 1 ? " · 🛡 kısık (eq MA20 altı)" : ""}`;
      const ss = setupStats(st.trades);
      if (Object.keys(ss).length) m2 += "\n🧪 Kurulum (kazanan/toplam): " + Object.entries(ss).map(([k, v]) => `${k} ${v.w}/${v.n}${v.pnl ? ` (${v.pnl >= 0 ? "+" : ""}${Math.round(v.pnl)}₺)` : ""}`).join(" · ");
      const pz = Object.entries(setupPauses(st.trades, st.dayKey));   // neden işlem açılmıyor? → görünür olsun
      if (pz.length) m2 += "\n⏸ Durdurulan kurulum: " + pz.map(([k, v]) => `${k} (son 10 işlem ${v.pnl10}₺ · ${v.daysLeft} gün sonra küçük riskle yeniden denenir)`).join(" · ");
      await sendTG(m2); sent++; await sleep(400);
      // Günde 1 kez performans özeti (beklenti/drawdown/Sharpe/kurulum)
      if (st.lastPerfDay !== st.dayKey && (st.trades || []).length) { await sendTG(perfReport(st)); sent++; st.lastPerfDay = st.dayKey; await sleep(400); }
      // GÜNLÜK AI YORUM — Gemini sentezi + Grok/X duyarlılığı (günde 1; maliyet tavanı)
      const ai = await aiDaily(st, signals, bearRegime);
      if (ai) { await sendTG(ai); sent++; await sleep(400); }
      // raporu kaydet: bu saati işaretle, saatlik birikimi sıfırla
      // POZİSYON TARAMA (1-2 ay · Stage-2) — SADECE BİLGİ, AI TRADER'a/işlemlere ETKİSİ YOK; günde 1
      if (st.lastPosDay !== st.dayKey) {
        st.lastPosDay = st.dayKey;   // başarısız olsa da bugün tekrar deneme (~195 fetch → tek/gün)
        try {
          const pos = await positionScan(syms, idxRows);
          // EN AZ 5 HİSSE (kullanıcı isteği): Stage-2 adayı 5'ten azsa aylık model portföyün ölçülmüş sırasıyla tamamla
          // (düşük oynaklık + MA200 üstü + endeksten güçlü → endeksten en güçlü).
          let fill = [];
          if (pos.length < 5) { const m = await mpData().catch(() => null); if (m) fill = m.monthly.filter(x => !pos.some(p => p.sym === x.sym)).slice(0, 5 - pos.length); }
          if (pos.length || fill.length) {
            const n = pos.length + fill.length;
            let mp = `📅 TUTUŞ LİSTESİ — haftalık (~5 gün) & aylık (~1 ay) — ${n} hisse${pos.length > 12 ? ", en güçlü 12 ayrıntılı" : ""}\n${fmtTime()}\n\n`
              + pos.slice(0, 12).map(p => `${p.sym} @${p.price}₺ · Stage-2 · skor ${p.score} · RS6a ${p.rs >= 0 ? "+" : ""}${p.rs} · ADX ${p.adx} · RSI ${p.rsi}${p.obvUp ? " · OBV↑" : ""} · stop ${p.stop}`).join("\n")
              + (pos.length > 12 ? `\n➕ Diğer ${pos.length - 12}: ` + pos.slice(12).map(p => p.sym).sort().join(", ") : "")   // sessiz kesim yok
              + (fill.length ? (pos.length ? "\n" : "") + fill.map(x => `${x.sym} @${x.price}₺ · ${x.tag} · RS6a ${x.rs >= 0 ? "+" : ""}${x.rs}${x.vol != null ? ` · oynaklık %${x.vol}` : ""} · stop ${x.stop}`).join("\n")
                + `\n(Stage-2 adayı ${pos.length} → en az 5 için aylık model sırasıyla tamamlandı)` : "");
            mp += `\n\n📏 Ölçüm (son 12 ay, 2026-11, bot/hold-backtest.mjs): bu listedeki hisseler piyasayı 5 günde ort. +%0.9, 21 günde +%2.3 geçti (iki yarıda da pozitif). Ayrı haftalık kurallar (geri çekilme, kırılım) piyasayı geçmedi → haftalık ve aylık için en iyi aday bu liste.`;
            mp += `\n\n⚠ Sadece bilgi · AI TRADER bunları İŞLEME ALMAZ.`;
            await sendTG(mp); sent++; await sleep(400);
          }
        } catch (e) { console.error("Pozisyon tarama:", e.message); }
      }
      // ENDEKS TARA — günde 1, 5 endeksi MCP'den tara → eagle_index.json'a yaz (app gist'ten okur, CORS yok)
      if (st.lastIdxDay !== st.dayKey) {
        st.lastIdxDay = st.dayKey;
        try {
          const ix = await scanIndices();
          const nStk = Object.values(ix.indices).reduce((a, v) => a + v.length, 0);
          // MCP boş dönerse (sunucu kapalı/taşındı) eski iyi veriyi BOŞ listeyle ezme
          if (nStk) { await gistPut({ "eagle_index.json": { content: JSON.stringify(ix) } }); console.log(`Endeks taraması yazıldı (${nStk} hisse)`); }
          else console.log("⚠ Endeks taraması boş döndü (MCP) — eski eagle_index.json korunuyor.");
        } catch (e) { console.error("Endeks tarama:", e.message); }
      }
      // HABER PUANI ARŞİVİ — günde 1 kayıt (gün içinde son rapor kazanır), son 180 gün. Amaç: ileride "haber puanı kazandırıyor mu"
      // ölçülebilsin (geçmiş haber saklanmıyordu → hiç ölçülemiyordu). Gist okunamazsa YAZILMAZ (mevcut arşiv ezilmesin).
      if (Object.keys(newsScores).length) {
        try {
          const ar = await gistGet(NEWS_ARCH, { days: {} });
          if (ar !== READ_FAILED && ar && typeof ar === "object") {
            ar.days = ar.days || {};
            ar.days[istDay] = Object.fromEntries(Object.entries(newsScores).filter(([, v]) => Math.abs(v) >= 0.05).map(([k, v]) => [k, +v.toFixed(2)]));
            const ks = Object.keys(ar.days).sort(); for (const k of ks.slice(0, Math.max(0, ks.length - 180))) delete ar.days[k];
            await gistPut({ [NEWS_ARCH]: { content: JSON.stringify(ar) } });
          }
        } catch (e) { console.error("Haber arşivi:", e.message); }
      }
      // MODEL PORTFÖY yedeği: Pazartesi 08:00 gönderimi kaçtıysa haftanın İLK seans raporunda gönder (haftada 1)
      if (isTradingHours() && st.lastMPWeek !== weekKey(Date.now())) { try { if (await mpSend(st)) { st.lastMPWeek = weekKey(Date.now()); sent++; } } catch (e) { console.error("Model portföy:", e.message); } }
      st.lastReportHour = istHour; st.lastReportSlot = slot; st.lastReportDay = istDay; st.hourOpens = []; st.hourCloses = [];
      await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
      console.log(`Rapor gönderildi · değer ~${Math.round(eq)}₺ · getiri ${portRet.toFixed(2)}% · poz ${openLines.length}`);
    }
  } else {
    console.log(`${istHour}:${istMin >= 30 ? "30" : "00"} dilimi raporu zaten gönderildi — sessiz tarama/yönetim. Birikim: ${(st?.hourOpens || []).length} açılış, ${(st?.hourCloses || []).length} kapanış.`);
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
export const _setWatchCache = v => { _wCache = v; };   // yalnız test
export { shortCore };
export { runPaper, heldInfo, sigLine, watchMsg, watchAlerts, ideaFor, daySummary, modelStatus, HELP, shortTerm, shortTermMsg, scanOne, scanAll, marketContext, perfStats, setupStats, disabledSetups, setupPauses, riskMult, setupOf, sendTG, buildScanMsg, mcpEnrich, scanIndices, aiDaily, handleCommands };
