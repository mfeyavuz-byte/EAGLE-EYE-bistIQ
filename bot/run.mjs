#!/usr/bin/env node
// EAGLE EYE — Otonom motor botu (bulutta, cihaz gerekmez)
// 1) ~195 BIST hissesini (bot/symbols.json) UYGULAMANIN KENDİ MOTORUYLA tarar (getSignals) -> AL/SAT -> Telegram
// 2) AI TRADER sanal portföyünü yönetir (aç/kapat, TP/SL/trailing) -> Telegram
// State Gist'te (feybot_paper.json). Bağımlılıksız (Node 20+ ESM).

import { getSignals, enrichData, getHigherTrend } from "./engine.mjs";
import { fetchDaily, fetchWeekly, fetchIndexClose, weekKey } from "./data.mjs";
import { buildModels, modelMsg } from "./model-portfolio.mjs";
import { mcpCall, mcpHealth, mcpRows, anSummary } from "./mcp.mjs";
import { grokXSentiment, geminiAdvise, grokEnabled, geminiEnabled, llmDiag, grokLastError } from "./llm.mjs";
import { positionScan } from "./position-scan.mjs";
import { fetchNews } from "./news.mjs";
import syms from "./symbols.json" with { type: "json" };
import SECTORS from "./sectors.json" with { type: "json" };
import MACRO from "./macro.json" with { type: "json" };
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
// MUM YAPILARI (Dantes videosu; 2 yıl BIST ölçümünde TEK BAŞINA avantajı yok → yalnız GÜÇ KADEMESİNDE teyitlerden biri, mesajda adı geçmez).
// Son mum = değerlendirilen gün. bobin: önceki 4–6 mum ardışık zıt renk, gövdeli (gövde/aralık ≥0.45), boyları benzer (≤4×); kırılım mumu
// kutunun (iğneler dahil) dışına güçlü kapanış. at nalı: kırmızı-yeşil-kırmızı-YEŞİL, 4. en büyük gövde, 2≈3 küçük, 1 ortada (düşüşte tersi).
function candlePatterns(a) {
  const j = a.length - 1, out = { up: false, dn: false }; if (j < 8) return out;
  const body = b => Math.abs(b.close - b.open), rng = b => Math.max(1e-9, b.high - b.low), G = b => b.close > b.open, R = b => b.close < b.open, t = a[j];
  for (const n of [6, 5, 4]) {
    const box = a.slice(j - n, j); let ok = box.every(b => body(b) / rng(b) >= 0.45 && b.close !== b.open);
    for (let k = 1; ok && k < n; k++) if (G(box[k]) === G(box[k - 1])) ok = false;
    const bs = box.map(body); if (!ok || Math.max(...bs) / Math.max(1e-9, Math.min(...bs)) > 4) continue;
    const top = Math.max(...box.map(b => b.high)), bot = Math.min(...box.map(b => b.low)), avgB = bs.reduce((x, y) => x + y, 0) / n, strong = body(t) / rng(t) >= 0.6 && body(t) >= avgB;
    if (t.close > top && G(t) && (strong || t.open > top)) out.up = true;
    if (t.close < bot && R(t) && (strong || t.open < bot)) out.dn = true;
    break;
  }
  const [m1, m2, m3, m4] = [a[j - 3], a[j - 2], a[j - 1], t], [b1, b2, b3, b4] = [m1, m2, m3, m4].map(body), mid = Math.max(b2, b3) / Math.max(1e-9, Math.min(b2, b3)) <= 1.5;
  if (R(m1) && G(m2) && R(m3) && G(m4) && b4 > b1 && b1 > Math.max(b2, b3) && mid) out.up = true;
  if (G(m1) && R(m2) && G(m3) && R(m4) && b4 > b1 && b1 > Math.max(b2, b3) && mid) out.dn = true;
  return out;
}
// GÜÇ KADEMESİ: AL'de 4 teyitten en az 2'si → GÜÇLÜ AL; SAT'ta gün ≤−%4 → GÜÇLÜ SAT (ölçüme göre). Teyitler (ölçülenler + video): güven ≥85 (backtest: 85+ grubu en iyi) · mum yapısı (bobin/at nalı)
// · gün kapanışı (AL: ≥+%4, tepeye yakın, hacimli — ölçüm +; SAT: gün ≤−%4 — ölçüm: düşüş sürüyor) · trend (AL: MA50>MA200 ve fiyat MA50 üstü
// — Stage-2 mantığı; SAT: MA50<MA200 ve fiyat MA50 altı).
// ÖLÇÜM (12 ay, her 3 günde tarama, 10g getiri − piyasa): GÜÇLÜ AL +%1.60 (yarılar +1.70/+1.49) vs AL +%0.30 (+1.54/−0.93).
// SAT teyitleri tek tek: gün ≤−%4 −%0.88 (−1.76/−0.00) ✓ · güven≥85 +0.10 · düşüş trendi +0.03 · mum yapısı aşağı +7.0 (n=6, ters!) → GÜÇLÜ SAT = SAT + gün ≤−%4.
function tierOf(s) {
  if (s.signal === "SAT") return s.bigDrop ? "GÜÇLÜ SAT" : "SAT";
  return [(s.confidence || 0) >= 85, !!s.pUp, !!s.strongClose, !!s.trendUp].filter(Boolean).length >= 2 ? "GÜÇLÜ AL" : "AL";
}
const sigLine = s => { const l = lv(s), t = tierOf(s); return `${t.startsWith("GÜÇLÜ") ? (s.signal === "AL" ? "🟢🟢" : "🔴🔴") : (s.signal === "AL" ? "🟢" : "🔴")} ${s.sym} ${t} · giriş ${s.price}₺ · hedef ${l.tgt}₺ · stop ${l.stop}₺`; };
const SHOW = 5;   // mesajda taraf başına en güçlü 5 (tam liste: /tara)
function buildScanMsg(signals, gErr = 0, newSet = null, full = false) {   // newSet: bugün İLK KEZ AL olanlar → 🆕
  const _as = s => (s.confidence || 0) + (s.er || 0) * 8 + (s.preMom || 0) * 0.4 + (s.ret60 || 0) * 0.3;
  const gz = s => tierOf(s).startsWith("GÜÇLÜ") ? 0 : 1;   // GÜÇLÜ olanlar önce
  const AL = signals.filter(s => s.signal === "AL").sort((a, b) => (gz(a) - gz(b)) || (!!a.secWeak - !!b.secWeak) || _as(b) - _as(a)), SA = signals.filter(s => s.signal === "SAT").sort((a, b) => (gz(a) - gz(b)) || (b.confidence || 0) - (a.confidence || 0));
  const f = s => (newSet?.has(s.sym) ? "🆕 " : "") + sigLine(s);
  const sec = (title, arr) => { if (!arr.length) return ""; const n = full ? arr.length : Math.min(SHOW, arr.length);
    return `\n\n${title}${arr.length > n ? ` — en güçlü ${n} (toplam ${arr.length})` : ""}:\n` + arr.slice(0, n).map(f).join("\n"); };
  let m = "🦅 EAGLE EYE — HİSSE TARA (motor)\n" + fmtTime();
  if (!signals.length) m += "\n\n⚠ Tarama 0 sinyal döndü — Yahoo/veri kaynağı geçici sorun olabilir.";
  m += sec(`🟢 AL — ${AL.filter(s => !gz(s)).length} GÜÇLÜ`, AL) + sec(`🔴 SAT — ${SA.filter(s => !gz(s)).length} GÜÇLÜ`, SA);
  if (!full && (AL.length > SHOW || SA.length > SHOW)) m += "\n\nTam liste: /tara";
  if (_staleNote) m += "\n\n" + _staleNote;
  if (_macroNote) m += "\n\n" + _macroNote;
  if (mcpHealth.calls >= 2 && mcpHealth.fails === mcpHealth.calls) m += `\n\n⚠ Borsa MCP sunucusu yanıt vermiyor (${mcpHealth.last}) — bilanço yasağı, analist ve F/K filtreleri bu taramada devre dışı.`;
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
  // güç kademesi girdileri (tierOf): mum yapısı · gün kapanışı · trend
  const _pc = daily[daily.length - 2]?.close, _dr = _pc ? (last.close / _pc - 1) * 100 : 0, _pos = last.high > last.low ? (last.close - last.low) / (last.high - last.low) : 0.5, _cp = candlePatterns(daily);
  const _tierIn = { pUp: _cp.up, pDn: _cp.dn, strongClose: _dr >= 4 && _pos >= 0.8 && (last.volume || 0) >= avgVol * 1.5, bigDrop: _dr <= -4,
    trendUp: !!(last.ma50 && last.ma200 && last.ma50 > last.ma200 && last.close > last.ma50), trendDn: !!(last.ma50 && last.ma200 && last.ma50 < last.ma200 && last.close < last.ma50) };
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
           stopLoss: k.stopLoss, target1: k.target1, mod: k.mod, adx: Math.round(k.adx || 0), htf: k.higherTrend, ret60: +ret60.toFixed(1), aboveMa50, ..._tierIn, rr: (k.target1 && k.stopLoss && last.close > k.stopLoss) ? +((k.target1 - last.close) / (last.close - k.stopLoss)).toFixed(2) : 0 };
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
    const as_ = anSummary(an), cons = as_?.consensus || "", mt = +(as_?.mean_target) || 0;
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

// 🏦 BORSA MCP ÖNERİLERİ (kullanıcı isteği 2026-11-28): sunucunun KENDİ taramaları (XU100) + analist konsensüsü + tek hisse kartı.
// Bunlar botun ölçtüğü kurallar DEĞİL → mesajda "bilgi" diye ayrı gösterilir; botun AL/SAT kararını değiştirmez (yalnız mevcut mcpEnrich güven ayarı).
const MCP_PRESETS = [["supertrend_bullish", "🟢 Supertrend AL"], ["t3_bullish", "🟢 T3 AL"], ["bullish_momentum", "🟢 Yükseliş momentumu"], ["oversold", "🔵 Aşırı satım (dip)"], ["bearish_momentum", "🔴 Düşüş momentumu"], ["overbought", "🔴 Aşırı alım (tepe)"]];
const AN_TR = { "strong buy": "GÜÇLÜ AL", buy: "AL", hold: "TUT", sell: "SAT", "strong sell": "GÜÇLÜ SAT", underperform: "ZAYIF", outperform: "GÜÇLÜ" };
const anTr = c => AN_TR[String(c || "").toLowerCase()] || String(c || "?");
const anBuy = s => /buy|outperform/i.test(s?.consensus || "");
function anLine(sym, s, px) {
  const b = (s.strong_buy || 0) + (s.buy || 0), h = s.hold || 0, se = (s.sell || 0) + (s.strong_sell || 0), mt = +s.mean_target || 0, up = mt > 0 && px > 0 ? (mt / px - 1) * 100 : null;
  return `${sym} ${anTr(s.consensus)} (${b} al · ${h} tut · ${se} sat)${mt > 0 ? ` · ort. hedef ${+mt.toFixed(2)}₺${up != null ? ` (${pct(up)})` : ""}` : ""}`;
}
async function mcpAnalyst(list) {   // toplu (10'luk) → { SYM: özet }
  const out = {};
  for (let i = 0; i < list.length; i += 10) { const b = list.slice(i, i + 10), r = await mcpCall("get_analyst_data", { symbol: b.length === 1 ? b[0] : b, market: "bist" }, 25000);
    for (const x of (Array.isArray(r?.data) ? r.data : r ? [{ ...r, symbol: r.symbol || b[0] }] : [])) { const s = anSummary(x); if (x?.symbol && s) out[x.symbol] = s; } }
  return out;
}
async function mcpReco(st) {
  const sc = {}; for (const [p] of MCP_PRESETS) sc[p] = mcpRows(await mcpCall("scan_stocks", { index: "XU100", preset: p, timeframe: "1d" }, 25000)).map(x => ({ sym: x.symbol, c: x.close }));
  const botAL = st?.lastScan?.al || [];
  const list = [...new Set([...WATCH.filter(s => !/^X(BANK|U\d{3}|USIN|UMAL|UHIZ)$/.test(s)), ...botAL])].slice(0, 20), an = await mcpAnalyst(list);
  const px = {}; for (const s of list) { const d = await fetchDaily(s).catch(() => []); px[s] = d.at(-1)?.close ?? null; }
  const ok = Object.values(sc).some(a => a.length) || Object.keys(an).length;
  return { ok, sc, an, px, botAL, err: ok ? "" : (mcpHealth.last || "boş yanıt") };
}
function mcpRecoMsg(R) {
  if (!R.ok) return `🏦 BORSA MCP ÖNERİLERİ\n⚠ Sunucu yanıt vermedi (${R.err}) — bir sonraki çalışmada tekrar denenecek.`;
  let m = `🏦 BORSA MCP ÖNERİLERİ · ${fmtTime()}\n(Borsa MCP'nin kendi XU100 taramaları + analist konsensüsü · bot ölçümü DEĞİL, bilgi)`;
  for (const [p, lab] of MCP_PRESETS) { const a = R.sc[p] || []; m += `\n${lab} (${a.length}): ${a.length ? a.slice(0, 15).map(x => x.sym).join(", ") + (a.length > 15 ? " …" : "") : "—"}`; }
  if ((R.sc.oversold || []).length) m += "\n   ↳ not: botun dipten alım ölçümü 10g negatif → aşırı satımda teyit bekle";
  const rows = Object.entries(R.an); if (rows.length) m += "\n\n📊 ANALİST (takip listesi + botun AL'ları):\n" + rows.map(([s, a]) => anLine(s, a, R.px[s])).join("\n");
  const bull = new Set(["supertrend_bullish", "t3_bullish", "bullish_momentum"].flatMap(p => (R.sc[p] || []).map(x => x.sym)));
  const both = R.botAL.filter(s => bull.has(s) && anBuy(R.an[s]));
  m += `\n\n✅ ÜÇÜ BİRDEN (bot AL + MCP yükseliş taraması + analist AL): ${both.length ? both.join(", ") : "yok"}`;
  return m + "\n⚠ Yatırım tavsiyesi değildir.";
}
// /hisse için Borsa MCP kartı: analist + teknik sinyaller + F/K–PD/DD + bilanço tarihi + son KAP haberi (varsa)
async function mcpStock(sym, px) {
  const [an, ta, fr, ea, nw] = await Promise.all([mcpCall("get_analyst_data", { symbol: sym, market: "bist" }, 20000), mcpCall("get_technical_analysis", { symbol: sym, market: "bist" }, 20000),
    mcpCall("get_financial_ratios", { symbol: sym, market: "bist" }, 20000), mcpCall("get_earnings", { symbol: sym, market: "bist" }, 20000), mcpCall("get_news", { symbol: sym, limit: 3 }, 20000)]);
  const L = [], s = anSummary(an); if (s) L.push("analist " + anLine("", s, px).trim());
  const g = ta?.signals; if (g) L.push(`teknik: trend ${g.trend ?? "?"} · RSI ${g.rsi_signal ?? "?"}${ta?.indicators?.rsi_14 != null ? ` (${(+ta.indicators.rsi_14).toFixed(0)})` : ""} · ${g.macd_signal ?? ""}`.trim());
  const v = fr?.valuation; if (v && (v.pe_ratio != null || v.pb_ratio != null)) L.push(`F/K ${v.pe_ratio ?? "?"} · PD/DD ${v.pb_ratio ?? "?"}${v.ev_ebitda != null ? ` · FD/FAVÖK ${v.ev_ebitda}` : ""}`);
  if (ea?.next_earnings_date) { const n = Math.round((Date.parse(ea.next_earnings_date) - Date.now()) / 864e5); L.push(`bilanço ${ea.next_earnings_date}${n >= 0 ? ` (${n} gün)` : ""}`); }
  const nl = mcpRows(nw, "news").length ? mcpRows(nw, "news") : mcpRows(nw, "items"); if (nl.length) L.push("KAP: " + nl.slice(0, 2).map(x => x.title || x.baslik || x.text || "").filter(Boolean).join(" | "));
  return L.length ? "🏦 Borsa MCP (bilgi): " + L.join("\n   ") : `🏦 Borsa MCP: veri alınamadı (${mcpHealth.last || "boş yanıt"})`;
}
// ENDEKS TARA — bot, scan_stocks'u 5 endeks için sunucu-tarafı çalıştırır (CORS yok) → eagle_index.json'a yazılır, app okur.
const IDX_LIST = ["XU100", "XU030", "XUSIN", "XUMAL", "XUHIZ"];
async function scanIndices() {
  const indices = {};
  for (const ix of IDX_LIST) {
    const r = await mcpCall("scan_stocks", { index: ix, timeframe: "1d", condition: "close > 0" }, 20000).catch(() => null);
    const arr = mcpRows(r);
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
  const trading = (_test && "forceTrading" in _test ? _test.forceTrading : isTradingHours()) && !mkt.stale;   // veri bayatsa işlem YOK
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
    } else if (txt === "/karne") {
      const b = await ideasLoad(); await sendTG(b ? karneText(b, 30) + "\n\n" + karneText(b, 7) : "Karne okunamadı."); replied++; await sleep(300);
    } else if (txt === "/tara") {
      await sendTG(buildScanMsg(ctx.signals || [], 0, null, true)); replied++; await sleep(300);
    } else if (txt === "/model") {
      await sendTG(await modelStatus(st)); replied++; await sleep(300);
    } else if (txt === "/takip") {
      await sendTG(await watchMsg(ctx.signals || [], !!ctx.bearRegime, st)); replied++; await sleep(300);
    } else if (txt.startsWith("/hisse")) {
      const sym = (raw.split(/\s+/)[1] || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!sym) await sendTG("Kullanım: /hisse SEMBOL  (örn. /hisse THYAO)");
      else { const x = await ideaFor(sym, ctx.signals || [], !!ctx.bearRegime, st), mc = await mcpStock(sym, x.c).catch(() => ""); await sendTG(`🔎 HİSSE ÖNERİSİ · ${fmtTime()}\n\n${x.text}${mc ? "\n   " + mc : ""}\n\nKural: yalnız botun kalite filtrelerini geçen sinyal AL/SAT; diğerleri BEKLE + tetik seviyesi.\n⚠ Yatırım tavsiyesi değildir.`); }
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
  for (const s of signals) { const sec = sectorOf(s.sym); s.secStrong = !!(sec && secAvg[sec] != null && secAvg[sec] >= _med); s.secWeak = !!(sec && secAvg[sec] != null && secAvg[sec] < _med); s.leader = s.signal === "AL" && s.rs >= 5 && !!s.aboveMa50; }
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
const WATCH = (process.env.WATCH || "AKSEN,ALARK,ASELS,ASTOR,EUPWR,KCHOL,PGSUS,THYAO,TRMET,TUPRS,XBANK,YEOTK").split(",").map(s => s.trim().toUpperCase()).filter(Boolean).sort();   // alfabetik; XBANK = bankacılık endeksi
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
    if (live?.signal === "AL") { mark = tierOf(live).startsWith("GÜÇLÜ") ? "🟢🟢" : "🟢"; head = `${mark} ${tierOf(live)} (bot sinyali · güven %${live.confidence})`; plan = `Giriş ~${c}₺ · stop ${live.stopLoss} · hedef ${live.target1}${bearRegime && !live.dip ? " · ⚠ düşüş rejimi: AI TRADER yalnız dip alıyor, küçük pozisyon" : ""}`; }
    else if (live?.signal === "SAT") { mark = tierOf(live).startsWith("GÜÇLÜ") ? "🔴🔴" : "🔴"; head = `${mark} ${tierOf(live)} (bot sinyali · güven %${live.confidence})`; plan = `Elde varsa çık/azalt, yeni alım yok. İlk dönüş teyidi: MA20 ${ma20.toFixed(2)}₺ üstü kapanış (güçlü teyit ${hi20}₺).`; trig = { t: "ma20", hit: c > ma20, text: `MA20 ${ma20.toFixed(2)}₺ üstüne çıktı (SAT'tan ilk dönüş teyidi)` }; }
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
      : K.rev && K.top.some(x => x.sym === sym) ? "↗ dönüş günü güçlü toparlanan" : K.strong.some(x => x.sym === sym) ? "↗ güçlü kapanış"
      // GÜN İÇİ ÖLÇÜMÜ (2 yıl saatlik): endeks ≤−%1 iken hisse ≥+%1 → sonraki 3 günde piyasaya −%1.0 (eğitim −0.75 / test −1.47) — tek başına yükseliş sürmüyor
      : K.xDay <= -1 && chg != null && chg >= 1 ? "↘ endeks düşerken yükseliyor (ölçüm: 3 günde piyasanın ~%1 gerisinde kalma eğilimi)" : "→ belirgin kısa vade sinyali yok";
    const isIdx = /^X(BANK|U\d{3}|USIN|UMAL|UHIZ|ELKT|ILTM|GIDA|HOLD|TEKS|KMYA|METL|ULAS|TRZM|SGRT|SPOR)$/.test(sym);   // endeks: puan, ₺ değil
    const out_ = { sym, c, chg, trig, mark, text: `${mark} ${sym} ${c}₺ (${chg == null ? "?" : (chg >= 0 ? "+" : "") + chg.toFixed(2) + "%"}) — ${head.split(" (")[0].replace(/^\S+ /, "")}${earnTag(en)}\n   Kısa vade: ${kv}\n   ${lvl}${trend === "düşüş" && !live ? " · ana trend düşüş" : ""}` };
    const wm = wma200Status(w); if (wm) out_.text += "\n   " + wm.t;
    const pa = paCore(d); for (const x of pa.al.filter(x => !isMuted("EW:" + x.k))) out_.text += `\n   📐 ${x.why} → AL (${x.k === "W3" || x.k === "TRI" ? "20g" : "10g"}) · giriş ${c}₺ · hedef ${x.tgt}₺ · stop ${x.stop}₺ (ölçüm ${x.m})`;
    for (const x of pa.sat) out_.text += `\n   🔴 ${x.why} · seviye ${x.lv}₺ (ölçüm ${x.m})`;
    for (const x of pa.warn) out_.text += `\n   ⚠ ${x.t}`;
    if (isIdx) out_.text = out_.text.replace(/₺/g, "");
    out_.atr = atr;
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
  for (const x of hits) if (x.atr > 0 && !/^X[A-Z]/.test(x.sym)) _newIdeas.push({ k: "TETIK", sym: x.sym, d: d, e: x.c, s: +(x.c - 2 * x.atr).toFixed(2), t: +(x.c + 4 * x.atr).toFixed(2), h: 10 });
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
// 📐 FORMASYONLAR (2026-11-28 ölçümü, günlük 2 yıl, 196 hisse, piyasaya göre fazla getiri; eğitim %60 / test %40):
//  ✓ ELLIOTT ZİGZAG ABC (yükselen trendde düzeltme bitti: kapanış > MA50, MA50 20 günde yükselen; H→A→B(<H)→C(<A), B tepesi kırıldı;
//    Elliott eğitim serileri kuralı: B = A'nın %38.2–78.6'sı). 5 YIL (2021-06→2026-11, 3 dönem: ≤2023-06 / 2023-07–2024 / 2025+) canlı kodla:
//    ✓ ABC (zigzag %10) 10g +%1.26 [0.56/0.69/2.25] · ✓ 5. DALGA 3g +%0.77 · 10g +%2.43 [2.36/3.04/1.36] · ✓ 3. DALGA 10g +%0.63 · 20g +%1.03 (3 dönemde de +)
//    · ✓ SAT itki bitti 20g −%3.42 [−4.44/−2.08/−4.05] · ✓ SAT üçgen aşağı 10g −%0.97 · 20g −%2.06 (3 dönemde de −)
//    · ~ ÜÇGEN yukarı 10g +%0.41 [3.17/−2.81/1.86] karışık (kullanıcı isteğiyle tutuldu, ölçüm mesajda) · ✗ ABC %6 (10g +%0.27, 2 dönemde −) çıkarıldı
//    · uyarılar 5 yıl: ikili dip 10g −%1.39 · RSI uyumsuzluk −%0.69 · ≥%25 düşüş dönüşü 20g −%0.98 · hacimli düşen trend kırılımı −%1.61 · düz kırılım +%0.15 (zayıf)
function zigzag(a, thr) {   // nedensel: pivot, ters yönde thr oranında hareketle ONAYLANIR (at = onay günü)
  const P = []; let dir = 0, hi = a[0]?.high, hiI = 0, lo = a[0]?.low, loI = 0, ep = 0, ei = 0;
  for (let j = 1; j < a.length; j++) { const h = a[j].high, l = a[j].low;
    if (dir === 0) {   // yön belli değil: baştan beri tepe ve dibi ayrı izle, ilk thr hareketi yönü belirler
      if (h > hi) { hi = h; hiI = j; } if (l < lo) { lo = l; loI = j; }
      if (l <= hi * (1 - thr) && hiI < j) { P.push({ i: hiI, p: hi, t: "H", at: j }); dir = -1; ep = l; ei = j; }
      else if (h >= lo * (1 + thr) && loI < j) { P.push({ i: loI, p: lo, t: "L", at: j }); dir = 1; ep = h; ei = j; }
      continue; }
    if (dir === 1) { if (h > ep) { ep = h; ei = j; } else if (l <= ep * (1 - thr)) { P.push({ i: ei, p: ep, t: "H", at: j }); dir = -1; ep = l; ei = j; } }
    else { if (l < ep) { ep = l; ei = j; } else if (h >= ep * (1 + thr)) { P.push({ i: ei, p: ep, t: "L", at: j }); dir = 1; ep = h; ei = j; } } }
  return P;
}
// a: günlük mumlar (son mum = değerlendirilen gün). Döner: { al: [{k, why, stop, tgt, ...}], warn: [{k, t}] }
function paCore(a) {
  a = (a || []).filter(b => b.close != null && b.high != null && b.low != null); const j = a.length - 1, out = { al: [], sat: [], warn: [] }; if (j < 130) return out;
  const c = a.map(b => b.close), sm = (n, e) => c.slice(e - n + 1, e + 1).reduce((p, v) => p + v, 0) / n, r2 = v => +v.toFixed(2);
  const hi120 = Math.max(...a.slice(j - 120, j + 1).map(b => b.high)), dd = (c[j] / hi120 - 1) * 100;
  const lo60 = Math.min(...a.slice(j - 60, j + 1).map(b => b.low)), loIdx = j - 60 + a.slice(j - 60, j + 1).findIndex(b => b.low === lo60);
  const v20 = a.slice(j - 20, j).reduce((p, b) => p + (b.volume || 0), 0) / 20, vr = (a[j].volume || 0) / (v20 || 1);
  const lvl = (stop, tgt) => { const st = Math.max(stop, c[j] * 0.92); return { stop: r2(st), tgt: r2(Math.max(c[j] * 1.02, Math.min(tgt ?? c[j] + 2 * (c[j] - st), c[j] * 1.25))) }; };
  const Z6 = zigzag(a, 0.06), Z10 = zigzag(a, 0.10);
  // ELLIOTT ABC (önce %10, yoksa %6)
  const up = c[j] > sm(50, j) && sm(50, j) > sm(50, j - 20), xu = p => c[j] > p && c[j - 1] <= p, xd = p => c[j] < p && c[j - 1] >= p;
  // ZİGZAG ABC (Elliott eğitimi "zigzag düzeltme": B, A'nın %38.2–78.6'sı kadar geri alır; %6'da ayrıca C = 0.618–1.618 × A)
  { const P = Z10.filter(p => p.at <= j); if (P.length >= 4) { const [x0, x1, x2, x3] = P.slice(-4);
    if (x0.t === "H" && up && x2.p < x0.p && x3.p < x1.p && xu(x2.p)) { const rB = (x2.p - x1.p) / (x0.p - x1.p);
      if (rB >= 0.382 && rB <= 0.786) out.al.push({ k: "ABC", why: "Elliott zigzag ABC bitti (yükselen trend, 10 gün)", m: "10g +%1.3 (5 yılda 3 dönemde de +) · son 2 yıl +%2.5", ...lvl(x3.p * 0.99) }); } } }
  { const P = Z10.filter(p => p.at <= j);
    // 5. DALGA (%10): l0<h1, l2>l0, h3>h1, 3. dalga > 1. dalga, 4. dalga 1. dalgaya GİRMEDİ, 4. dalga 3'ün %23.6–50'si → 4. dalga dibi bugün onaylandı
    if (P.length >= 5) { const [l0, h1, l2, h3, l4] = P.slice(-5);
      if (l0.t === "L" && l2.p > l0.p && h3.p > h1.p && h3.p - l2.p > h1.p - l0.p && l4.p > h1.p && l4.at === j) { const r4 = (h3.p - l4.p) / (h3.p - l2.p);
        if (r4 >= 0.236 && r4 <= 0.5) out.al.push({ k: "W5", why: "Elliott 5. dalga başlangıcı (son dalga, ≤10 gün)", m: "3g +%0.8 · 10g +%2.4 (5 yılda 3 dönemde de +)", ...lvl(Math.max(l4.p * 0.99, h1.p), l4.p + (h1.p - l0.p)) }); } }
    // İTKİ BİTTİ (%10): 5 dalga yükseliş (3. dalga en kısa değil) sonrası 4. dalga dibi aşağı kırıldı → SAT
    if (P.length >= 6) { const [l0, h1, l2, h3, l4, h5] = P.slice(-6), w1 = h1.p - l0.p, w3 = h3.p - l2.p, w5 = h5.p - l4.p;
      if (l0.t === "L" && l2.p > l0.p && h3.p > h1.p && l4.p > h1.p && h5.p > h3.p && !(w3 < w1 && w3 < w5) && xd(l4.p)) out.sat.push({ k: "IMP", why: "Elliott 5 dalga yükseliş bitti, 4. dalga dibi kırıldı → SAT/çık", m: "20g −%3.4 (5 yılda 3 dönemde de −)", lv: r2(l4.p) }); }
    // ÜÇGEN (%10): son 5 pivot daralıyor (alçalan tepeler + yükselen dipler) → son tepe kırılırsa AL, son dip kırılırsa SAT
    if (P.length >= 5) { const q = P.slice(-5), hs = q.filter(p => p.t === "H"), ls = q.filter(p => p.t === "L");
      if (hs.length >= 2 && ls.length >= 2 && hs.every((p, i) => !i || p.p < hs[i - 1].p) && ls.every((p, i) => !i || p.p > ls[i - 1].p)) {
        if (xu(hs.at(-1).p)) out.al.push({ k: "TRI", why: "Elliott üçgen yukarı kırıldı (20 gün)", m: "son 2 yıl 20g +%3.7 · 5 yılda karışık (2023–24 −%3.4)", ...lvl(ls.at(-1).p * 0.99, c[j] + (hs[0].p - ls[0].p)) });
        if (xd(ls.at(-1).p)) out.sat.push({ k: "TRI-", why: "Elliott üçgen aşağı kırıldı → SAT/uzak dur", m: "10g −%1.0 · 20g −%2.1 (5 yılda 3 dönemde de −)", lv: r2(ls.at(-1).p) }); } } }
  { const P = Z6.filter(p => p.at <= j);   // ELLIOTT 3. DALGA
    if (P.length >= 3 && dd > -20) { const [q0, q1, q2] = P.slice(-3);
      if (q0.t === "L" && q2.p > q0.p) { const rt = (q1.p - q2.p) / (q1.p - q0.p);
        if (rt >= 0.382 && rt <= 0.786 && c[j] > q1.p && c[j - 1] <= q1.p) out.al.push({ k: "W3", why: "Elliott 3. dalga başlangıcı (20 gün)", m: "10g +%0.6 · 20g +%1.0 (5 yılda 3 dönemde de +)", ...lvl(q2.p * 0.99, q2.p + 1.618 * (q1.p - q0.p)) }); } } }
  // DİP DÖNÜŞ görünümleri → uyarı
  const hh = (e, n) => Math.max(...a.slice(e - n, e).map(b => b.high));
  if (dd <= -25 && j - loIdx <= 10 && j - loIdx >= 2 && c[j] > hh(j, 5) && c[j - 1] <= hh(j - 1, 5)) out.warn.push({ k: "DIP", t: "dipten dönüş görünümü (≥%25 düşüş sonrası 5g tepe kırıldı) — ölçüm 20g −%1.0 (5 yıl): 10–20 gün tutmak için ALMA (1–3 gün ayrı)" });
  { const rs = rsiSeries(c), pl = Math.min(...c.slice(j - 40, j - 15)), pli = j - 40 + c.slice(j - 40, j - 15).indexOf(pl), cl = Math.min(...c.slice(j - 10, j + 1));
    if (dd <= -20 && cl < pl && rs[j - 10 + c.slice(j - 10, j + 1).indexOf(cl)] > rs[pli] + 3 && c[j] > a[j - 1].high) out.warn.push({ k: "DIV", t: "RSI pozitif uyumsuzluk — ölçüm 10g −%0.7 (5 yıl): dönüş teyidi değil, 10 gün tutmak için ALMA" }); }
  { const Ls = Z6.filter(p => p.t === "L" && p.at <= j).slice(-2), Hs = Z6.filter(p => p.t === "H" && p.at <= j);
    if (Ls.length === 2 && Ls[1].p > Ls[0].p * 1.01 && Ls[1].i - Ls[0].i <= 40 && dd <= -20) { const mid = Hs.filter(h => h.i > Ls[0].i && h.i < Ls[1].i).pop();
      if (mid && c[j] > mid.p && c[j - 1] <= mid.p) out.warn.push({ k: "W", t: "ikili dip / boyun kırılımı — ölçüm 10g −%1.4 (5 yıl): tuzak, 10 gün tutmak için ALMA" }); } }
  // DÜŞEN TREND KIRILIMI (pivot tepe: 5 sol / 5 sağ; j günü yalnız i ≤ j−5 bilinir)
  { const PH = []; for (let i = Math.max(5, j - 125); i <= j - 5; i++) { let ok = 1; for (let k = 1; k <= 5; k++) if (a[i - k].high >= a[i].high || a[i + k].high > a[i].high) { ok = 0; break; } if (ok) PH.push(i); }
    const K = PH.filter(i => i >= j - 120);
    if (K.length >= 2) { const i2 = K[K.length - 1]; let i1 = -1; for (let q = K.length - 2; q >= 0; q--) if (a[K[q]].high > a[i2].high * 1.03 && i2 - K[q] >= 10) { i1 = K[q]; break; }
      if (i1 >= 0) { const sl = (a[i2].high - a[i1].high) / (i2 - i1), L = x => a[i2].high + sl * (x - i2); let clean = 1; for (let x = i2 + 1; x < j; x++) if (c[x] > L(x)) { clean = 0; break; }
        if (clean && c[j] > L(j) && c[j - 1] <= L(j - 1)) out.warn.push(dd <= -20 && vr >= 1.5 ? { k: "DTK!", t: `düşen trend kırılımı (${r2(L(j))}₺) sert düşüş sonrası hacimli — ölçüm 10g −%1.6 (5 yıl): TUZAK riski, ALMA` }
          : { k: "DTK", t: `düşen trend kırılımı (${r2(L(j))}₺) — ölçüm zayıf (5 yıl 10g +%0.2): tek başına alım sebebi değil` }); } } }
  // ÇAKIŞMA: aynı gün dip/tuzak uyarısı varsa Elliott AL VERİLMEZ (ölçüm: çakışan 8 olay 10g −%6.7…−%9.6; temiz ABC 10g +%2.34, temiz üçgen 20g +%4.28)
  if (out.al.length && out.warn.some(w => ["DTK!", "DIP", "W", "DIV"].includes(w.k))) { out.warn.push({ k: "CAK", t: `${out.al.map(x => x.why).join(" / ")} var ama dip/tuzak uyarısıyla çakışıyor → AL VERİLMEDİ (çakışma ölçümü 5 yıl 10g −%1.8, son 2 yıl −%6.7…−%9.6)` }); out.al = []; }
  return out;
}
function rsiSeries(c) { const r = Array(c.length).fill(50); let g = 0, l = 0; for (let i = 1; i < c.length; i++) { const d = c[i] - c[i - 1]; if (i <= 14) { g += Math.max(d, 0) / 14; l += Math.max(-d, 0) / 14; } else { g = (g * 13 + Math.max(d, 0)) / 14; l = (l * 13 + Math.max(-d, 0)) / 14; } if (i >= 14) r[i] = l ? 100 - 100 / (1 + g / l) : 100; } return r; }
// Saf çekirdek (canlı shortTerm + portföy simülatörü AYNI kod): data = { SYM: günlük mumlar (son mum = değerlendirilen gün) }, x = XU100 günlük
function shortCore(data, x) {
  if (!x || x.length < 2) return null;
  const xt = x.at(-1), xp = x.at(-2).close, rows = [];
  for (const [s, a] of Object.entries(data)) {
    const j = a.length - 1; if (j < 21 || istDayOf(a[j].ts) !== istDayOf(xt.ts)) continue;   // o gün işlem görmeyen hisse yok sayılır
    const t = a[j], pc = a[j - 1].close, v20 = a.slice(j - 20, j).reduce((p, b) => p + (b.volume || 0), 0) / 20; if (!pc || v20 * t.close < 5e6) continue;
    let tr = 0; for (let k = j - 13; k <= j; k++) tr += Math.max(a[k].high - a[k].low, Math.abs(a[k].high - a[k - 1].close), Math.abs(a[k].low - a[k - 1].close));
    // TRENDDE 3 GÜN DÜŞÜŞ (2026-11-28 ölçümü, günlük 2 yıl): MA50>MA200, fiyat MA50 üstü, 3 kapanış üst üste düşüş → 3g piyasaya +%0.26 (eğitim +0.24 / test +0.29)
    // KISA TREND (kullanıcı isteği 2026-11-28: uzun vadeli MA200 yerine): MA20 > MA50 ve MA50 son 10 günde yükseliyor.
    // Ölçüm: MA20 limit kısa trendle aynı gün +%0.61 / 3g +%0.57 (uzun: +0.58/+0.45) · 3g düşüş kısa +%0.22 (uzun +0.32; iki dönemde de +).
    let tr3 = false, m20l = null; if (j >= 70) { const cs = a.map(b => b.close), sm = (n, e = j) => cs.slice(e - n + 1, e + 1).reduce((p, v) => p + v, 0) / n, m20 = sm(20), m50 = sm(50), up = m20 > m50 && m50 > sm(50, j - 10);
      tr3 = up && cs[j] < cs[j - 1] && cs[j - 1] < cs[j - 2] && cs[j - 2] < cs[j - 3];
      // MA20 LİMİT (2026-11-28 ölçümü): yükselen trend (MA50>MA200, kapanış > MA20 > MA50) → ertesi gün MA20'ye gün içi dokunursa limit alım:
      // aynı gün piyasaya +%0.58 (eğitim +0.57 / test +0.60), 3g +%0.45, 5g +%0.41. Kapanıştan alımda avantaj YOK (+%0.03) → kazanç limit fiyattan.
      if (up && cs[j] > m20 && cs[j] / m20 - 1 <= 0.04) m20l = +m20.toFixed(2); }
    const pa = paCore(a);
    rows.push({ sym: s, pa, c: t.close, dr: (t.close / pc - 1) * 100, pos: t.high > t.low ? (t.close - t.low) / (t.high - t.low) : 0.5, vr: v20 ? (t.volume || 0) / v20 : 0, rec: (t.close - t.low) / pc * 100, atr: tr / 14, avgVol: v20, tr3, m20l });
  }
  return { day: istDayOf(xt.ts), rev: xt.low <= xp * 0.99 && xt.close > xp, xDay: (xt.close / xp - 1) * 100, xLow: (xt.low / xp - 1) * 100,
    top: [...rows].sort((p, q) => q.rec - p.rec).slice(0, 10), strong: rows.filter(r => r.dr >= 4 && r.pos >= 0.8 && r.vr >= 1.5).sort((p, q) => q.dr - p.dr).slice(0, 10),
    pull3: rows.filter(r => r.tr3 && r.dr > -4).sort((p, q) => p.dr - q.dr).slice(0, 10),
    ma20: rows.filter(r => r.m20l && r.dr > -4).map(r => ({ sym: r.sym, c: r.c, lim: r.m20l, dist: (r.c / r.m20l - 1) * 100, stop: +(r.m20l - Math.min(r.atr, r.m20l * 0.05)).toFixed(2), tgt: +(r.m20l + Math.min(1.5 * r.atr, r.m20l * 0.075)).toFixed(2) })).sort((p, q) => p.dist - q.dist).slice(0, 8),
    ew: rows.flatMap(r => r.pa.al.map(x => ({ sym: r.sym, c: r.c, dr: r.dr, atr: r.atr, ...x }))).sort((p, q) => ({ W5: 0, ABC: 1, TRI: 2, W3: 3 }[p.k] ?? 4) - ({ W5: 0, ABC: 1, TRI: 2, W3: 3 }[q.k] ?? 4) || q.dr - p.dr),
    paw: rows.flatMap(r => r.pa.warn.map(x => ({ sym: r.sym, c: r.c, dr: r.dr, ...x }))), ews: rows.flatMap(r => r.pa.sat.map(x => ({ sym: r.sym, c: r.c, dr: r.dr, ...x }))),
    weak: rows.filter(r => r.dr <= -4).sort((p, q) => p.dr - q.dr).slice(0, 10), weakSet: new Set(rows.filter(r => r.dr <= -4).map(r => r.sym)), ...rsi2Core(data, x) };
}
// RSI2 AŞIRI SATIM DÖNÜŞÜ (ABD botundan; BIST ölçümü 2 yıl): hisse 200g üstünde + RSI(2) < 5 → giriş kapanış, hedef 10g ort., stop −2 ATR, en çok 10 gün.
// YALNIZ XU100 kendi 200g ortalamasının ÜSTÜNDEYKEN: +%0.12 (rastgele −%0.27 → +%0.4 fark), %64 kazanma. ALTINDA −%10.9 → liste verilmez.
function rsi2Core(data, x) {
  const xc = (x || []).map(b => b.close), up = xc.length >= 200 && xc.at(-1) > xc.slice(-200).reduce((p, v) => p + v, 0) / 200, list = [];
  if (up) for (const [s, a] of Object.entries(data)) {
    const j = a.length - 1; if (j < 210 || istDayOf(a[j].ts) !== istDayOf(x.at(-1).ts)) continue;
    const c = a.map(b => b.close), v20 = a.slice(j - 20, j).reduce((p, b) => p + (b.volume || 0), 0) / 20; if (v20 * c[j] < 5e6) continue;
    if (!(c[j] > c.slice(j - 199, j + 1).reduce((p, v) => p + v, 0) / 200)) continue;
    let g = 0, l = 0; for (let i = j - 9, k = 0; i <= j; i++, k++) { const d = c[i] - c[i - 1], u = Math.max(d, 0), w = Math.max(-d, 0); if (k < 2) { g += u / 2; l += w / 2; } else { g = (g + u) / 2; l = (l + w) / 2; } }
    const r2 = l === 0 ? 100 : 100 - 100 / (1 + g / l); if (r2 >= 5) continue;
    let tr = 0; for (let k = j - 13; k <= j; k++) tr += Math.max(a[k].high - a[k].low, Math.abs(a[k].high - c[k - 1]), Math.abs(a[k].low - c[k - 1]));
    const atr = tr / 14, s10 = c.slice(j - 9, j + 1).reduce((p, v) => p + v, 0) / 10;
    list.push({ sym: s, c: c[j], r2: +r2.toFixed(1), stop: +(c[j] - 2 * atr).toFixed(2), tgt: +Math.max(s10, c[j] * 1.01).toFixed(2) });
  }
  return { upMkt: up, rsi2: list.sort((p, q) => p.r2 - q.r2).slice(0, 8) };
}
let _stCache;   // bir çalışmada tek hesap (takip listesi + dönüş uyarısı + gün sonu aynı veriyi kullanır)
const shortTermC = async () => _stCache !== undefined ? _stCache : (_stCache = await shortTerm().catch(() => null));
async function shortTerm() {
  const data = {};
  for (let i = 0; i < syms.length; i += CONC) await Promise.all(syms.slice(i, i + CONC).map(async s => { data[s] = await fetchDaily(s).catch(() => []); }));
  return shortCore(data, await fetchDaily("XU100").catch(() => []));
}
const istDayOf = ts => new Date(ts + 3 * 3600e3).toISOString().slice(0, 10);
// 🧭 200 HAFTALIK ORTALAMA (2026-11-28 ölçümleri, haftalık 5 yıl, 196 hisse; 4/8 hafta sonra piyasaya göre; eğitim/test):
//  GÜVEN BANDI %1 (kullanıcı: "güveni azıcık genişlet"): HMA'nın −%1 içine kapanış SAT DEĞİL (8h +%0.17) · −%1 altı kapanış SAT (8h −%2.40, −2.25/−2.62)
//  YUKARI KIRILIM haftası alım −%2.87 (−2.41/−3.54) → takibe al, kovalama (≥%5 üstü −%7) · ERKEN günlük teyit (2–3 gün üstte) de negatif → verilmez
//  ✓ KIRILIM SONRASI GERİ ÇEKİLME (son 8 haftada kırdı, HMA'nın %3 içine çekilip üstünde kapattı): 4h +%1.29 (0.90/1.88) · 8h +%3.00 (2.96/3.05) → EN İYİ ALIM
//  ✓ TEYİT %1 toleranslı (kırılımdan sonraki hafta HMA×0.99 üstü): 8h +%1.14 (1.40/0.75) (katı 2 hafta: +1.18 ama test 0.00)
//  Ölçülüp REDDEDİLEN öneriler: destek testi HMA yükselirken −%1.10 · aşama-2 birleşimi kırılımda −%5.19 · aşırı uzama %40–80 üstü POZİTİF (+%2.0) → "kâr al" verilmez
//  · XU100 200 HMA rejimi: dönem boyunca hep üstünde → ölçülemedi.
// w: haftalık mumlar (son mum = bu hafta; hafta içinde kısmi → "hafta kapanışında kesinleşir").
function wma200Status(w) {
  const a = (w || []).filter(b => b.close != null), j = a.length - 1; if (j < 210) return null;
  const c = a.map(b => b.close), m = e => c.slice(e - 199, e + 1).reduce((p, v) => p + v, 0) / 200, w0 = m(j), w1 = m(j - 1), w2 = m(j - 2), d = (c[j] / w0 - 1) * 100, lv = +w0.toFixed(2), band = +(w0 * 0.99).toFixed(2);
  const below = c[j] < w0 * 0.99;
  if (c[j - 2] > w2 && c[j - 1] < w1 && below) return { k: "SAT", lv, d, t: `🔴 200 HMA TEYİTLİ AŞAĞI KIRILIM → SAT/uzak dur · seviye ${lv} (ölçüm 8h −%2.4)` };
  if (c[j - 1] > w1 && below) return { k: "SAT", lv, d, t: `🔴 200 HMA AŞAĞI KIRILDI (−%1 bandının altında) → SAT · seviye ${lv} (ölçüm 8h −%2.4)` };
  if (c[j - 2] < w2 && c[j - 1] > w1 && c[j] > w0 * 0.99) return { k: "AL", lv, d, t: `🟢 200 HMA KIRILIMI TEYİT ETTİ (2. hafta da bandın üstünde) → AL (orta vade) · stop ${band}₺ altı haftalık kapanış (ölçüm 8h +%1.1; en iyi alım HMA'ya %3 yakın geri çekilmede)` };
  if (c[j - 1] > w1 && c[j] < w0) return { k: "IZLE", lv, d, t: `🟡 200 HMA güven bandında (%${d.toFixed(1)}, −%1 içinde) → SAT DEĞİL; ${band}₺ altı haftalık kapanış SAT` };
  let br = -1; for (let q = j - 8; q < j - 1; q++) if (c[q - 1] < m(q - 1) && c[q] > m(q)) br = q;
  if (br > 0 && a[j].low != null && a[j].low <= w0 * 1.03 && c[j] > w0 && c.slice(br, j).every((v, i) => v > m(br + i) * 0.99))
    return { k: "AL", lv, d, t: `🟢 200 HMA KIRILIM SONRASI GERİ ÇEKİLME → AL (orta vade) · stop ${band}₺ altı haftalık kapanış (ölçüm 4h +%1.3 · 8h +%3.0)` };
  if (c[j - 1] < w1 && c[j] > w0) return { k: "KIRILIM", lv, d, t: `🔔 200 HMA YUKARI KIRILIM · seviye ${lv} → ${d >= 5 ? "KOVALAMA (≥%5 üstünde, ölçüm −%7)" : "takibe al: kırılım haftası alım ölçümü −%2.9"}; AL = HMA'ya %3 yakın geri çekilme (+%3.0/8h) veya 2. hafta teyidi` };
  if (Math.abs(d) <= 3) return { k: "YAKIN", lv, d, t: `🧭 200 HMA'ya yakın (%${d.toFixed(1)}) · seviye ${lv} → ${band}₺ altı haftalık kapanış SAT · kırarsa geri çekilmede AL` };
  return null;
}
async function wmaScan() {
  const out = [];
  for (let i = 0; i < syms.length; i += CONC) await Promise.all(syms.slice(i, i + CONC).map(async s => { const r = wma200Status(await fetchWeekly(s).catch(() => [])); if (r && r.k !== "YAKIN") out.push({ sym: s, ...r }); }));
  const o = { SAT: 0, AL: 1, KIRILIM: 2, IZLE: 3 }; return out.sort((p, q) => o[p.k] - o[q.k] || p.sym.localeCompare(q.sym));
}
// ⚡ KISA VADE AL (1–3 gün) — yalnız ölçülmüş kaynaklar (3g piyasaya göre): dönüş günü toparlanan +%1.48 · güçlü kapanış +%0.39 ·
// trendde 3g düşüş +%0.26 · RSI2 (XU100 MA200 üstü) rastgeleye +%0.4. Dışlanan: gün ≤−%4 (−%1.25) ve endeks ≤−%1 iken ≥+%1 (−%1.0).
// Seviye (1–3 günlük işleme göre): giriş kapanış · stop 1×ATR (en çok %5) · hedef 1.5×ATR (en çok %7.5) · en çok 3 iş günü.
// Kaynak başına kota (dönüş 5 · güçlü 3 · trend3 3 · RSI2 3), toplam ≤10. Karnede "KV" olarak ölçülür.
function kvList(k, all = false) {
  const seen = new Set(), out = [], lone = r => k.xDay <= -1 && r.dr >= 1;
  const push = (r, why) => { if (seen.has(r.sym) || k.weakSet.has(r.sym) || lone(r) || !(r.atr > 0)) return false; seen.add(r.sym);
    const sd = Math.min(r.atr, r.c * 0.05), td = Math.min(1.5 * r.atr, r.c * 0.075);
    out.push({ ...r, why, stop: +(r.c - sd).toFixed(2), tgt: +(r.c + td).toFixed(2) }); return true; };
  const take = (arr, why, n) => { if (!all && isMuted("KV:" + why)) return; let c = 0; for (const r of arr || []) { if (c >= n) break; if (push(r, why)) c++; } };
  if (k.rev) take(k.top, "dönüş günü", 5);
  take(k.strong, "güçlü kapanış", 3);
  take(k.pull3, "trendde 3g düşüş", 3);
  take((k.ew || []).filter(r => r.k === "W5"), "Elliott 5. dalga", 3);
  take((k.rsi2 || []).map(r => ({ sym: r.sym, c: r.c, dr: 0, atr: (r.c - r.stop) / 2 })), "RSI2 dönüşü", 3);
  return out.slice(0, 10);
}
function paMsg(k) {
  const ew = (k.ew || []).filter(r => !isMuted("EW:" + r.k)).slice(0, 8), w = k.paw || [], g = t => [...new Set(w.filter(x => t.includes(x.k)).map(x => x.sym))];
  let m = "📐 ELLIOTT / FORMASYONLAR (ölçümlü)";
  m += ew.length ? "\n" + ew.map(r => `🟢 ${r.sym} · ${r.why} · giriş ${r.c}₺ · hedef ${r.tgt}₺ · stop ${r.stop}₺ (ölçüm ${r.m})`).join("\n") : "\nBugün Elliott AL kurulumu yok (5. dalga / zigzag ABC / üçgen / 3. dalga).";
  const sat = k.ews || []; if (sat.length) m += "\n" + sat.slice(0, 8).map(r => `🔴 ${r.sym} · ${r.why} · seviye ${r.lv}₺ (ölçüm ${r.m})`).join("\n");
  const dip = g(["DIP", "DIV", "W"]), tz = g(["DTK!"]), dt = g(["DTK"]);
  const ck = g(["CAK"]); if (ck.length) m += `\n⛔ Elliott kurulumu tuzak/dip uyarısıyla çakıştı → AL VERİLMEDİ (çakışma 10g −%1.8, 5 yıl): ${ck.join(", ")}`;
  if (dip.length) m += `\n⚠ Dipten dönüş görünümü (5 yıl ölçümü 10–20g −%0.7…−%1.4 → 10 gün tutmaya ALMA): ${dip.slice(0, 12).join(", ")}`;
  if (tz.length) m += `\n⚠ Düşen trend kırılımı — sert düşüş sonrası hacimli (10g −%1.6, TUZAK): ${tz.slice(0, 12).join(", ")}`;
  if (dt.length) m += `\n📐 Düşen trend kırılımı (ölçüm zayıf, 5 yıl 10g +%0.2 → tek başına alım değil): ${dt.slice(0, 12).join(", ")}`;
  return m;
}
function shortTermMsg(k, final) {
  const kv = kvList(k);
  let m = `⚡ KISA VADE AL (1–3 gün)${final ? " — gün sonu" : ""}${k.rev ? `\n🔄 Endeks dönüş günü: XU100 gün içi ${pct(k.xLow)} → ${pct(k.xDay)} (ertesi gün ölçümü ort +%0.45)` : ""}`;
  m += kv.length ? "\n" + kv.map(r => `🟢 ${r.sym} · giriş ${r.c}₺ · hedef ${r.tgt}₺ · stop ${r.stop}₺ · ${r.why}`).join("\n") : "\nBugün ölçülmüş kısa vade AL koşulu oluşmadı.";
  if (final && k.ma20?.length && !isMuted("MA20")) m += `\n📌 Yarın MA20 LİMİT ALIM (gün içi MA20'ye değerse; ölçüm aynı gün +%0.58, 3g +%0.45, en çok 5 gün):\n` + k.ma20.map(r => `🟢 ${r.sym} · limit ${r.lim}₺ (şu an %${r.dist.toFixed(1)} yukarıda) · hedef ${r.tgt}₺ · stop ${r.stop}₺`).join("\n");
  if (final) m += "\n\n" + paMsg(k);
  m += `\n🧊 Uzak dur (gün ≤−%4; 3g piyasaya −%1.3): ` + (k.weak.length ? k.weak.map(r => `${r.sym} ${pct(r.dr)}`).join(", ") : "yok");
  if (!k.upMkt) m += "\n(RSI2 dönüşü yalnız XU100 MA200 üstündeyken — şu an kapalı)";
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
// 🏆 BUGÜNÜN EN İYİLERİ (kullanıcı isteği 2026-11-28: tek sıralı liste). Tüm kaynaklar ÖLÇÜLMÜŞ GÜNLÜK fazla getiriye göre sıralanır
// (ölçülen fazla getiri ÷ ufuk günü; piyasaya göre). Susturulan kaynak girmez. Aynı hissede AL ve SAT kaynağı çakışırsa hisse listeye girmez.
// Hisse birden çok kaynakta varsa en güçlü kaynağı esas alınır, diğerleri "+N teyit" yazılır (teyit sayısı ayrıca ölçülmedi → sıralamayı değiştirmez).
// Kaynak başına en çok 2 hisse (MA20 limit gibi 1 günlük ufuklu kaynak günlük puanda öne geçip listeyi doldurmasın).
const TOP_SRC = {
  "KV:dönüş günü": { e: 1.48, h: 3, n: "endeks dönüş günü toparlanan" }, MA20: { e: 0.61, h: 1, n: "MA20 limit (yarın, değerse)" },
  "EW:W5": { e: 2.43, h: 10, n: "Elliott 5. dalga" }, GUCLUAL: { e: 1.60, h: 10, n: "GÜÇLÜ AL (tarama)" }, "EW:ABC": { e: 1.26, h: 10, n: "Elliott zigzag ABC" },
  "KV:güçlü kapanış": { e: 0.39, h: 3, n: "güçlü kapanış" }, WMA_AL: { e: 3.0, h: 40, n: "200 HMA geri çekilme/teyit" }, "KV:trendde 3g düşüş": { e: 0.22, h: 3, n: "trendde 3g düşüş" },
  "EW:W3": { e: 1.03, h: 20, n: "Elliott 3. dalga" }, "EW:TRI": { e: 0.41, h: 10, n: "Elliott üçgen" },
  UZAK: { e: 1.25, h: 3, n: "gün ≤−%4 (uzak dur)", sat: 1 }, "EW:IMP": { e: 3.42, h: 20, n: "Elliott itki bitti", sat: 1 }, TUZAK: { e: 1.61, h: 10, n: "hacimli düşen trend tuzağı", sat: 1 },
  "EW:TRI-": { e: 2.06, h: 20, n: "Elliott üçgen aşağı", sat: 1 }, GUCLUSAT: { e: 0.88, h: 10, n: "GÜÇLÜ SAT (tarama)", sat: 1 }, WMA_SAT: { e: 2.4, h: 40, n: "200 HMA aşağı kırılım", sat: 1 },
};
function topPicks(k, wl, ls, nAl = 5, nSat = 3) {
  const C = [], add = (key, sym, lv = {}) => { const d = TOP_SRC[key]; if (d && !isMuted(key)) C.push({ key, sym, sat: !!d.sat, sc: d.e / d.h, h: d.h, n: d.n, m: `${d.sat ? "−" : "+"}%${d.e} / ${d.h}g`, ...lv }); };
  if (k) { for (const r of kvList(k)) add("KV:" + r.why, r.sym, { c: r.c, stop: r.stop, tgt: r.tgt });
    for (const r of k.ma20 || []) add("MA20", r.sym, { c: r.lim, stop: r.stop, tgt: r.tgt, lim: 1 });
    for (const r of k.ew || []) add("EW:" + r.k, r.sym, { c: r.c, stop: r.stop, tgt: r.tgt });
    for (const r of k.ews || []) add("EW:" + r.k, r.sym, { c: r.c, lv: r.lv });
    for (const r of k.weak || []) add("UZAK", r.sym, { c: r.c });
    for (const r of k.paw || []) if (r.k === "DTK!") add("TUZAK", r.sym, { c: r.c }); }
  for (const r of ls?.gz || []) add(r.tier === "GÜÇLÜ AL" ? "GUCLUAL" : "GUCLUSAT", r.sym, r.tier === "GÜÇLÜ AL" ? { c: r.e, stop: r.s, tgt: r.t } : { c: r.e });
  for (const r of wl || []) { const c = +(r.lv * (1 + r.d / 100)).toFixed(2), sp = +(r.lv * 0.99).toFixed(2);
    if (r.k === "AL") add("WMA_AL", r.sym, { c, stop: sp, tgt: +(c + 2 * Math.max(c - sp, c * 0.02)).toFixed(2) }); else if (r.k === "SAT") add("WMA_SAT", r.sym, { c, lv: r.lv }); }
  const by = {}; for (const x of C) (by[x.sym] = by[x.sym] || []).push(x);
  const pick = sat => Object.values(by).filter(a => a.every(x => x.sat === sat)).map(a => { const b = [...a].sort((p, q) => q.sc - p.sc); return { ...b[0], conf: [...new Set(b.slice(1).map(x => x.n))] }; }).sort((p, q) => q.sc - p.sc || q.conf.length - p.conf.length);
  const cap = (arr, n) => { const c = {}, o = []; for (const x of arr) { if ((c[x.key] = (c[x.key] || 0) + 1) > 2) continue; o.push(x); if (o.length >= n) break; } return o; };   // kaynak başına en çok 2 → liste tek kaynağa boğulmaz
  return { al: cap(pick(false), nAl), sat: cap(pick(true), nSat), clash: Object.entries(by).filter(([, a]) => a.some(x => x.sat) && a.some(x => !x.sat)).map(([s]) => s) };
}
function topMsg(T) {
  const L = x => x.conf.length ? ` · +${x.conf.length} teyit (${x.conf.join(", ")})` : "";
  let m = "🏆 BUGÜNÜN EN İYİLERİ (tüm kaynaklar, ölçülmüş günlük getiriye göre sıralı)";
  m += T.al.length ? "\n" + T.al.map((x, i) => `${i + 1}. 🟢 ${x.sym} · ${x.lim ? "limit " : "giriş "}${x.c}₺ · hedef ${x.tgt}₺ · stop ${x.stop}₺ · ${x.n} (${x.m})${L(x)}`).join("\n") : "\nAL: bugün ölçülmüş kaynakta aday yok.";
  if (T.sat.length) m += "\n" + T.sat.map((x, i) => `${i + 1}. 🔴 ${x.sym} · ${x.c != null ? x.c + "₺ · " : ""}${x.n} (${x.m})${x.lv ? ` · seviye ${x.lv}₺` : ""} → elde varsa çık, alma${L(x)}`).join("\n");
  if (T.clash.length) m += `\n⚖ AL ve SAT kaynağı çakışan (listeye alınmadı): ${T.clash.slice(0, 10).join(", ")}`;
  return m;
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
  try { const wl = await wmaScan(); _site.wma = wl; const G = { AL: [], SAT: [], KIRILIM: [], IZLE: [] }; for (const r of wl) G[r.k].push(r);
    const held = new Set([...Object.keys(st.pos || {}), ...(st.mp?.monthly || []).map(x => x.sym), ...(st.mp?.quarterly || []).map(x => x.sym), ...WATCH]);
    const hit = wl.filter(r => r.k === "SAT" && held.has(r.sym));
    m += "\n\n🧭 200 HAFTALIK ORTALAMA (hafta kapanışında kesinleşir · güven bandı −%1)";
    if (hit.length) m += "\n⚠ PORTFÖY/TAKİP: " + hit.map(r => `${r.sym} 200 HMA ${r.lv}₺ altına kırdı → çık/azalt`).join(" · ");
    m += G.AL.length ? "\n" + G.AL.slice(0, 10).map(r => `${r.sym}: ${r.t}`).join("\n") : "\n🟢 AL kurulumu yok (geri çekilme / teyit).";
    if (G.SAT.length) m += `\n🔴 SAT (−%1 bandı altına kırdı; ölçüm 8h −%2.4): ${G.SAT.map(r => `${r.sym} ${r.lv}₺`).join(", ")}`;
    if (G.KIRILIM.length) m += `\n🔔 YUKARI KIRILIM (takibe al; alım geri çekilmede): ${G.KIRILIM.map(r => `${r.sym} ${r.lv}₺${r.d >= 5 ? " (kovalama)" : ""}`).join(", ")}`;
    if (G.IZLE.length) m += `\n🟡 Bantta (SAT değil, −%1 altı kapanış SAT): ${G.IZLE.map(r => `${r.sym} ${r.lv}₺`).join(", ")}`;
  } catch (e) { console.error("200 HMA:", e.message); }
  try { const T = topPicks(await shortTermC(), _site.wma || [], st.lastScan); _site.top = T; const head = m.indexOf("\n\n"); m = m.slice(0, head) + "\n\n" + topMsg(T) + m.slice(head); } catch (e) { console.error("En iyiler:", e.message); }
  return m + "\n\n⚠ Yatırım tavsiyesi değildir.";
}
async function runSummaryMode() {
  const st = await gistGet(PAPER_FILE, null), istD = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
  if (!st || st === READ_FAILED || typeof st.cash !== "number") { console.error("Gün sonu: gist okunamadı"); return; }
  if (st.lastSummaryDay === istD && process.env.MODE !== "summary") { console.log("Gün sonu özeti bugün zaten gönderildi."); return; }
  // FİKİR KARNESİ: açık fikirleri sonuçlandır (HEDEF / STOP / SÜRE, R katı), bugünün kısa vade fikirlerini kaydet, eşiği ayarla
  let karne = "";
  try {
    const b = await ideasEval();
    if (b) {
      karne = karneText(b, 30);
      st.muted = muteCalc(b); setMuted(st); const mt = mutedText(st.muted); if (mt) karne += "\n" + mt;
      const old = st.alertMinConf || 65, nw = tuneMinConf(b, old);
      if (nw !== old) { st.alertMinConf = nw; karne += `\n🎚 Yeni AL bildirimi eşiği: güven ≥%${nw} (karne: %${old} eşiğinde ortalama R ≤ 0; yalnız sıkılaşır)`; }
    }
    const k = await shortTermC();
    if (k) await ideasAdd(kvList(k, true).map(r => ({ k: "KV", sym: r.sym, d: k.day, e: r.c, s: r.stop, t: r.tgt, h: 3, why: r.why })));
    if (k) await ideasAdd((k.ew || []).map(r => ({ k: "EW", src: r.k, sym: r.sym, d: k.day, e: r.c, s: r.stop, t: r.tgt, h: r.k === "W3" || r.k === "TRI" ? 20 : 10, why: r.why })));
    if (k?.ma20) st.ma20 = { made: k.day, items: k.ma20, hit: [] };   // ertesi işlem günü seansta izlenir
  } catch (e) { console.error("Fikir karnesi:", e.message); }
  const ok = await sendTG(await daySummary(st) + (karne ? "\n\n" + karne : ""));
  try { const R = await mcpReco(st); _site.mcp = { ok: R.ok, err: R.err, sc: R.sc, an: Object.fromEntries(Object.entries(R.an).map(([s, a]) => [s, { c: anTr(a.consensus), b: (a.strong_buy || 0) + (a.buy || 0), h: a.hold || 0, s: (a.sell || 0) + (a.strong_sell || 0), mt: a.mean_target, px: R.px[s] }])) }; await sendTG(mcpRecoMsg(R)); } catch (e) { console.error("MCP önerileri:", e.message); }
  // site verisi: kısa vade, MA20 limit, 200 HMA, karne, model portföy (gün sonu)
  try { const k = await shortTermC(); await siteSave({ kisa: k ? { day: k.day, rev: k.rev, xDay: k.xDay, upMkt: k.upMkt, al: kvList(k), ma20: isMuted("MA20") ? [] : k.ma20 || [], weak: k.weak.map(r => ({ sym: r.sym, dr: r.dr })), ew: (k.ew || []).filter(r => !isMuted("EW:" + r.k)).slice(0, 12).map(r => ({ sym: r.sym, c: r.c, why: r.why, m: r.m, stop: r.stop, tgt: r.tgt })), paw: (k.paw || []).map(r => ({ sym: r.sym, k: r.k, t: r.t })), ews: (k.ews || []).map(r => ({ sym: r.sym, why: r.why, m: r.m, lv: r.lv })) } : null,
      wma: _site.wma || [], top: _site.top || null, muted: st.muted || {}, mcp: _site.mcp || null, karne: karne || "", model: st.mp || null, mpHist: st.mpHist || [], mpPerf: await mpPerf(st).then(p => p && { m: { since: p.m.since, day: p.m.day }, q: { since: p.q.since, day: p.q.day }, xSince: p.xSince }).catch(() => null) }); } catch (e) { console.error("Site verisi:", e.message); }
  // HAFTALIK KARNE (Cuma): haftanın fikir karnesi + AI TRADER / model portföy / XU100 haftası — tek mesaj
  if (ok && new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", weekday: "short" }).format(new Date()) === "Fri") {
    try {
      const b = await ideasLoad(), eqL = st.equityLog || [], w0 = eqL.length > 5 ? eqL[eqL.length - 6].eq : eqL[0]?.eq, w1 = eqL.at(-1)?.eq;
      const x = await fetchDaily("XU100").catch(() => []), xw = x.length > 5 ? (x.at(-1).close / x.at(-6).close - 1) * 100 : null, p = await mpPerf(st);
      await sendTG(`📅 HAFTALIK KARNE · ${fmtTime()}\n\n` + (b ? karneText(b, 7) : "Karne okunamadı.")
        + `\n\n📊 AI TRADER hafta: ${w0 && w1 ? pct((w1 / w0 - 1) * 100) : "?"} · 🏛 XU100 hafta: ${pct(xw)}`
        + (p ? `\n💼 Model portföy (${st.mp.date} tarihinden beri): aylık ${pct(p.m.since)} · 3 aylık ${pct(p.q.since)} · XU100 ${pct(p.xSince)}` : "")
        + "\n\n⚠ Yatırım tavsiyesi değildir.");
    } catch (e) { console.error("Haftalık karne:", e.message); }
  }
  if (ok) { st.lastSummaryDay = istD; await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } }); }
  console.log(`Gün sonu özeti ${ok ? "gönderildi" : "GÖNDERİLEMEDİ"}`);
}
// ---------- FİKİR KARNESİ (ABD botundan): gönderilen her fikir kaydedilir, ufku dolunca günlük mumlarla sonuçlanır ----------
// Fikir: { k: AL|TETIK|DONUS|GUCLU, sym, d (giriş günü), e (giriş), s (stop), t (hedef), h (ufuk, işlem günü), conf? }
// Sonuç: giriş gününden SONRAKİ mumlarda önce stop'a bakılır (aynı mumda ikisi = STOP, temkinli), sonra hedef; ufuk dolarsa SÜRE (kapanıştan).
const IDEAS = "eagle_ideas.json", _newIdeas = [];
async function ideasLoad() { const x = await gistGet(IDEAS, { open: [], closed: [] }); return x === READ_FAILED || !x ? null : { open: x.open || [], closed: x.closed || [] }; }
async function ideasAdd(items) {
  if (!items.length) return; const b = await ideasLoad(); if (!b) return;
  const key = i => i.k + ":" + i.sym + ":" + i.d, have = new Set([...b.open, ...b.closed].map(key));
  let n = 0; for (const i of items) if (!have.has(key(i)) && i.e > i.s && i.t > i.e) { b.open.push(i); have.add(key(i)); n++; }
  if (n) await gistPut({ [IDEAS]: { content: JSON.stringify(b) } });
}
async function ideasEval() {
  const b = await ideasLoad(); if (!b) return null;
  const still = [], cache = new Map(), bars = s => cache.get(s) || cache.set(s, fetchDaily(s).catch(() => [])).get(s);   // sembol başına TEK çekim
  for (const i of b.open) {
    const after = (await bars(i.sym)).filter(x => istDayOf(x.ts) > i.d); let res = null;
    for (let n = 0; n < after.length; n++) { const x = after[n];   // cd = sonucun GERÇEKLEŞTİĞİ gün (eskiden verinin son günüydü → 30 günlük karne penceresi kayıyordu)
      if (x.low <= i.s) { res = { r: "STOP", x: i.s, cd: istDayOf(x.ts) }; break; } if (x.high >= i.t) { res = { r: "HEDEF", x: i.t, cd: istDayOf(x.ts) }; break; } if (n + 1 >= i.h) { res = { r: "SÜRE", x: x.close, cd: istDayOf(x.ts) }; break; } }
    if (res) b.closed.push({ ...i, ...res, R: +((res.x - i.e) / (i.e - i.s)).toFixed(2) }); else still.push(i);
  }
  b.open = still; b.closed = b.closed.slice(-500);
  await gistPut({ [IDEAS]: { content: JSON.stringify(b) } });
  return b;
}
const KN = { AL: "🔔 Yeni AL", TETIK: "🎯 Takip tetiği", KV: "⚡ Kısa vade AL", MA20: "📌 MA20 limit", DONUS: "🔄 Dönüş günü", GUCLU: "🚀 Güçlü kapanış", RSI2: "🔄 RSI2 dönüşü", EW: "📐 Elliott" };
function karneText(b, days) {
  const lim = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10), c = b.closed.filter(x => x.cd >= lim);
  if (!c.length) return `📒 KARNE (${days} gün): henüz sonuçlanan fikir yok · açık ${b.open.length}`;
  const g = {}; for (const x of c) (g[x.k] = g[x.k] || []).push(x);
  return `📒 KARNE (${days} gün · açık ${b.open.length})\n` + Object.entries(g).map(([k, a]) => `${KN[k] || k}: ${a.length} fikir · hedef ${a.filter(x => x.r === "HEDEF").length} · stop ${a.filter(x => x.r === "STOP").length} · süre ${a.filter(x => x.r === "SÜRE").length} · isabet %${Math.round(a.filter(x => x.R > 0).length / a.length * 100)} · ort ${(a.reduce((p, x) => p + x.R, 0) / a.length).toFixed(2)}R`).join("\n");
}
// 🔇 KARNEYE GÖRE OTOMATİK SUSTURMA (2026-11-28): son 90 günde ≥20 sonuçlanmış fikri olan kaynağın ortalama R'si ≤ 0 ise kaynak
// mesajlardan / listelerden / "en iyi" sıralamadan çıkar. Fikirleri GÖLGEDE kaydedilmeye devam eder → ort. R > 0'a dönerse kendiliğinden açılır.
// Yeni AL (tarama) ve takip tetiği susturulmaz (AL eşiği tuneMinConf ile ayrıca sıkılaşır).
let _muted = new Set();
const setMuted = st => { _muted = new Set(Object.keys(st?.muted || {})); };
const isMuted = key => _muted.has(key);
const srcKey = x => x.k === "KV" ? "KV:" + (x.why || "?") : x.k === "EW" ? "EW:" + (x.src || "?") : x.k;
function muteCalc(b, days = 90, minN = 20) {
  const lim = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10), g = {};
  for (const x of b?.closed || []) if (x.cd >= lim && x.k !== "AL" && x.k !== "TETIK" && typeof x.R === "number") (g[srcKey(x)] = g[srcKey(x)] || []).push(x.R);
  const out = {}; for (const [k, a] of Object.entries(g)) { const r = a.reduce((p, v) => p + v, 0) / a.length; if (a.length >= minN && r <= 0) out[k] = { n: a.length, r: +r.toFixed(2) }; }
  return out;
}
const mutedText = m => { const e = Object.entries(m || {}); return e.length ? "🔇 Susturulan kaynaklar (karne: 90 günde ≥20 sonuç, ort. R ≤ 0; düzelirse kendiliğinden açılır): " + e.map(([k, v]) => `${k.replace(/^(KV|EW):/, "")} (${v.n} fikir, ort. R ${v.r})`).join(" · ") : ""; };
// EŞİK AYARI (ABD botundan): son 90 gün ≥20 sonuçlanmış AL fikri olan eşiklerden; mevcut eşikte ort. R ≤ 0 ise ort. R > 0 olan EN DÜŞÜK
// daha yüksek eşik seçilir. Yalnız SIKILAŞIR (bot kendi kendine gevşemez).
function tuneMinConf(b, cur) {
  const lim = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10), a = b.closed.filter(x => x.k === "AL" && x.cd >= lim && x.conf != null);
  const st_ = t => { const s = a.filter(x => x.conf >= t); return { n: s.length, r: s.length ? s.reduce((p, x) => p + x.R, 0) / s.length : 0 }; };
  const c = st_(cur); if (c.n < 20 || c.r > 0) return cur;
  for (const t of [75, 85, 90]) if (t > cur) { const s = st_(t); if (s.n >= 20 && s.r > 0) return t; }
  return cur;
}
// MAKRO TAKVİM: TCMB PPK (bot/macro.json) + TÜİK enflasyon (her ayın 3'ü; hafta sonuysa ilk iş günü) 10:00
function macroToday(d) {
  const out = [];
  if ((MACRO.ppk || []).includes(d)) out.push("TCMB faiz kararı 14:00");
  const [y, mo] = d.split("-").map(Number); let c = new Date(Date.UTC(y, mo - 1, 3)); while ([0, 6].includes(c.getUTCDay())) c = new Date(c.getTime() + 864e5);
  if (c.toISOString().slice(0, 10) === d) out.push("TÜİK enflasyon verisi 10:00");
  return out;
}
const istHM = () => { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()); return +p.find(x => x.type === "hour").value * 60 + +p.find(x => x.type === "minute").value; };
let _staleNote = "", _macroNote = "";
// SİTE VERİSİ (gist eagle_signals.json): botun ürettiği her şeyin son hali → standalone/bot.html okur (uygulama gist'e YAZMAZ, yalnız okur).
const SITE = "eagle_signals.json", _site = {};
async function siteSave(part) {
  const cur = await gistGet(SITE, {}); if (cur === READ_FAILED || !cur || typeof cur !== "object") return;
  Object.assign(cur, part, { ts: Date.now() }); await gistPut({ [SITE]: { content: JSON.stringify(cur) } });
}
const siteRow = s => { const l = lv(s); return { sym: s.sym, tier: tierOf(s), e: s.price, t: l.tgt, s: l.stop, conf: s.confidence }; };
const HELP = "🤖 KOMUTLAR\n/durum — AI TRADER anlık\n/performans — işlem istatistiği\n/model — model portföy ve getirisi\n/takip — takip listesi (12 hisse/endeks)\n/hisse SEMBOL — herhangi bir hisse için trade önerisi + Borsa MCP kartı (analist, teknik, F/K, bilanço) (örn. /hisse THYAO)\n/tara — tüm AL/SAT listesi (giriş · hedef · stop)\n/karne — gönderilen fikirlerin sonucu (HEDEF/STOP/SÜRE, 7 ve 30 gün)\n/yorum SEMBOL — Grok ile X (Twitter) duyarlılığı\n/aitest — AI anahtar testi\n\nNot: bot seansta 15 dk'da bir çalışır → cevap en geç ~15 dk içinde; seans dışında bir sonraki çalışmada.";
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
  // KOMUT MODU (seans dışı saatlik tetik): bekleyen Telegram komutu yoksa hemen çık; varsa (gerekiyorsa tarayıp) cevapla.
  // Eskiden komutlar yalnız seans içinde okunuyordu → hafta sonu/gece yazılan /tara Pazartesi'ye kadar cevapsız kalıyordu.
  if (process.env.EAGLE_MODE === "cmd") {
    const st = await gistGet(PAPER_FILE, null);
    if (!st || st === READ_FAILED || !TG_TOKEN || !TG_CHAT) return console.log("Komut modu: gist/Telegram yok.");
    setMuted(st);
    let ups = [];
    try { const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${st.tgOffset || 0}&timeout=0`, { signal: AbortSignal.timeout(15000) }); ups = (await r.json()).result || []; } catch {}
    const mine = ups.filter(u => String(u.message?.chat?.id) === String(TG_CHAT) && (u.message?.text || "").startsWith("/"));
    if (!mine.length) { if (ups.length) { st.tgOffset = ups.at(-1).update_id + 1; await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } }); } return console.log("Komut modu: bekleyen komut yok."); }
    let signals = [], bearRegime = false;
    if (mine.some(u => /^\/(tara|hisse|takip|start)/i.test(u.message.text))) {   // canlı sinyal gerektirenler → tara
      const sig = await scanAll(), idxRows = await fetchDaily("XU100").catch(() => []), mc = marketContext(sig, idxRows, idxRows.at(-1)?.close ?? null);
      signals = mc.signals; bearRegime = mc.bearRegime;
    }
    await handleCommands(st, { signals, bearRegime });
    return console.log(`Komut modu: ${mine.length} komut işlendi.`);
  }
  const t0 = Date.now();
  console.log("Tarama başlıyor:", syms.length, "sembol");
  let signals = await scanAll();
  console.log(`Tarama bitti ${((Date.now() - t0) / 1e3).toFixed(1)}s · ${signals.length} sinyal (${signals.filter(s => s.signal === "AL").length} AL, ${signals.filter(s => s.signal === "SAT").length} SAT)`);

  const xuNow = await fetchIndexClose("XU100").catch(() => null);  // endeks (XU100) anlık

  // ---------- GÖRELİ GÜÇ (RS vs XU100) + SEKTÖR LİDERLİĞİ + PİYASA REJİMİ ----------
  const idxRows = await fetchDaily("XU100").catch(() => []);
  // CANLI VERİ DENETİMİ (ABD botundan): seans içinde (10:20 sonrası; Yahoo ~15 dk gecikmeli) XU100'ün son mumu BUGÜN değilse ya da son fiyat
  // 45 dk'dan eskiyse veri bayat → AI TRADER işlem yapmaz, yeni AL bildirimi gitmez, raporda ⛔ satırı (2026-11-28 "bot bugünü görmüyordu" dersi).
  {
    const todayIst = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" }), hm = istHM(), xl = idxRows.at(-1), age = idxRows.t ? (Date.now() - idxRows.t) / 60000 : null;
    if (isTradingHours() && hm >= 620 && hm <= 1080 && (!xl || istDayOf(xl.ts) !== todayIst || (age != null && age > 45)))
      _staleNote = `⛔ VERİ BAYAT: XU100 son veri ${!xl ? "yok" : istDayOf(xl.ts) !== todayIst ? istDayOf(xl.ts) + " tarihli (bugün değil — tatil ya da Yahoo sorunu)" : Math.round(age) + " dk önce"} → bu taramada AI TRADER işlem yapmadı, yeni AL bildirimi gönderilmedi.`;
    const mc_ = macroToday(todayIst); if (mc_.length) _macroNote = "📅 Bugün: " + mc_.join(" · ") + " — açıklama saatine yakın kırılımlara temkinli yaklaş (sahte kırılım riski).";
  }
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
    st = await runPaper(signals, xuNow, bearRegime, null, { breadth, volScale, idxRet60: mc.idxRet60, stale: !!_staleNote }); setMuted(st);
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
      const minC = st.alertMinConf || 65, al = fresh.filter(s => (s.confidence || 0) >= minC);   // karneye göre eşik (yalnız sıkılaşır)
      if (!doReport && isTradingHours() && !_staleNote && al.length) { await sendTG(`🔔 YENİ AL SİNYALİ · ${fmtTime()}\n` + al.map(sigLine).join("\n") + (_macroNote ? "\n" + _macroNote : "") + "\n\n⚠ Yatırım tavsiyesi değildir."); sent++; }
      if (isTradingHours() && !_staleNote) for (const s of al) { const l = lv(s); _newIdeas.push({ k: "AL", sym: s.sym, d: istDay, e: s.price, s: l.stop, t: l.tgt, h: 10, conf: s.confidence || 0 }); }
      dirty = true;
    }
  }
  // Son taramanın özeti (gün sonu özeti için): AL/SAT listeleri + takip hisselerinin canlı sinyali
  if (st) { st.lastScan = { t: Date.now(), gz: signals.filter(s => tierOf(s).startsWith("GÜÇLÜ")).slice(0, 30).map(siteRow), al: signals.filter(s => s.signal === "AL").map(s => s.sym), sat: signals.filter(s => s.signal === "SAT").map(s => s.sym), w: Object.fromEntries(signals.filter(s => WATCH.includes(s.sym)).map(s => [s.sym, { signal: s.signal, confidence: s.confidence, stopLoss: s.stopLoss, target1: s.target1, dip: s.dip, price: s.price, atr: s.atr, pUp: s.pUp, pDn: s.pDn, strongClose: s.strongClose, bigDrop: s.bigDrop, trendUp: s.trendUp, trendDn: s.trendDn }])) }; dirty = true; }
  // BOT DURDU UYARISI (ABD botundan): seans içinde aynı gün önceki çalışmadan 45 dk+ geçtiyse (GitHub zamanlayıcı gecikmesi) bildir
  if (st) {
    const prev = st.lastRunAt;
    if (isTradingHours() && prev && istDayOf(prev) === istDay && Date.now() - prev > 45 * 60000) { await sendTG(`⚠ Bot ${Math.round((Date.now() - prev) / 60000)} dk çalışmadı (GitHub zamanlayıcı gecikmesi) — şimdi yeniden çalışıyor. Bu arada AL/SAT ve stop kontrolleri yapılamadı.`); sent++; }
    st.lastRunAt = Date.now(); dirty = true;
  }
  // ANINDA UYARILAR (seans içinde her tarama): takip listesi tetiği + kapanışa yakın model portföy stop'u — veri bayatsa YOK
  if (st && isTradingHours() && !_staleNote) {
    try { sent += await watchAlerts(signals, bearRegime, st); dirty = true; } catch (e) { console.error("Tetik uyarısı:", e.message); }
    // 🔄 ENDEKS DÖNÜŞÜ (gün içi, günde 1): XU100 bugün dünkü kapanışın ≤%1 altına indi ve şimdi üstünde → anında + o anki en çok toparlananlar
    try {
      const xt = idxRows.at(-1), xp = idxRows.at(-2)?.close;
      if (xt && xp && istDayOf(xt.ts) === istDay && st.revDay !== istDay && xt.low <= xp * 0.99 && xt.close > xp) {
        const k = await shortTermC();
        if (k?.rev) { await sendTG(`🔄 ENDEKS DÖNÜŞÜ (gün içi) · ${fmtTime()}\n` + shortTermMsg(k, false) + "\n\nGün içi fiyat (~15 dk gecikmeli); kesin liste gün sonu özetinde.\n⚠ Yatırım tavsiyesi değildir."); st.revDay = istDay; sent++; dirty = true; }
      }
    } catch (e) { console.error("Endeks dönüşü:", e.message); }
    // 📌 MA20 LİMİT DOLDU: dünkü listedeki hisse bugün gün içi MA20 limitine değdi → anında bildirim + karne (giriş = limit, 5 gün)
    if (st.ma20?.items?.length && st.ma20.made < istDay) {
      const hits = [];
      for (const r of st.ma20.items) { if (st.ma20.hit.includes(r.sym)) continue; const b = (await fetchDaily(r.sym).catch(() => [])).at(-1);
        if (b && istDayOf(b.ts) === istDay && b.low <= r.lim) { st.ma20.hit.push(r.sym); hits.push(r); _newIdeas.push({ k: "MA20", sym: r.sym, d: istDay, e: Math.min(r.lim, b.open), s: r.stop, t: r.tgt, h: 5 }); } }
      if (hits.length) { await sendTG(`✅ MA20 LİMİT DOLDU · ${fmtTime()}\n` + hits.map(r => `🟢 ${r.sym} · alım ${r.lim}₺ · hedef ${r.tgt}₺ · stop ${r.stop}₺ · en çok 5 gün`).join("\n") + "\n\nÖlçüm: aynı gün piyasaya +%0.58, 3g +%0.45 (limit fiyattan alımda).\n⚠ Yatırım tavsiyesi değildir."); sent++; }
      dirty = true;
    }
    // 17:30 sonrası HER taramada (kapanışa en yakın fiyat); uyarılan hisse st.mp.stopped'da → tekrar yok
    if (istHour * 60 + istMin >= 1050) { try { sent += await mpStops(st); dirty = true; } catch (e) { console.error("Model stop:", e.message); } }
  }
  if (st && dirty && !doReport) await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });   // rapor taramasında aşağıda kaydedilir
  if (_newIdeas.length) { try { await ideasAdd(_newIdeas); } catch (e) { console.error("Fikir karnesi:", e.message); } }

  if (doReport) {
    // 1) HİSSE TARA — TÜM AL/SAT (en güçlü 15 ayrıntılı + kalanı kısa liste)
    await sendTG(buildScanMsg(signals, gistErr, newSet)); sent++;
    // 1b) TAKİP LİSTESİ — kullanıcının hisseleri için ayrı trade önerisi mesajı (her raporda)
    try { await sendTG(await watchMsg(signals, bearRegime, st)); sent++; } catch (e) { console.error("Takip listesi:", e.message); }
    // site verisi: tarama + takip listesi + AI TRADER (her raporda)
    try {
      const gz = s => tierOf(s).startsWith("GÜÇLÜ") ? 0 : 1, w = await watchEval(signals, bearRegime, st);
      await siteSave({ scan: { t: Date.now(), bear: bearRegime, stale: _staleNote || "", macro: _macroNote || "",
          al: signals.filter(s => s.signal === "AL").sort((a, b) => gz(a) - gz(b) || b.confidence - a.confidence).map(siteRow),
          sat: signals.filter(s => s.signal === "SAT").sort((a, b) => gz(a) - gz(b) || b.confidence - a.confidence).map(siteRow) },
        takip: w.map(x => ({ sym: x.sym, text: x.text })),
        trader: st ? { closed: (st.trades || []).slice(0, 15).map(t => ({ sym: t.sym, entry: t.entry, exit: t.exit, pnlPct: t.pnlPct, reason: t.reason, open: t.open, close: t.close, setup: t.setup })), cash: st.cash, start: st.start, pos: Object.entries(st.pos || {}).map(([s, p]) => ({ sym: s, lot: p.lot, entry: p.entry, last: (signals.find(x => x.sym === s) || {}).price || p.entry, sl: p.sl, tp: p.tp, setup: p.setup })) } : null });
    } catch (e) { console.error("Site verisi:", e.message); }

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
      if (isTradingHours() && !_staleNote && st.lastMPWeek !== weekKey(Date.now())) { try { if (await mpSend(st)) { st.lastMPWeek = weekKey(Date.now()); sent++; } } catch (e) { console.error("Model portföy:", e.message); } }
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
export { ideasAdd, ideasEval, ideasLoad, karneText, tuneMinConf, macroToday };
export { candlePatterns, tierOf, rsi2Core, kvList, wma200Status, wmaScan, paCore, zigzag, mcpReco, mcpRecoMsg, mcpStock, topPicks, topMsg, muteCalc, setMuted };
export { runPaper, heldInfo, sigLine, watchMsg, watchAlerts, ideaFor, daySummary, modelStatus, HELP, shortTerm, shortTermMsg, scanOne, scanAll, marketContext, perfStats, setupStats, disabledSetups, setupPauses, riskMult, setupOf, sendTG, buildScanMsg, mcpEnrich, scanIndices, aiDaily, handleCommands };
