/* eslint-disable */
/* eslint-disable */
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area } from "recharts";
import { BIST_STOCKS } from "./bistList";


// ═══════════════════════════════════════════════════════════
// SABITLER
// ═══════════════════════════════════════════════════════════
const EMAILJS_SERVICE_ID  = "service_c4ytizq";
const EMAILJS_TEMPLATE_ID = "template_v35f6eq";
const EMAILJS_PUBLIC_KEY  = "78D7vQHmRuhtjqUtF";

const LS_KEY        = "feybot_v12";
const LS_PREVSIGS   = "feybot_sigs";
const LS_FAVS       = "feybot_favs";
const LS_SIGHIST    = "feybot_sighist";
const LS_ALERTS     = "feybot_alerts";
const LS_EMAIL      = "feybot_email";

// ═══════════════════════════════════════════════════════════
// HİSSE LİSTESİ (sabit, ~500 BIST sembolü)
// ═══════════════════════════════════════════════════════════
const STOCKS = BIST_STOCKS.map(([sym, name]) => ({ symbol: sym, name }));
const STOCKS_MAP = Object.fromEntries(BIST_STOCKS);

// ═══════════════════════════════════════════════════════════
// VERİ KAYNAĞI — Yahoo Finance + 5 CORS proxy fallback
// ═══════════════════════════════════════════════════════════
// Test edilmiş proxy listesi — PARALEL deneme yapılır (Promise.any).
// İlk başarılı sonuç döner, diğerleri iptal. Toplam max bekleme = timeout.
const PROXIES = [
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  (u) => `https://corsproxy.io/?${u}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://api.cors.lol/?url=${encodeURIComponent(u)}`,
  (u) => `https://cors.eu.org/${u}`,
  (u) => `https://yacdn.org/serve/${u}`,
];

async function fetchOne(makeUrl, url, timeout) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(makeUrl(url), { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error("http " + res.status);
    const j = await res.json();
    if (!j) throw new Error("empty");
    return j;
  } catch (e) {
    clearTimeout(tid);
    throw e;
  }
}

async function fetchJSON(url, timeout = 5000) {
  // Tüm proxy'leri PARALEL başlat, ilk gelen kazansın
  const attempts = PROXIES.map(make => fetchOne(make, url, timeout));
  // Direkt fetch'i de yarışa kat (CORS izniyse anında döner)
  attempts.push((async () => {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) throw new Error("http " + res.status);
      return await res.json();
    } catch (e) { clearTimeout(tid); throw e; }
  })());
  try { return await Promise.any(attempts); }
  catch { return null; }
}

// İŞ YATIRIM FALLBACK — Yahoo başarısız olursa son çare. Kapatmak için: false
const USE_ISY_FALLBACK = true;
async function fetchIsyatirimDaily(symbol) {
  if (!USE_ISY_FALLBACK) return null;
  const fmt = d => `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
  const now = new Date(); const past = new Date(now); past.setMonth(past.getMonth() - 6);
  const url = `https://www.isyatirim.com.tr/_layouts/15/Isyatirim.Website/Common/Data.aspx/HisseTekil?hisse=${symbol}&startdate=${fmt(past)}&enddate=${fmt(now)}`;
  const j = await fetchJSON(url, 6000);
  if (!j?.value?.length) return null;
  const rows = j.value.map(v => {
    // İş Yatırım format: "DD-MM-YYYY" veya "DD-MM-YYYY HH:mm:ss"
    const parts = (v.HGDG_TARIH || "").split(/[-\s:]/);
    const ts = parts.length >= 3 ? new Date(+parts[2], +parts[1]-1, +parts[0]).getTime() : 0;
    return {
      ts, date: (v.HGDG_TARIH || "").substring(0, 5),
      close: +(+v.HGDG_KAPANIS).toFixed(2),
      open:  +(+v.HGDG_AOF).toFixed(2),
      high:  +(+v.HGDG_MAX).toFixed(2),
      low:   +(+v.HGDG_MIN).toFixed(2),
      volume: v.HGDG_HACIM ?? 0,
    };
  }).filter(r => r.close > 0).sort((a, b) => a.ts - b.ts);
  return rows.length > 10 ? { rows, meta: { source: "isyatirim" } } : null;
}

// Yahoo Finance OHLCV — interval ve range parametrik
async function fetchYahooChart(symbol, interval = "15m", range = "5d") {
  let url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.IS?interval=${interval}&range=${range}&includePrePost=false`;
  let j   = await fetchJSON(url, 5000);
  // KRİTİK FALLBACK 1: piyasa kapalı / hafta sonu / tatil → 1d
  if (!j?.chart?.result?.[0]?.timestamp?.length) {
    url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.IS?interval=1d&range=3mo&includePrePost=false`;
    j   = await fetchJSON(url, 5000);
  }
  const r = j?.chart?.result?.[0];
  // KRİTİK FALLBACK 2: Yahoo tamamen ölmüşse → İş Yatırım daily
  if (!r?.timestamp?.length) return await fetchIsyatirimDaily(symbol);
  const q  = r.indicators.quote[0];
  const tz = r.meta?.gmtoffset ?? 10800; // İstanbul = +3
  const isIntraday = interval.endsWith("m") || interval.endsWith("h");
  const rows = [];
  r.timestamp.forEach((t, i) => {
    if (q.close[i] == null) return;
    const d = new Date((t + tz) * 1000); // server'ın UTC'sine offset eklenir → İstanbul saati
    const date = isIntraday
      ? `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`
      : `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}`;
    rows.push({
      ts: t * 1000,
      date,
      close:  +(+q.close[i]).toFixed(2),
      open:   +(+(q.open[i]  ?? q.close[i])).toFixed(2),
      high:   +(+(q.high[i]  ?? q.close[i])).toFixed(2),
      low:    +(+(q.low[i]   ?? q.close[i])).toFixed(2),
      volume: q.volume[i] ?? 0,
    });
  });
  return rows.length ? { rows, meta: r.meta } : null;
}

// ═══════════════════════════════════════════════════════════
// KRİPTO — Binance API (CORS izinli, direkt erişim, hızlı)
// ═══════════════════════════════════════════════════════════
async function fetchTopCryptos() {
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 6000);
    const res  = await fetch("https://api.binance.com/api/v3/ticker/24hr", { signal: ctrl.signal });
    clearTimeout(tid);
    const data = await res.json();
    return data
      .filter(d => d.symbol.endsWith("USDT") && parseFloat(d.quoteVolume) > 1000000)
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 50)
      .map(d => ({
        symbol: d.symbol.replace("USDT", ""),
        pair: d.symbol,
        price: parseFloat(d.lastPrice),
        rate: parseFloat(d.priceChangePercent),
        volume: parseFloat(d.quoteVolume),
      }));
  } catch (e) { return []; }
}

async function fetchCryptoKlines(pair, interval = "15m", limit = 200) {
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 6000);
    const res  = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`, { signal: ctrl.signal });
    clearTimeout(tid);
    const arr = await res.json();
    if (!Array.isArray(arr)) return null;
    const rows = arr.map(k => {
      const d = new Date(k[0]);
      return {
        ts: k[0],
        date: `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`,
        open: +parseFloat(k[1]).toFixed(4),
        high: +parseFloat(k[2]).toFixed(4),
        low:  +parseFloat(k[3]).toFixed(4),
        close:+parseFloat(k[4]).toFixed(4),
        volume: parseFloat(k[5]),
      };
    });
    return rows;
  } catch { return null; }
}

// ═══════════════════════════════════════════════════════════
// CACHE — localStorage tabanlı
// ═══════════════════════════════════════════════════════════
const histCache = {};   // sym -> rows[] (1d, 1y)
const histTS    = {};
const liveCache = {};   // sym -> rows[] (15m, 5d)
const liveTS    = {};

(() => {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    const now  = Date.now();
    Object.entries(data).forEach(([sym, e]) => {
      if (e.hist?.length > 20 && now - (e.hts ?? 0) < 12 * 3600000) {
        histCache[sym] = e.hist; histTS[sym] = e.hts;
      }
      // 24 saate kadar eski veriyi koru — yeni veri gelene dek göster
      if (e.live?.length > 10 && now - (e.lts ?? 0) < 24 * 3600000) {
        liveCache[sym] = e.live; liveTS[sym] = e.lts;
      }
    });
  } catch {}
})();

function saveCache(sym) {
  try {
    const data = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    data[sym] = {
      hist: (histCache[sym] || []).slice(-260),
      hts:  histTS[sym] || 0,
      live: (liveCache[sym] || []).slice(-200),
      lts:  liveTS[sym] || 0,
    };
    const keys = Object.keys(data);
    if (keys.length > 80) {
      const oldest = keys.sort((a, b) => Math.min(data[a].hts||0, data[a].lts||0) - Math.min(data[b].hts||0, data[b].lts||0))[0];
      delete data[oldest];
    }
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

// ═══════════════════════════════════════════════════════════
// TEKNİK İNDİKATÖRLER — BIST'te en çok çalışan kombinasyon
// ═══════════════════════════════════════════════════════════
const calcEMA = (data, p) => {
  const k = 2/(p+1); const r = []; let v = null; let s = 0; let c = 0;
  data.forEach(d => {
    if (d == null) { r.push(null); return; }
    if (v === null) { s += d; c++; if (c === p) { v = s/p; r.push(+v.toFixed(4)); } else r.push(null); }
    else { v = d*k + v*(1-k); r.push(+v.toFixed(4)); }
  });
  return r;
};

const calcSMA = (data, p) => data.map((_, i) => {
  const sl = data.slice(Math.max(0, i-p+1), i+1).filter(x => x != null);
  return sl.length === p ? +(sl.reduce((a, b) => a+b, 0)/p).toFixed(4) : null;
});

function calcRSI(closes, p = 14) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < p + 1) return result;
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) { const d = closes[i] - closes[i-1]; if (d > 0) ag += d; else al -= d; }
  ag /= p; al /= p;
  result[p] = al === 0 ? 100 : +(100 - 100/(1 + ag/al)).toFixed(2);
  for (let i = p+1; i < closes.length; i++) {
    const d = closes[i] - closes[i-1];
    ag = (ag*(p-1) + (d > 0 ? d : 0)) / p;
    al = (al*(p-1) + (d < 0 ? -d : 0)) / p;
    result[i] = al === 0 ? 100 : +(100 - 100/(1 + ag/al)).toFixed(2);
  }
  return result;
}

function calcMACD(closes) {
  const e12 = calcEMA(closes, 12), e26 = calcEMA(closes, 26);
  const line = closes.map((_, i) => e12[i] != null && e26[i] != null ? +(e12[i]-e26[i]).toFixed(4) : null);
  const sig  = calcEMA(line.map(v => v ?? 0), 9);
  const hist = line.map((m, i) => m != null && sig[i] != null ? +(m - sig[i]).toFixed(4) : null);
  const slope = hist.map((h, i) => h != null && hist[i-1] != null ? +(h - hist[i-1]).toFixed(4) : null);
  const bullX = line.map((l, i) => i > 0 && line[i-1] != null && sig[i-1] != null && l != null && sig[i] != null && line[i-1] <= sig[i-1] && l > sig[i]);
  const bearX = line.map((l, i) => i > 0 && line[i-1] != null && sig[i-1] != null && l != null && sig[i] != null && line[i-1] >= sig[i-1] && l < sig[i]);
  return { line, sig, hist, slope, bullX, bearX };
}

function calcBB(closes, p = 20) {
  return closes.map((_, i) => {
    const sl = closes.slice(Math.max(0, i-p+1), i+1).filter(x => x != null);
    if (sl.length < p) return { u: null, m: null, l: null };
    const mn  = sl.reduce((a, b) => a+b, 0) / p;
    const std = Math.sqrt(sl.reduce((a, b) => a + (b-mn)**2, 0) / p);
    return { u: +(mn + 2*std).toFixed(4), m: +mn.toFixed(4), l: +(mn - 2*std).toFixed(4) };
  });
}

function calcATR(raw, p = 14) {
  return raw.map((r, i) => {
    if (i < p) return null;
    const trs = raw.slice(i-p+1, i+1).map((x, j, arr) => {
      if (j === 0) return x.high - x.low;
      const pv = arr[j-1];
      return Math.max(x.high - x.low, Math.abs(x.high - pv.close), Math.abs(x.low - pv.close));
    });
    return +(trs.reduce((a, b) => a+b, 0) / p).toFixed(4);
  });
}

function calcOBV(raw) {
  let obv = 0;
  return raw.map((r, i) => {
    if (i === 0) return 0;
    const p = raw[i-1];
    if (r.close > p.close) obv += r.volume;
    else if (r.close < p.close) obv -= r.volume;
    return obv;
  });
}

function calcStochRSI(closes, p = 14) {
  const rsi = calcRSI(closes, p);
  return rsi.map((v, i) => {
    if (v == null) return null;
    const sl = rsi.slice(Math.max(0, i-p+1), i+1).filter(x => x != null);
    if (sl.length < p) return null;
    const mn = Math.min(...sl), mx = Math.max(...sl);
    return mx === mn ? 50 : +((v - mn)/(mx - mn) * 100).toFixed(2);
  });
}

// MFI — Money Flow Index (hacim ağırlıklı RSI, diverjans tespiti için)
function calcMFI(raw, p = 14) {
  const out = new Array(raw.length).fill(null);
  if (raw.length < p + 1) return out;
  for (let i = p; i < raw.length; i++) {
    let posFlow = 0, negFlow = 0;
    for (let j = i - p + 1; j <= i; j++) {
      const tp  = (raw[j].high + raw[j].low + raw[j].close) / 3;
      const tpP = (raw[j-1].high + raw[j-1].low + raw[j-1].close) / 3;
      const mf  = tp * (raw[j].volume || 0);
      if (tp > tpP) posFlow += mf;
      else if (tp < tpP) negFlow += mf;
    }
    out[i] = negFlow === 0 ? 100 : +(100 - 100/(1 + posFlow/negFlow)).toFixed(2);
  }
  return out;
}

// TSI — True Strength Index (çift EMA yumuşatma, gürültüsüz momentum)
function calcTSI(closes, r = 25, s = 13) {
  const len = closes.length;
  const delta = closes.map((c, i) => i === 0 ? 0 : c - closes[i-1]);
  const absDelta = delta.map(d => Math.abs(d));
  const ema = (arr, p) => {
    const out = new Array(arr.length).fill(null);
    const k = 2/(p+1); let v = null;
    arr.forEach((x, i) => {
      if (i < p) { if (i === p-1) { v = arr.slice(0, p).reduce((a,b)=>a+b,0)/p; out[i] = v; } return; }
      v = x*k + v*(1-k); out[i] = v;
    });
    return out;
  };
  const sm1 = ema(delta, r), sm2 = ema(sm1.map(x=>x??0), s);
  const ab1 = ema(absDelta, r), ab2 = ema(ab1.map(x=>x??0), s);
  const tsi = sm2.map((v, i) => (v != null && ab2[i] != null && ab2[i] !== 0) ? +(100 * v / ab2[i]).toFixed(2) : null);
  const sig = ema(tsi.map(x => x ?? 0), s);
  return { tsi, sig };
}

// AO — Awesome Oscillator (5/34 SMA medyan farkı, momentum büyüklüğü)
function calcAO(raw) {
  const med = raw.map(r => (r.high + r.low) / 2);
  const sma = (arr, p) => arr.map((_, i) => {
    const sl = arr.slice(Math.max(0, i-p+1), i+1);
    return sl.length === p ? sl.reduce((a,b)=>a+b,0)/p : null;
  });
  const s5 = sma(med, 5), s34 = sma(med, 34);
  return s5.map((v, i) => (v != null && s34[i] != null) ? +(v - s34[i]).toFixed(4) : null);
}

// Vortex — VI+/VI- (trend dönüşünü ADX'ten önce yakalar)
function calcVortex(raw, p = 14) {
  const len = raw.length;
  const tr = new Array(len).fill(0), pvm = new Array(len).fill(0), nvm = new Array(len).fill(0);
  for (let i = 1; i < len; i++) {
    const h = raw[i].high, l = raw[i].low, pc = raw[i-1].close, ph = raw[i-1].high, pl = raw[i-1].low;
    tr[i]  = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    pvm[i] = Math.abs(h - pl);
    nvm[i] = Math.abs(l - ph);
  }
  const sum = (arr, i, n) => { let s = 0; for (let k = Math.max(1, i-n+1); k <= i; k++) s += arr[k]; return s; };
  const viP = new Array(len).fill(null), viN = new Array(len).fill(null);
  for (let i = p; i < len; i++) {
    const sumTR = sum(tr, i, p);
    if (sumTR > 0) {
      viP[i] = +(sum(pvm, i, p) / sumTR).toFixed(3);
      viN[i] = +(sum(nvm, i, p) / sumTR).toFixed(3);
    }
  }
  return { viP, viN };
}

// Keltner Channel (EMA20 ± 1.5×ATR) — TTM Squeeze için BB ile karşılaştırılır
function calcKeltner(closes, raw, p = 20, mult = 1.5) {
  const ema = calcEMA(closes, p);
  const atr = calcATR(raw, p);
  return ema.map((e, i) => (e != null && atr[i] != null) ? { u: +(e + atr[i] * mult).toFixed(4), m: e, l: +(e - atr[i] * mult).toFixed(4) } : { u: null, m: null, l: null });
}

// Fibonacci geri çekilme seviyeleri — son N barın swing high/low'una göre
function calcFib(raw, lookback = 60) {
  if (!raw || raw.length < lookback) return null;
  const slice = raw.slice(-lookback);
  let hi = -Infinity, lo = Infinity, hiIdx = 0, loIdx = 0;
  slice.forEach((b, i) => { if (b.high > hi) { hi = b.high; hiIdx = i; } if (b.low < lo) { lo = b.low; loIdx = i; } });
  const upTrend = hiIdx > loIdx;  // dipten zirveye → yükseliş, retracement aşağı yönde
  const range = hi - lo;
  if (range <= 0) return null;
  const levels = upTrend
    ? { dir: "UP", l236: hi - range * 0.236, l382: hi - range * 0.382, l500: hi - range * 0.500, l618: hi - range * 0.618, l786: hi - range * 0.786, hi, lo }
    : { dir: "DOWN", l236: lo + range * 0.236, l382: lo + range * 0.382, l500: lo + range * 0.500, l618: lo + range * 0.618, l786: lo + range * 0.786, hi, lo };
  return levels;
}

function calcVolAvg(raw, p = 20) {
  return raw.map((_, i) => {
    const sl = raw.slice(Math.max(0, i-p+1), i+1).map(r => r.volume);
    return sl.reduce((a, b) => a+b, 0) / sl.length;
  });
}

// ─── ADX (Trend Gücü) — BIST trend rejimi ayırt etmek için kritik ──
function calcADX(raw, p = 14) {
  const len = raw.length;
  const tr = new Array(len).fill(0), pdm = new Array(len).fill(0), ndm = new Array(len).fill(0);
  for (let i = 1; i < len; i++) {
    const h = raw[i].high, l = raw[i].low, ph = raw[i-1].high, pl = raw[i-1].low, pc = raw[i-1].close;
    tr[i]  = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    const upMove = h - ph, downMove = pl - l;
    pdm[i] = upMove > downMove   && upMove   > 0 ? upMove   : 0;
    ndm[i] = downMove > upMove   && downMove > 0 ? downMove : 0;
  }
  const smooth = (a) => {
    const s = new Array(len).fill(null);
    if (len < p + 1) return s;
    let sum = 0;
    for (let i = 1; i <= p; i++) sum += a[i];
    s[p] = sum;
    for (let i = p+1; i < len; i++) s[i] = s[i-1] - s[i-1]/p + a[i];
    return s;
  };
  const trS  = smooth(tr), pdmS = smooth(pdm), ndmS = smooth(ndm);
  const pdi = trS.map((v, i) => v ? +((pdmS[i] / v) * 100).toFixed(2) : null);
  const ndi = trS.map((v, i) => v ? +((ndmS[i] / v) * 100).toFixed(2) : null);
  const dx  = pdi.map((v, i) => (v != null && ndi[i] != null && (v + ndi[i]) > 0)
    ? +(Math.abs(v - ndi[i]) / (v + ndi[i]) * 100).toFixed(2) : null);
  const adx = new Array(len).fill(null);
  let firstIdx = -1;
  for (let i = 0; i < len; i++) if (dx[i] != null) { firstIdx = i; break; }
  if (firstIdx >= 0 && firstIdx + p <= len) {
    let sum = 0; let cnt = 0;
    for (let i = firstIdx; i < firstIdx + p && i < len; i++) { if (dx[i] != null) { sum += dx[i]; cnt++; } }
    if (cnt > 0) {
      adx[firstIdx + p - 1] = +(sum / cnt).toFixed(2);
      for (let i = firstIdx + p; i < len; i++) {
        if (dx[i] != null && adx[i-1] != null)
          adx[i] = +(((adx[i-1] * (p-1)) + dx[i]) / p).toFixed(2);
      }
    }
  }
  return { adx, pdi, ndi };
}

// ─── Supertrend (10, 3) — BIST'te en sevilen trend takip indikatörü ──
function calcSupertrend(raw, p = 10, mult = 3) {
  const len = raw.length;
  const atr = calcATR(raw, p);
  const st  = new Array(len).fill(null);
  const dir = new Array(len).fill(null); // 1=yukarı, -1=aşağı
  for (let i = p; i < len; i++) {
    const hl2 = (raw[i].high + raw[i].low) / 2;
    const a   = atr[i];
    if (a == null) continue;
    const ub  = hl2 + mult * a, lb = hl2 - mult * a;
    if (st[i-1] == null) { st[i] = lb; dir[i] = 1; continue; }
    const prevSt = st[i-1], prevDir = dir[i-1];
    let cur, curDir;
    if (prevDir === 1) {
      cur = Math.max(lb, prevSt);
      curDir = raw[i].close < cur ? -1 : 1;
      if (curDir === -1) cur = ub;
    } else {
      cur = Math.min(ub, prevSt);
      curDir = raw[i].close > cur ? 1 : -1;
      if (curDir === 1) cur = lb;
    }
    st[i]  = +cur.toFixed(2);
    dir[i] = curDir;
  }
  return { st, dir };
}

// ─── VWAP (intraday) — günlük rolling, seans-içi adil fiyat ──
function calcVWAP(raw) {
  const out = new Array(raw.length).fill(null);
  let dayKey = null, sumPV = 0, sumV = 0;
  for (let i = 0; i < raw.length; i++) {
    const d = new Date(raw[i].ts || 0);
    const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (k !== dayKey) { dayKey = k; sumPV = 0; sumV = 0; }
    const tp = (raw[i].high + raw[i].low + raw[i].close) / 3;
    const v  = raw[i].volume || 0;
    sumPV += tp * v; sumV += v;
    out[i] = sumV > 0 ? +(sumPV / sumV).toFixed(2) : null;
  }
  return out;
}

function enrichData(rawIn) {
  if (!rawIn?.length) return [];
  const raw = rawIn.filter(r => r && typeof r.close === "number" && r.close > 0);
  if (!raw.length) return [];
  const closes = raw.map(r => r.close);
  const RSI    = calcRSI(closes);
  const RSI7   = calcRSI(closes, 7);
  const MACD   = calcMACD(closes);
  const EMA9   = calcEMA(closes, 9);
  const EMA21  = calcEMA(closes, 21);
  const MA20   = calcSMA(closes, 20);
  const MA50   = calcSMA(closes, 50);
  const MA200  = calcSMA(closes, 200);
  const BB     = calcBB(closes);
  const ATR    = calcATR(raw);
  const OBV    = calcOBV(raw);
  const SRSI   = calcStochRSI(closes);
  const VOLAVG = calcVolAvg(raw);
  const ADX    = calcADX(raw);
  const ST     = calcSupertrend(raw, 10, 3);   // ana
  const STF    = calcSupertrend(raw, 7, 1.5);  // hızlı doğrulayıcı
  const VWAP   = calcVWAP(raw);
  const KEL    = calcKeltner(closes, raw, 20, 1.5);
  const MFI    = calcMFI(raw, 14);
  const TSI    = calcTSI(closes, 25, 13);
  const AO     = calcAO(raw);
  const VTX    = calcVortex(raw, 14);
  const tsiBullX = TSI.tsi.map((v, i) => i > 0 && v != null && TSI.tsi[i-1] != null && TSI.sig[i] != null && TSI.sig[i-1] != null && TSI.tsi[i-1] <= TSI.sig[i-1] && v > TSI.sig[i]);
  const tsiBearX = TSI.tsi.map((v, i) => i > 0 && v != null && TSI.tsi[i-1] != null && TSI.sig[i] != null && TSI.sig[i-1] != null && TSI.tsi[i-1] >= TSI.sig[i-1] && v < TSI.sig[i]);
  const aoZeroUp = AO.map((v, i) => i > 0 && v != null && AO[i-1] != null && AO[i-1] <= 0 && v > 0);
  const aoZeroDn = AO.map((v, i) => i > 0 && v != null && AO[i-1] != null && AO[i-1] >= 0 && v < 0);
  const vtxBullX = VTX.viP.map((v, i) => i > 0 && v != null && VTX.viP[i-1] != null && VTX.viN[i] != null && VTX.viN[i-1] != null && VTX.viP[i-1] <= VTX.viN[i-1] && v > VTX.viN[i]);
  const vtxBearX = VTX.viP.map((v, i) => i > 0 && v != null && VTX.viP[i-1] != null && VTX.viN[i] != null && VTX.viN[i-1] != null && VTX.viP[i-1] >= VTX.viN[i-1] && v < VTX.viN[i]);
  // Golden / Death Cross — MA50 × MA200 kesişimi (uzun vadeli trend dönüşü)
  const goldenCross = MA50.map((v, i) => i > 0 && v != null && MA50[i-1] != null && MA200[i] != null && MA200[i-1] != null && MA50[i-1] <= MA200[i-1] && v > MA200[i]);
  const deathCross  = MA50.map((v, i) => i > 0 && v != null && MA50[i-1] != null && MA200[i] != null && MA200[i-1] != null && MA50[i-1] >= MA200[i-1] && v < MA200[i]);
  // TTM Squeeze: BB Keltner içine girdiğinde sıkışma → patlama yakın
  const squeezeOn = BB.map((b, i) => b.u != null && KEL[i].u != null && b.u < KEL[i].u && b.l > KEL[i].l);
  const squeezeOff = squeezeOn.map((s, i) => i > 0 && squeezeOn[i-1] === true && s === false); // sıkışma kırıldı (hareket başladı)
  const rsiSig = calcEMA(RSI.map(v => v ?? 0), 9);
  const exitOS = RSI.map((v, i) => v != null && RSI[i-1] != null && RSI[i-1] < 30 && v >= 30);
  const exitOB = RSI.map((v, i) => v != null && RSI[i-1] != null && RSI[i-1] > 70 && v <= 70);
  const c50Up  = RSI.map((v, i) => v != null && RSI[i-1] != null && RSI[i-1] < 50 && v >= 50);
  const c50Dn  = RSI.map((v, i) => v != null && RSI[i-1] != null && RSI[i-1] > 50 && v <= 50);
  const emaBullX = EMA9.map((v, i) => i > 0 && v != null && EMA9[i-1] != null && EMA21[i] != null && EMA21[i-1] != null && EMA9[i-1] <= EMA21[i-1] && v > EMA21[i]);
  const emaBearX = EMA9.map((v, i) => i > 0 && v != null && EMA9[i-1] != null && EMA21[i] != null && EMA21[i-1] != null && EMA9[i-1] >= EMA21[i-1] && v < EMA21[i]);
  const stFlipUp = ST.dir.map((d, i) => i > 0 && d === 1 && ST.dir[i-1] === -1);
  const stFlipDn = ST.dir.map((d, i) => i > 0 && d === -1 && ST.dir[i-1] === 1);
  return raw.map((r, i) => ({
    ...r,
    rsi: RSI[i], rsi7: RSI7[i], rsiSignal: rsiSig[i],
    rsiExitOS: exitOS[i], rsiExitOB: exitOB[i], rsi50Up: c50Up[i], rsi50Dn: c50Dn[i],
    macdLine: MACD.line[i], macdSig: MACD.sig[i], macdHist: MACD.hist[i],
    macdSlope: MACD.slope[i], macdBullX: MACD.bullX[i], macdBearX: MACD.bearX[i],
    ema9: EMA9[i], ema21: EMA21[i], emaBullX: emaBullX[i], emaBearX: emaBearX[i],
    ma20: MA20[i], ma50: MA50[i], ma200: MA200[i],
    bbU: BB[i].u, bbM: BB[i].m, bbL: BB[i].l,
    atr: ATR[i], obv: OBV[i], stochRsi: SRSI[i], volAvg: VOLAVG[i],
    adx: ADX.adx[i], pdi: ADX.pdi[i], ndi: ADX.ndi[i],
    supertrend: ST.st[i], stDir: ST.dir[i], stFlipUp: stFlipUp[i], stFlipDn: stFlipDn[i],
    stFastDir: STF.dir[i], stConsensus: ST.dir[i] != null && STF.dir[i] != null && ST.dir[i] === STF.dir[i],
    vwap: VWAP[i],
    kelU: KEL[i].u, kelL: KEL[i].l,
    goldenCross: goldenCross[i], deathCross: deathCross[i],
    squeezeOn: squeezeOn[i], squeezeOff: squeezeOff[i],
    mfi: MFI[i], tsi: TSI.tsi[i], tsiSig: TSI.sig[i], ao: AO[i],
    viP: VTX.viP[i], viN: VTX.viN[i],
    tsiBullX: tsiBullX[i], tsiBearX: tsiBearX[i],
    aoZeroUp: aoZeroUp[i], aoZeroDn: aoZeroDn[i],
    vtxBullX: vtxBullX[i], vtxBearX: vtxBearX[i],
  }));
}

// ═══════════════════════════════════════════════════════════
// SİNYAL ENGİNE — Price Action + ADX + Supertrend + Multi-TF + Doji
// ═══════════════════════════════════════════════════════════
// DOJI mum sınıflandırması: gövde range'in <%10'u → kararsızlık, dönüş habercisi
function classifyDoji(bar) {
  if (!bar) return null;
  const range = bar.high - bar.low;
  if (range === 0) return null;
  const body  = Math.abs(bar.close - bar.open);
  const upW   = bar.high - Math.max(bar.close, bar.open);
  const dnW   = Math.min(bar.close, bar.open) - bar.low;
  if (body / range >= 0.10) return null;          // gövde çok büyük → doji değil
  if (dnW > range * 0.60 && upW < range * 0.15) return "DRAGONFLY";   // 🐉 boğa
  if (upW > range * 0.60 && dnW < range * 0.15) return "GRAVESTONE";  // ⚰️ ayı
  if (upW > range * 0.30 && dnW > range * 0.30) return "LONG_LEGGED"; // ⚖️ kararsızlık (her iki yön)
  return "STANDARD";  // ✚ klasik doji
}
// Haftalık doji: son 5 günü tek bar gibi birleştir → o aggregate doji mi?
function weeklyDoji(rows) {
  if (!rows || rows.length < 5) return null;
  const last5 = rows.slice(-5);
  const agg = {
    open: last5[0].open,
    close: last5[last5.length - 1].close,
    high: Math.max(...last5.map(r => r.high)),
    low:  Math.min(...last5.map(r => r.low)),
  };
  return classifyDoji(agg);
}
// Üst zaman dilimi trendi: günlük data MA50 üstü mü altı mı
function getHigherTrend(higherRows) {
  if (!higherRows || higherRows.length < 50) return null;
  const closes = higherRows.map(r => r.close);
  const ma50   = calcSMA(closes, 50);
  const ma20   = calcSMA(closes, 20);
  const last   = closes[closes.length - 1];
  const m50    = ma50[ma50.length - 1];
  const m20    = ma20[ma20.length - 1];
  if (m50 == null) return null;
  if (last > m50 && (m20 == null || m20 > m50)) return "YUKARI";
  if (last < m50 && (m20 == null || m20 < m50)) return "ASAGI";
  return "YAN"; // karışık → kararsız
}

function getSignals(data, higherTrend = null, higherRows = null) {
  if (data.length < 20) return null;
  const last  = data[data.length - 1];
  const prev  = data[data.length - 2];
  const prev2 = data[data.length - 3];
  if (!last || !prev) return null;
  const mk = (dir, s, v, l) => ({ dir, strength: Math.min(100, Math.max(0, Math.round(s))), value: v, label: l });

  const aboveMA200 = last.ma200 != null && last.close > last.ma200;
  // ÜST ZAMAN DİLİMİ ÖNCELİKLİ — günlük trend varsa onu kullan, yoksa 15m MA200'e düş
  // (ASTOR gibi yeni hisselerde 15m MA200 yetersizdir, günlük gerçek yön)
  const trendMod = higherTrend === "YUKARI" ? "YUKARI"
                : higherTrend === "ASAGI"  ? "ASAGI"
                : last.ma200 == null ? "NÖTR"
                : aboveMA200 ? "YUKARI" : "ASAGI";
  // Kısa vadeli (15m) yön — mod metninde nüans için ayrı tutuyoruz
  const shortTrend = last.ma200 == null ? "?" : aboveMA200 ? "YUKARI" : "ASAGI";
  const atr        = last.atr ?? 0;
  const adxVal     = last.adx ?? 0;
  const trendStrong = adxVal > 25;
  const trendWeak   = adxVal < 18;

  const last10   = data.slice(-10).map(d => d.close);
  const upBars10 = last10.filter((c, i) => i > 0 && c > last10[i-1]).length;
  const last20   = data.slice(-20).map(d => d.close);
  const upBars20 = last20.filter((c, i) => i > 0 && c > last20[i-1]).length;
  const trendStr  = Math.round(upBars20 / 19 * 100);
  const trendBias = trendStr > 60 ? "YUKARI" : trendStr < 40 ? "ASAGI" : "YAN";
  const shortBias = upBars10 >= 7 ? "YUKARI" : upBars10 <= 3 ? "ASAGI" : "YAN";

  // RSI
  const RSI = (() => {
    const v = last.rsi; if (v == null) return null;
    const pv = prev?.rsi;
    if (last.rsiExitOS) return mk("AL",  98, v.toFixed(1), "Aşırı Satımdan Çıkış ✦✦");
    if (last.rsiExitOB) return mk("SAT", 98, v.toFixed(1), "Aşırı Alımdan Çıkış ✦✦");
    if (prev2) {
      const priceMadeLow  = last.close < prev2.close && prev.close < prev2.close;
      const rsiMadeHigher = v > (prev2.rsi ?? v);
      const priceMadeHigh = last.close > prev2.close && prev.close > prev2.close;
      const rsiMadeLower  = v < (prev2.rsi ?? v);
      if (priceMadeLow && rsiMadeHigher && v < 50) return mk("AL", 88, v.toFixed(1), "Boğa Diverjansı 📐");
      if (priceMadeHigh && rsiMadeLower && v > 50) return mk("SAT", 88, v.toFixed(1), "Ayı Diverjansı 📐");
    }
    if (last.rsi50Up) {
      const str = trendMod === "YUKARI" ? 80 : 65;
      return mk("AL", str, v.toFixed(1), trendMod === "YUKARI" ? "50 Geçişi (Trend Yönünde) ↑" : "50 Üstüne Geçti ↑");
    }
    if (last.rsi50Dn) {
      const str = trendMod === "ASAGI" ? 80 : 65;
      return mk("SAT", str, v.toFixed(1), trendMod === "ASAGI" ? "50 Geçişi (Trend Yönünde) ↓" : "50 Altına Geçti ↓");
    }
    if (trendMod === "YUKARI" && v >= 40 && v <= 60 && pv != null && v > pv)
      return mk("AL", 72, v.toFixed(1), "Trend İçi Geri Çekilme AL ↗");
    if (trendMod === "ASAGI" && v >= 40 && v <= 60 && pv != null && v < pv)
      return mk("SAT", 72, v.toFixed(1), "Trend İçi Ralide SAT ↘");
    if (v < 20) return mk("AL",  95, v.toFixed(1), "Ekstrem Aşırı Satım 🔥");
    if (v < 30) return mk("AL",  80, v.toFixed(1), "Aşırı Satım 🔥");
    if (v > 80) return mk("SAT", 95, v.toFixed(1), "Ekstrem Aşırı Alım ⚠️");
    if (v > 70) return mk("SAT", 80, v.toFixed(1), "Aşırı Alım ⚠️");
    if (pv != null && v > pv && v > 50) return mk("AL",  Math.round((v-50)/20*30), v.toFixed(1), "RSI Yükseliyor ↗");
    if (pv != null && v < pv && v < 50) return mk("SAT", Math.round((50-v)/20*30), v.toFixed(1), "RSI Düşüyor ↘");
    if (v > 50) return mk("AL",  Math.round((v-50)/20*20), v.toFixed(1), "Yükseliş Bölgesi");
    return mk("SAT", Math.round((50-v)/20*20), v.toFixed(1), "Düşüş Bölgesi");
  })();

  // MACD
  const MACD = (() => {
    if (last.macdLine == null) return null;
    const pH = prev?.macdHist, ppH = prev2?.macdHist;
    if (last.macdBullX) {
      const str = last.macdLine < 0 ? 95 : 82;
      const lbl = last.macdLine < 0 ? "Boğa Kesişimi (Sıfır Altı) ✦✦" : "Boğa Kesişimi ✦";
      return mk("AL", str, last.macdLine.toFixed(3), lbl);
    }
    if (last.macdBearX) {
      const str = last.macdLine > 0 ? 95 : 82;
      const lbl = last.macdLine > 0 ? "Ayı Kesişimi (Sıfır Üstü) ✦✦" : "Ayı Kesişimi ✦";
      return mk("SAT", str, last.macdLine.toFixed(3), lbl);
    }
    const histAccel = pH != null && ppH != null && last.macdHist != null &&
      last.macdHist < 0 && last.macdHist > pH && pH > (ppH ?? pH);
    const histDeccel = pH != null && ppH != null && last.macdHist != null &&
      last.macdHist > 0 && last.macdHist < pH && pH < (ppH ?? pH);
    if (histAccel) return mk("AL",  75, last.macdLine.toFixed(3), "Histogram İvmeleniyor ↗↗");
    if (histDeccel) return mk("SAT", 75, last.macdLine.toFixed(3), "Histogram Kırılıyor ↘↘");
    const histUp   = pH != null && last.macdHist != null && last.macdHist < 0 && last.macdHist > pH;
    const histDown = pH != null && last.macdHist != null && last.macdHist > 0 && last.macdHist < pH;
    if (histUp)   return mk("AL",  62, last.macdLine.toFixed(3), "Histogram Dönüyor ↗");
    if (histDown) return mk("SAT", 62, last.macdLine.toFixed(3), "Histogram Zayıflıyor ↘");
    const aboveSig  = last.macdLine > last.macdSig;
    const aboveZero = last.macdLine > 0;
    if (aboveSig && aboveZero)  return mk("AL",  50, last.macdLine.toFixed(3), "Güçlü Bölge (+/+)");
    if (aboveSig && !aboveZero) return mk("AL",  36, last.macdLine.toFixed(3), "Toparlanıyor (-/+)");
    if (!aboveSig && !aboveZero) return mk("SAT", 50, last.macdLine.toFixed(3), "Zayıf Bölge (-/-)");
    return mk("SAT", 36, last.macdLine.toFixed(3), "Zayıflıyor (+/-)");
  })();

  // MA TREND
  const MA = (() => {
    if (last.ma20 == null) return null;
    const a20   = last.close > last.ma20;
    const g2050 = last.ma50 != null && last.ma20 > last.ma50;
    const a200  = last.ma200 != null && last.close > last.ma200;
    const prevA200 = prev?.ma200 != null;
    if (prevA200 && last.ma200 != null) {
      if (prev.close <= prev.ma200 && last.close > last.ma200)
        return mk("AL",  92, last.ma20.toFixed(2), "MA200 Kırıldı — Trend Dönüşü ✦✦");
      if (prev.close >= prev.ma200 && last.close < last.ma200)
        return mk("SAT", 92, last.ma20.toFixed(2), "MA200 Kırıldı Aşağı ✦✦");
    }
    if (a200 && g2050 && a20) return mk("AL",  88, last.ma20.toFixed(2), "Boğa Düzeni: Fiyat>MA20>MA50>MA200");
    if (!a200 && !g2050 && !a20) return mk("SAT", 85, last.ma20.toFixed(2), "Ayı Düzeni: Fiyat<MA20<MA50<MA200");
    const testingMA20Support = last.close > last.ma20 && prev.close <= prev.ma20;
    const testingMA20Resist  = last.close < last.ma20 && prev.close >= prev.ma20;
    if (testingMA20Support) return mk("AL",  78, last.ma20.toFixed(2), "MA20 Desteği Tuttu ↑");
    if (testingMA20Resist)  return mk("SAT", 78, last.ma20.toFixed(2), "MA20 Direnci Kıramadı ↓");
    if (a20 && g2050)    return mk("AL",  70, last.ma20.toFixed(2), "Yükseliş Trendi");
    if (!a20 && !g2050)  return mk("SAT", 70, last.ma20.toFixed(2), "Düşüş Trendi ⬇");
    if (a20)             return mk("AL",  40, last.ma20.toFixed(2), "MA20 Üstünde");
    return mk("SAT", 38, last.ma20.toFixed(2), "MA20 Altında");
  })();

  // BOLLINGER
  const BB = (() => {
    if (last.bbU == null) return null;
    const rng = last.bbU - last.bbL; if (rng === 0) return null;
    const pos = (last.close - last.bbL) / rng;
    const prevRng = prev?.bbU != null ? prev.bbU - prev.bbL : null;
    const expanding   = prevRng != null && rng > prevRng * 1.08;
    const contracting = prevRng != null && rng < prevRng * 0.95;
    if (contracting && rng / last.close < 0.03)
      return mk("NÖTR", 30, pos.toFixed(2), "Bant Sıkışması — Büyük Hareket Yakın ⚡");
    if (pos < 0.04)  return mk("AL",  94, pos.toFixed(2), "Alt Bandın Altında 🔥🔥");
    if (pos < 0.10)  return mk("AL",  85, pos.toFixed(2), "Alt Banda Değdi 🔥");
    if (pos > 0.96)  return mk("SAT", 94, pos.toFixed(2), "Üst Bandın Üstünde ⚠️⚠️");
    if (pos > 0.90)  return mk("SAT", 85, pos.toFixed(2), "Üst Banda Değdi ⚠️");
    if (expanding && pos > 0.6) return mk("AL",  55, pos.toFixed(2), "Üst Yarı + Bant Genişliyor");
    if (expanding && pos < 0.4) return mk("SAT", 55, pos.toFixed(2), "Alt Yarı + Bant Genişliyor");
    if (pos < 0.3)  return mk("AL",  28, pos.toFixed(2), "Alt Bölge");
    if (pos > 0.7)  return mk("SAT", 28, pos.toFixed(2), "Üst Bölge");
    return mk("NÖTR", 0, pos.toFixed(2), "Orta Bölge");
  })();

  // STOCH RSI
  const SRSI = (() => {
    const v = last.stochRsi; if (v == null) return null;
    const pv = prev?.stochRsi, pv2 = prev2?.stochRsi;
    if (pv2 != null && pv != null && pv2 < 20 && pv < 20 && v > pv)
      return mk("AL",  90, v.toFixed(1), "Stoch Güçlü Dönüş ↗↗");
    if (pv2 != null && pv != null && pv2 > 80 && pv > 80 && v < pv)
      return mk("SAT", 90, v.toFixed(1), "Stoch Güçlü Dönüş ↘↘");
    if (pv != null && pv < 20 && v > pv) return mk("AL",  80, v.toFixed(1), "Stoch Dönüşü ↗");
    if (pv != null && pv > 80 && v < pv) return mk("SAT", 80, v.toFixed(1), "Stoch Dönüşü ↘");
    if (v < 20) return mk("AL",  72, v.toFixed(1), "Stoch Aşırı Satım");
    if (v > 80) return mk("SAT", 72, v.toFixed(1), "Stoch Aşırı Alım");
    if (v < 35 && pv != null && v > pv && trendMod === "YUKARI")
      return mk("AL", 48, v.toFixed(1), "Stoch Trend Geri Çekilmeden Dönüyor");
    if (v > 65 && pv != null && v < pv && trendMod === "ASAGI")
      return mk("SAT", 48, v.toFixed(1), "Stoch Trend Ralisinden Dönüyor");
    return mk("NÖTR", 0, v.toFixed(1), "Nötr");
  })();

  // HACİM + OBV
  const VOL = (() => {
    if (!last.volAvg || last.volume === 0) return null;
    const r    = last.volume / last.volAvg;
    const obvUp = prev?.obv != null && last.obv != null && last.obv > prev.obv;
    const obvDn = prev?.obv != null && last.obv != null && last.obv < prev.obv;
    const priceUp = last.close > prev.close;
    if (r > 3.0 && priceUp)  return mk("AL",  95, r.toFixed(1)+"x", "Dev Hacim Yükseliş 🚀🚀");
    if (r > 3.0 && !priceUp) return mk("SAT", 95, r.toFixed(1)+"x", "Dev Hacim Düşüş 💥💥");
    if (r > 2.0 && priceUp)  return mk("AL",  82, r.toFixed(1)+"x", "Güçlü Alış Hacmi 🚀");
    if (r > 2.0 && !priceUp) return mk("SAT", 82, r.toFixed(1)+"x", "Güçlü Satış Hacmi 💥");
    if (r > 1.5 && priceUp  && obvUp) return mk("AL",  68, r.toFixed(1)+"x", "Hacim + OBV Alış ✓");
    if (r > 1.5 && !priceUp && obvDn) return mk("SAT", 68, r.toFixed(1)+"x", "Hacim + OBV Satış ✓");
    if (r > 1.5 && priceUp)  return mk("AL",  52, r.toFixed(1)+"x", "Hacim Onaylı Alış");
    if (r > 1.5 && !priceUp) return mk("SAT", 52, r.toFixed(1)+"x", "Hacim Onaylı Satış");
    if (obvUp) return mk("AL",  25, r.toFixed(1)+"x", "OBV Yükseliyor");
    if (obvDn) return mk("SAT", 25, r.toFixed(1)+"x", "OBV Düşüyor");
    return mk("NÖTR", 0, r.toFixed(1)+"x", "Normal Hacim");
  })();

  // ADX
  const ADX = (() => {
    if (last.adx == null) return null;
    const pdi = last.pdi, ndi = last.ndi;
    if (adxVal > 25 && pdi > ndi) return mk("AL",  78, adxVal.toFixed(1), `Güçlü Yükseliş (+DI ${pdi.toFixed(0)})`);
    if (adxVal > 25 && pdi < ndi) return mk("SAT", 78, adxVal.toFixed(1), `Güçlü Düşüş (-DI ${ndi.toFixed(0)})`);
    if (adxVal > 18 && pdi > ndi) return mk("AL",  50, adxVal.toFixed(1), "Yükseliş trendi");
    if (adxVal > 18 && pdi < ndi) return mk("SAT", 50, adxVal.toFixed(1), "Düşüş trendi");
    return mk("NÖTR", 20, adxVal.toFixed(1), "Yatay piyasa");
  })();

  // SUPERTREND
  const STR = (() => {
    if (last.supertrend == null || last.stDir == null) return null;
    const cons = last.stConsensus;  // hızlı + ana ST aynı yön
    if (last.stFlipUp && cons) return mk("AL",  95, last.supertrend.toFixed(2), "Çift Supertrend Yukarı Döndü ✦✦");
    if (last.stFlipDn && cons) return mk("SAT", 95, last.supertrend.toFixed(2), "Çift Supertrend Aşağı Döndü ✦✦");
    if (last.stFlipUp) return mk("AL",  82, last.supertrend.toFixed(2), "Supertrend Yukarı Döndü ✦");
    if (last.stFlipDn) return mk("SAT", 82, last.supertrend.toFixed(2), "Supertrend Aşağı Döndü ✦");
    if (last.stDir === 1  && cons) return mk("AL",  72, last.supertrend.toFixed(2), "Çift Supertrend Yukarı (onaylı)");
    if (last.stDir === -1 && cons) return mk("SAT", 72, last.supertrend.toFixed(2), "Çift Supertrend Aşağı (onaylı)");
    if (last.stDir === 1)  return mk("AL",  50, last.supertrend.toFixed(2), "Supertrend Yukarı (zayıf — hızlı ST farklı)");
    return mk("SAT", 50, last.supertrend.toFixed(2), "Supertrend Aşağı (zayıf — hızlı ST farklı)");
  })();

  // PRICE ACTION PATTERNS
  const bullEngulf = prev.close < prev.open && last.close > last.open && last.close > prev.open && last.open < prev.close;
  const bearEngulf = prev.close > prev.open && last.close < last.open && last.close < prev.open && last.open > prev.close;
  const body  = Math.abs(last.close - last.open);
  const range = last.high - last.low;
  const upWick = last.high - Math.max(last.close, last.open);
  const dnWick = Math.min(last.close, last.open) - last.low;
  const hammer       = range > 0 && dnWick > body * 2 && upWick < body * 0.5;
  const shootingStar = range > 0 && upWick > body * 2 && dnWick < body * 0.5;

  // Higher High / Lower Low yapısı (son 5 bar)
  const last5 = data.slice(-5);
  const hh = last5.length === 5 && last5[4].high > last5[3].high && last5[3].high > last5[2].high;
  const ll = last5.length === 5 && last5[4].low  < last5[3].low  && last5[3].low  < last5[2].low;
  // Ani momentum patlaması: 3 ardışık yeşil mum + son barda hacim 1.5x+
  const burst3Up = data.length >= 3 &&
    data[data.length-1].close > data[data.length-1].open &&
    data[data.length-2].close > data[data.length-2].open &&
    data[data.length-3].close > data[data.length-3].open &&
    last.volAvg && last.volume > last.volAvg * 1.4;
  const burst3Dn = data.length >= 3 &&
    data[data.length-1].close < data[data.length-1].open &&
    data[data.length-2].close < data[data.length-2].open &&
    data[data.length-3].close < data[data.length-3].open &&
    last.volAvg && last.volume > last.volAvg * 1.4;
  // Dipten ani sıçrama: RSI<35'ten dönüyor + EMA9 yukarı kırıldı + hacim
  const rsiBounceFromOversold = last.rsi != null && prev?.rsi != null && prev.rsi < 35 && last.rsi > prev.rsi + 3;
  const dipFlip = rsiBounceFromOversold && last.emaBullX;
  // Tepeden çakılma: RSI>70'ten dönüyor + EMA9 aşağı kırıldı
  const topReverse = last.rsi != null && prev?.rsi != null && prev.rsi > 70 && last.rsi < prev.rsi - 3 && last.emaBearX;

  // DOJİ tespiti — intraday + günlük + haftalık aggregate
  const intraDoji  = classifyDoji(last);
  const dailyDoji  = (higherRows && higherRows.length) ? classifyDoji(higherRows[higherRows.length - 1]) : null;
  const dailyDojiPrev = (higherRows && higherRows.length >= 2) ? classifyDoji(higherRows[higherRows.length - 2]) : null;
  const weekDoji   = weeklyDoji(higherRows);

  // YENİ: 3-mum patternleri (Morning/Evening Star, Three Soldiers/Crows)
  const c1 = data[data.length-3], c2 = data[data.length-2], c3 = last;
  const isStar = c1 && c2 && Math.abs(c2.close-c2.open) < Math.max(0.001, (c1.high-c1.low)*0.35);
  const morningStar = isStar && c1.close < c1.open && c3.close > c3.open && c3.close > (c1.open+c1.close)/2;
  const eveningStar = isStar && c1.close > c1.open && c3.close < c3.open && c3.close < (c1.open+c1.close)/2;
  const threeSoldiers = c1 && c2 && c3.close > c3.open && c2.close > c2.open && c1.close > c1.open && c3.close > c2.close && c2.close > c1.close;
  const threeCrows    = c1 && c2 && c3.close < c3.open && c2.close < c2.open && c1.close < c1.open && c3.close < c2.close && c2.close < c1.close;
  // YENİ: Fibonacci + Squeeze tespiti
  const fib = calcFib(higherRows || data, 60);
  const fibTouch = (() => {
    if (!fib) return null;
    const tol = last.close * 0.012; // %1.2 tolerans
    const near = (v, l) => Math.abs(v - l) < tol;
    if (fib.dir === "UP" && trendMod !== "ASAGI") {
      if (near(last.close, fib.l618)) return { lvl: "%61.8", action: "AL", strong: true };
      if (near(last.close, fib.l500)) return { lvl: "%50",   action: "AL", strong: true };
      if (near(last.close, fib.l382)) return { lvl: "%38.2", action: "AL", strong: false };
    }
    return null;
  })();
  const PA = (() => {
    // YENİ EN GÜÇLÜ: Golden Cross / Death Cross
    if (last.goldenCross) return mk("AL",  98, "GOLDEN ✦", "Golden Cross — MA50 yukarı kesti MA200 ✦✦✦ (uzun vade boğa)");
    if (last.deathCross)  return mk("SAT", 98, "DEATH ✦",  "Death Cross — MA50 aşağı kesti MA200 ✦✦✦ (uzun vade ayı)");
    // YENİ: 3-mum patternleri
    if (morningStar)  return mk("AL",  93, "MORNING ★", "Sabah Yıldızı — 3-bar dip dönüş paterni (klasik en güvenilir)");
    if (eveningStar)  return mk("SAT", 93, "EVENING ★", "Akşam Yıldızı — 3-bar tepe dönüş paterni");
    if (threeSoldiers && trendMod !== "ASAGI") return mk("AL",  90, "3 ASKER", "Üç Beyaz Asker — güçlü trend onayı (3 ardışık yeşil)");
    if (threeCrows    && trendMod !== "YUKARI") return mk("SAT", 90, "3 KARGA", "Üç Kara Karga — güçlü düşüş onayı (3 ardışık kırmızı)");
    // YENİ: Squeeze patlamaları
    if (last.squeezeOff && last.macdHist != null && last.macdHist > 0)
      return mk("AL",  90, "SQUEEZE↑", "Volatilite Sıkışması Kırıldı (yukarı) — patlama başlangıcı");
    if (last.squeezeOff && last.macdHist != null && last.macdHist < 0)
      return mk("SAT", 90, "SQUEEZE↓", "Volatilite Sıkışması Kırıldı (aşağı) — düşüş başlangıcı");
    if (last.squeezeOn) return mk("NÖTR", 30, "SQUEEZE", "Bant sıkışmış — patlama yakın, yön belirsiz ⚡");
    // YENİ: Fibonacci destek/direnç
    if (fibTouch && fibTouch.action === "AL")
      return mk("AL", fibTouch.strong ? 88 : 75, "FIB " + fibTouch.lvl, `Fibonacci ${fibTouch.lvl} desteği — geri çekilme tamamlandı`);
    // EN GÜÇLÜ SİNYALLER — günlük/haftalık doji düşüş trendi sonunda → ÇOK güçlü AL
    if (dailyDoji === "DRAGONFLY" && trendMod === "ASAGI") return mk("AL",  98, "DAILY 🐉", "Günlük Dragonfly Doji — Dipte Güçlü Dönüş ✦✦✦");
    if (dailyDoji === "GRAVESTONE" && trendMod === "YUKARI") return mk("SAT", 98, "DAILY ⚰️", "Günlük Gravestone Doji — Tepede Güçlü Dönüş ✦✦✦");
    if (weekDoji === "DRAGONFLY" && trendMod === "ASAGI") return mk("AL",  95, "WEEKLY 🐉", "Haftalık Dragonfly — Büyük Dip Dönüşü ✦✦");
    if (weekDoji === "GRAVESTONE" && trendMod === "YUKARI") return mk("SAT", 95, "WEEKLY ⚰️", "Haftalık Gravestone — Büyük Tepe Dönüşü ✦✦");
    // Trend sonunda standart doji + RSI uç → güçlü dönüş
    if (dailyDoji && trendMod === "ASAGI" && last.rsi != null && last.rsi < 35) return mk("AL", 88, "DOJI+RSI", "Günlük Doji + RSI<35 — Dönüş 🎯");
    if (dailyDoji && trendMod === "YUKARI" && last.rsi != null && last.rsi > 65) return mk("SAT", 88, "DOJI+RSI", "Günlük Doji + RSI>65 — Dönüş 🎯");
    if (dailyDojiPrev && trendMod === "ASAGI" && last.close > higherRows[higherRows.length - 1].close * 1.005)
      return mk("AL", 86, "POST-DOJI", "Günlük Doji Sonrası Yeşil Mum — Onay ✓");
    // EN GÜÇLÜ SİNYALLER (multi-confirm)
    if (dipFlip)    return mk("AL",  96, "DIP FLIP", "DİPTEN DÖNÜŞ + EMA9↑ + Hacim ✦✦✦");
    if (topReverse) return mk("SAT", 96, "TOP REV",  "TEPEDEN DÖNÜŞ + EMA9↓ + Hacim ✦✦✦");
    // 15m doji (intraday) — sadece RSI uç ile
    if (intraDoji === "DRAGONFLY" && last.rsi != null && last.rsi < 35) return mk("AL",  82, "INTRA 🐉", "Intraday Dragonfly + RSI Dip");
    if (intraDoji === "GRAVESTONE" && last.rsi != null && last.rsi > 65) return mk("SAT", 82, "INTRA ⚰️", "Intraday Gravestone + RSI Tepe");
    if (burst3Up && trendMod === "YUKARI") return mk("AL", 92, "BURST↑", "3 Yeşil Mum + Hacim Patlaması 🚀🚀");
    if (burst3Dn && trendMod === "ASAGI")  return mk("SAT", 92, "BURST↓", "3 Kırmızı Mum + Hacim 💥💥");
    // EMA cross
    if (last.emaBullX) return mk("AL",  86, "EMA9>21", "EMA9 ↑ Geçti — Momentum Dönüşü ✦");
    if (last.emaBearX) return mk("SAT", 86, "EMA9<21", "EMA9 ↓ Geçti — Momentum Bozuldu ✦");
    // Engulfing onaylı (RSI ile birlikte)
    if (bullEngulf && last.rsi != null && last.rsi < 60) return mk("AL", 82, "BULL ENG", "Yutan Boğa Mumu 🟢");
    if (bearEngulf && last.rsi != null && last.rsi > 40) return mk("SAT", 82, "BEAR ENG", "Yutan Ayı Mumu 🔴");
    // Pin Bar (dip/tepede)
    if (hammer       && (trendMod === "ASAGI" || (last.bbL && last.close < last.bbL * 1.05)))
      return mk("AL",  80, "HAMMER", "Çekiç — Dip Reddi 🔨");
    if (shootingStar && (trendMod === "YUKARI" || (last.bbU && last.close > last.bbU * 0.95)))
      return mk("SAT", 80, "STAR", "Yıldız — Tepe Reddi ⭐");
    // Yapısal trend
    if (hh) return mk("AL",  60, "HH", "Higher High Yapısı ↗");
    if (ll) return mk("SAT", 60, "LL", "Lower Low Yapısı ↘");
    // Genel EMA durumu
    if (last.ema9 != null && last.ema21 != null) {
      const e9above = last.ema9 > last.ema21;
      if (e9above && last.close > last.ema9)  return mk("AL", 45, "EMA↑", "EMA9>21 + Fiyat üstte");
      if (!e9above && last.close < last.ema9) return mk("SAT", 45, "EMA↓", "EMA9<21 + Fiyat altta");
    }
    return mk("NÖTR", 0, "—", "Belirgin pattern yok");
  })();

  // MOMENTUM KONSENSÜSÜ — MFI + TSI + AO + Vortex (4 göstergenin oy çoğunluğu)
  const MOM = (() => {
    const votes = []; const labels = [];
    if (last.mfi != null) {
      if (last.mfi < 20) { votes.push("AL"); labels.push("MFI<20 aşırı satım"); }
      else if (last.mfi > 80) { votes.push("SAT"); labels.push("MFI>80 aşırı alım"); }
      else if (prev?.mfi != null) {
        if (last.mfi > prev.mfi && last.mfi > 50) votes.push("AL");
        else if (last.mfi < prev.mfi && last.mfi < 50) votes.push("SAT");
      }
    }
    if (last.tsiBullX) { votes.push("AL"); labels.push("TSI ↑ kesişim"); }
    else if (last.tsiBearX) { votes.push("SAT"); labels.push("TSI ↓ kesişim"); }
    else if (last.tsi != null && last.tsiSig != null) {
      if (last.tsi > last.tsiSig && last.tsi > 0) votes.push("AL");
      else if (last.tsi < last.tsiSig && last.tsi < 0) votes.push("SAT");
    }
    if (last.aoZeroUp) { votes.push("AL"); labels.push("AO sıfır üstüne ✦"); }
    else if (last.aoZeroDn) { votes.push("SAT"); labels.push("AO sıfır altına ✦"); }
    else if (last.ao != null && prev?.ao != null) {
      if (last.ao > prev.ao && last.ao > 0) votes.push("AL");
      else if (last.ao < prev.ao && last.ao < 0) votes.push("SAT");
    }
    if (last.vtxBullX) { votes.push("AL"); labels.push("Vortex VI+ ✦ (trend dönüş erken)"); }
    else if (last.vtxBearX) { votes.push("SAT"); labels.push("Vortex VI-"); }
    else if (last.viP != null && last.viN != null) {
      if (last.viP > last.viN) votes.push("AL");
      else if (last.viP < last.viN) votes.push("SAT");
    }
    const al = votes.filter(v => v === "AL").length;
    const sat = votes.filter(v => v === "SAT").length;
    const total = al + sat;
    if (total === 0) return mk("NÖTR", 0, "—", "Momentum yok");
    const dir = al > sat ? "AL" : "SAT";
    const label = labels.length ? labels.slice(0, 2).join(" · ") : `${al}AL/${sat}SAT`;
    const pct = Math.max(al, sat) / total;
    if (pct === 1.0 && total >= 3) return mk(dir, 92, `${al}-${sat}`, "Tam Momentum Konsensüsü ✦✦ · " + label);
    if (pct >= 0.75) return mk(dir, 75, `${al}-${sat}`, "Güçlü momentum · " + label);
    if (pct >= 0.6)  return mk(dir, 55, `${al}-${sat}`, label);
    return mk("NÖTR", 20, `${al}-${sat}`, "Momentum bölünmüş");
  })();

  // AĞIRLIKLI PUANLAMA (PA + MOM dahil)
  const W = trendMod === "YUKARI"
    ? { MA: 0.14, MACD: 0.12, RSI: 0.12, BB: 0.06, SRSI: 0.06, VOL: 0.07, ADX: 0.09, STR: 0.11, PA: 0.11, MOM: 0.12 }
    : trendMod === "ASAGI"
    ? { MA: 0.14, MACD: 0.10, RSI: 0.14, BB: 0.07, SRSI: 0.06, VOL: 0.05, ADX: 0.09, STR: 0.11, PA: 0.12, MOM: 0.12 }
    : { MA: 0.12, MACD: 0.12, RSI: 0.14, BB: 0.07, SRSI: 0.06, VOL: 0.07, ADX: 0.09, STR: 0.10, PA: 0.11, MOM: 0.12 };

  const sigs = { MA, MACD, RSI, BB, SRSI, VOL, ADX, STR, PA, MOM };
  let al = 0, sat = 0;
  Object.entries(sigs).forEach(([k, s]) => {
    if (!s) return;
    if (s.dir === "AL")  al  += s.strength * (W[k] ?? 0.1);
    if (s.dir === "SAT") sat += s.strength * (W[k] ?? 0.1);
  });

  if (shortBias === "YUKARI" && sat > al) sat *= 0.72;
  if (shortBias === "ASAGI"  && al > sat) al  *= 0.72;
  if (trendWeak) { al *= 0.78; sat *= 0.78; }

  // DİP AVCI (7 şart)
  let dipSignal = null;
  if (trendMod === "ASAGI") {
    const checks = {
      rsiDip:      last.rsi != null && last.rsi < 32 && prev?.rsi != null && last.rsi > prev.rsi,
      macdTurning: last.macdHist != null && prev?.macdHist != null && last.macdHist < 0 && last.macdHist > prev.macdHist,
      bbBottom:    last.bbL != null && last.close <= last.bbL * 1.015,
      highVolume:  last.volAvg != null && last.volume > last.volAvg * 2.0,
      stochDip:    last.stochRsi != null && last.stochRsi < 20,
      obvTurning:  prev?.obv != null && prev2?.obv != null && prev.obv < prev2.obv && (last.obv ?? 0) > prev.obv,
      stFlip:      last.stFlipUp === true,
    };
    const score = Object.values(checks).filter(Boolean).length;
    if (score >= 4) {
      dipSignal = {
        score, checks,
        label: score >= 6 ? "💎 MÜKEMMEL DİP" : score >= 5 ? "💎 GÜÇLÜ DİP DÖNÜŞÜ" : "⚡ DİP DÖNÜŞ ADAYI",
        color: score >= 5 ? "#fb923c" : "#fbbf24",
      };
    }
  }

  // FİNAL KARAR
  const net = al - sat;
  let final, confidence, mod;
  const waitReasons = [];

  if (trendMod === "YUKARI") {
    if (net > 14)       { final = "AL";   confidence = Math.round(Math.min(95, 48 + net * 1.3)); }
    else if (net < -16) { final = "SAT";  confidence = Math.round(Math.min(95, 48 + Math.abs(net) * 1.3)); }
    else {
      final = "NÖTR"; confidence = Math.round(Math.abs(net) * 2);
      if (Math.abs(net) < 14) waitReasons.push("İndikatörler kararsız (net puan düşük)");
      if (trendWeak) waitReasons.push(`ADX ${adxVal.toFixed(0)} (<18, yatay piyasa)`);
    }
    // Hisse özel mod (günlük YUKARI bağlamında)
    if (final === "AL" && trendStrong && shortTrend === "YUKARI")  mod = "📈 Güçlü yükseliş — devam ediyor";
    else if (final === "AL" && shortTrend === "ASAGI")             mod = "📈 Yükseliş içi geri çekilme — alım fırsatı";
    else if (final === "AL")                                       mod = "↗ Yükseliş trendi — momentum toplanıyor";
    else if (final === "SAT")                                      mod = "📈 Trend yukarı ama kısa vadeli düzeltme geliyor";
    else if (trendStrong)                                          mod = "📈 Yükseliş trendi — net giriş için bekle";
    else                                                            mod = "↗ Hafif yükseliş — net sinyal yok";
  } else if (dipSignal) {
    final = "AL";
    confidence = Math.round(40 + dipSignal.score * 9);
    mod = dipSignal.score >= 6 ? "🎯 Mükemmel dip — dönüş şartları tam"
        : dipSignal.score >= 5 ? "🎯 Güçlü dip dönüşü — sıkı stop ile gir"
        : "🎯 Dip dönüş adayı — küçük pozisyon test et";
  } else {
    if (net > 22)       { final = "AL";   confidence = Math.round(Math.min(62, 38 + net)); }
    else if (net < -14) { final = "SAT";  confidence = Math.round(Math.min(82, 40 + Math.abs(net) * 1.4)); }
    else {
      final = "NÖTR"; confidence = 0;
      waitReasons.push("MA200 altında ama dip şartları (≥4/7) tutmuyor");
      if (trendWeak) waitReasons.push(`ADX ${adxVal.toFixed(0)} (yatay)`);
      if (Math.abs(net) < 14) waitReasons.push("Net AL/SAT eğilimi yok");
    }
    // Hisse özel mod (günlük ASAGI bağlamında)
    if (final === "SAT" && trendStrong && shortTrend === "ASAGI")   mod = "⬇ Düşüş hızlanıyor — pozisyondan çık";
    else if (final === "SAT" && shortTrend === "YUKARI")            mod = "↘ Kısa vadeli toparlanma sonu — satış yaklaşıyor";
    else if (final === "SAT")                                       mod = "↘ Düşüş trendi sürüyor — temkinli";
    else if (final === "AL")                                        mod = "🎯 Düşüş trendinde dönüş denemesi — riskli ama fırsat olabilir";
    else if (trendStrong && shortTrend === "ASAGI")                 mod = "⬇ Düşüş trendi sürüyor — yeni giriş için dip aramak gerek";
    else if (trendStrong && shortTrend === "YUKARI")                mod = "↗ Düşüşte kısa vadeli toparlanma — kalıcılığı şüpheli";
    else if (trendWeak)                                             mod = "↔ Yatay seyir — yön belirsiz, beklemede";
    else                                                             mod = "↘ Düşüş eğilimi — toparlanma şartları henüz tutmuyor";
  }
  if (final === "NÖTR") {
    if (last.bbU && last.bbL) {
      const pos = (last.close - last.bbL) / (last.bbU - last.bbL);
      if (pos > 0.4 && pos < 0.6) waitReasons.push("Fiyat Bollinger orta bandında");
    }
    if (Math.abs(last.rsi - 50) < 8) waitReasons.push(`RSI ${last.rsi?.toFixed(0)} (~50, kararsız)`);
  }

  // Supertrend yön onayı
  if (final === "AL"  && last.stDir === -1) confidence = Math.round(confidence * 0.78);
  if (final === "SAT" && last.stDir === 1)  confidence = Math.round(confidence * 0.78);

  // ÜST ZAMAN DİLİMİ ONAYI (Multi-TF) — günlük trend ile çelişen 15m sinyalleri zayıflat
  let htfNote = "";
  if (higherTrend === "ASAGI" && final === "AL") {
    confidence = Math.round(confidence * 0.65);
    htfNote = "⚠ Günlük trend AŞAĞI";
    if (confidence < 50) final = "NÖTR";
  } else if (higherTrend === "YUKARI" && final === "SAT") {
    confidence = Math.round(confidence * 0.65);
    htfNote = "⚠ Günlük trend YUKARI";
    if (confidence < 50) final = "NÖTR";
  } else if (higherTrend === "YUKARI" && final === "AL") {
    confidence = Math.min(98, Math.round(confidence * 1.10));
    htfNote = "✓ Günlük trend AYNI YÖN";
  } else if (higherTrend === "ASAGI" && final === "SAT") {
    confidence = Math.min(98, Math.round(confidence * 1.10));
    htfNote = "✓ Günlük trend AYNI YÖN";
  }

  // ═══ AKILLI VADE SEÇİCİ — sinyal türüne göre otomatik tutma süresi ═══
  // Her hisse kendi ideal vadesini bulur: hızlı momentum 1-3 gün, mean reversion 3-7 gün,
  // trend takip 1-2 hafta, MA200 kırılımı / büyük dip 2-4 hafta.
  let profile;
  const paStr = sigs.PA?.strength ?? 0;
  const paLab = sigs.PA?.label ?? "";
  const bbLab = sigs.BB?.label ?? "";
  const maLab = sigs.MA?.label ?? "";
  const srsStr = sigs.SRSI?.strength ?? 0;

  // GOLDEN/DEATH CROSS = uzun vadeli pozisyon (1-3 ay)
  if (paLab.includes("Golden Cross") || paLab.includes("Death Cross")) {
    profile = { dur: "1-3 AY", t1: 5.0, t2: 9.0, stopMin: 0.06, stopMax: 0.15, why: "Golden/Death Cross — uzun vadeli trend dönüşü" };
  } else if (paLab.includes("Sıkışması Kırıldı")) {
    profile = { dur: "1-3 HAFTA", t1: 3.0, t2: 5.0, stopMin: 0.04, stopMax: 0.10, why: "Volatilite patlaması — keskin hareket bekleniyor" };
  } else if (paLab.includes("Fibonacci")) {
    profile = { dur: "1-2 HAFTA", t1: 2.5, t2: 4.0, stopMin: 0.035, stopMax: 0.08, why: "Fib desteği — trend yönünde devam" };
  } else
  // Haftalık doji = büyük dönüş, uzun vadeli pozisyon
  if (paLab.includes("Haftalık") && (paLab.includes("Dragonfly") || paLab.includes("Gravestone"))) {
    profile = { dur: "3-6 HAFTA", t1: 4.0, t2: 7.0, stopMin: 0.05, stopMax: 0.13, why: "Haftalık Doji — büyük trend dönüşü" };
  } else if (paLab.includes("Günlük Dragonfly") || paLab.includes("Günlük Gravestone")) {
    profile = { dur: "2-3 HAFTA", t1: 3.0, t2: 5.5, stopMin: 0.04, stopMax: 0.11, why: "Günlük Doji — güçlü dönüş, uzun tut" };
  } else if (paLab.includes("Doji Sonrası") || paLab.includes("DOJI+RSI")) {
    profile = { dur: "1-2 HAFTA", t1: 2.5, t2: 4.0, stopMin: 0.035, stopMax: 0.09, why: "Doji onaylı dönüş" };
  } else if (paStr >= 92 && (paLab.includes("DİPTEN DÖNÜŞ") || paLab.includes("TEPEDEN DÖNÜŞ") || paLab.includes("Hacim Patlaması"))) {
    profile = { dur: "1-3 GÜN", t1: 1.5, t2: 2.8, stopMin: 0.025, stopMax: 0.06, why: "Hızlı momentum dönüşü" };
  } else if (maLab.includes("MA200 Kırıldı") || (dipSignal && dipSignal.score >= 5)) {
    profile = { dur: "2-4 HAFTA", t1: 3.0, t2: 5.5, stopMin: 0.05, stopMax: 0.12, why: "Büyük trend dönüşü — uzun vade tut" };
  } else if (trendMod === "YUKARI" && adxVal > 25 && final === "AL") {
    profile = { dur: "1-2 HAFTA", t1: 2.5, t2: 4.0, stopMin: 0.04, stopMax: 0.10, why: "Güçlü trend — momentum sür" };
  } else if ((bbLab.includes("Alt Banda") || bbLab.includes("Üst Banda") || bbLab.includes("Bandın")) && srsStr >= 80) {
    profile = { dur: "3-7 GÜN", t1: 1.5, t2: 2.5, stopMin: 0.03, stopMax: 0.07, why: "Aşırı bant — ortalamaya dönüş" };
  } else if (paStr >= 80 && (paLab.includes("Yutan") || paLab.includes("Çekiç") || paLab.includes("Yıldız") || paLab.includes("EMA9"))) {
    profile = { dur: "2-5 GÜN", t1: 2.0, t2: 3.2, stopMin: 0.025, stopMax: 0.07, why: "Mum patterni reaksiyonu" };
  } else if (dipSignal && dipSignal.score >= 4) {
    profile = { dur: "1-2 HAFTA", t1: 2.2, t2: 3.5, stopMin: 0.035, stopMax: 0.09, why: "Dip avcı — küçük pozisyon, sıkı stop" };
  } else {
    profile = { dur: "1 HAFTA", t1: 2.0, t2: 3.5, stopMin: 0.03, stopMax: 0.08, why: "Standart swing" };
  }

  const baseATRpct = atr > 0 ? atr / last.close : 0.04;
  const stopPct  = Math.min(profile.stopMax, Math.max(profile.stopMin, baseATRpct * 1.0));
  const stopLoss = +(last.close * (1 - stopPct)).toFixed(last.close < 1 ? 4 : 2);
  const target1  = +(last.close * (1 + stopPct * profile.t1)).toFixed(last.close < 1 ? 4 : 2);
  const target2  = +(last.close * (1 + stopPct * profile.t2)).toFixed(last.close < 1 ? 4 : 2);

  // SMART ENTRY TIMING — sinyal verildikten sonra optimum giriş anı
  let entryHint = "ŞİMDİ";
  let entryDetail = "Şu anki fiyattan giriş uygun";
  if (final === "AL") {
    const overheated = (last.rsi != null && last.rsi > 65) || (last.bbU && last.close > last.bbU * 0.97);
    const upStreak = data.slice(-3).every(d => d?.close > d?.open);
    if (overheated) { entryHint = "GERİ ÇEKİLME BEKLE"; entryDetail = `RSI ${last.rsi?.toFixed(0)} aşırı alımda — 1-2 mum geri çekilince gir`; }
    else if (upStreak) { entryHint = "TEPKİ BEKLE"; entryDetail = "3 ardışık yeşil mum — kısa molada giriş daha iyi"; }
  } else if (final === "SAT") {
    const oversold = (last.rsi != null && last.rsi < 35) || (last.bbL && last.close < last.bbL * 1.03);
    const dnStreak = data.slice(-3).every(d => d?.close < d?.open);
    if (oversold) { entryHint = "TEPKİ BEKLE"; entryDetail = `RSI ${last.rsi?.toFixed(0)} aşırı satımda — kısa toparlanma sonrası SAT`; }
    else if (dnStreak) { entryHint = "TOPARLANMA BEKLE"; entryDetail = "3 ardışık kırmızı mum — tepki yükselişi sonrası SAT"; }
  }
  // TRAILING STOP — kâr büyüdükçe stop yukarı çıkar (3 kademeli ATR-bazlı)
  // Senaryo: AL pozisyonu +%X gittiyse, stop = (mevcut fiyat - ATR × multiplier)
  const trailingStop = atr > 0 ? {
    seviye1: { tetik: +(last.close * 1.03).toFixed(2), stop: +(last.close * (1 + 0.03 - stopPct * 0.7)).toFixed(2), aciklama: "+%3'e ulaşınca stop'u buraya çek" },
    seviye2: { tetik: +(last.close * 1.06).toFixed(2), stop: +(last.close * (1 + 0.06 - stopPct * 0.5)).toFixed(2), aciklama: "+%6'da stop break-even üstüne" },
    seviye3: { tetik: +(last.close * 1.10).toFixed(2), stop: +(last.close * (1 + 0.10 - stopPct * 0.3)).toFixed(2), aciklama: "+%10'da kârın çoğunu kilitle" },
  } : null;

  return {
    signals: sigs, final, confidence, last,
    trendMod, mod, dipSignal, trendBias, trendStr, shortBias,
    adx: adxVal, trendStrong, trendWeak,
    atr: atr > 0 ? +atr.toFixed(2) : null,
    stopLoss, target1, target2, riskReward: "1:1.3",
    ma200: last.ma200, waitReasons, net: +net.toFixed(1),
    higherTrend, htfNote, profile,
    entryHint, entryDetail, trailingStop,
    stopPct: +stopPct.toFixed(4),
  };
}

// ═══════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// BACKTEST — geçmiş 1y günlük data üzerinde stratejiyi simüle eder
// AL sinyalini takip eder, stop veya target1'e kadar tutar.
// Çıkış: { trades, winrate, avgPnl, score }
// ═══════════════════════════════════════════════════════════
function backtest(rows) {
  if (!rows || rows.length < 60) return null;
  const data = enrichData(rows);
  if (data.length < 60) return null;
  const trades = [];
  let pos = null; // {entry, stop, target, idx}
  for (let i = 30; i < data.length - 1; i++) {
    const window = data.slice(0, i + 1);
    const sig = getSignals(window);
    const next = data[i + 1];
    if (!sig || !next) continue;
    if (!pos) {
      // AL sinyali + güven >= 50 ise pozisyon aç
      if (sig.final === "AL" && sig.confidence >= 50 && sig.stopLoss && sig.target1) {
        pos = { entry: next.open, stop: sig.stopLoss, target: sig.target1, idx: i + 1 };
      }
    } else {
      // pozisyon yönet
      if (next.low <= pos.stop) {
        trades.push({ pnl: (pos.stop - pos.entry) / pos.entry, win: false, bars: i + 1 - pos.idx });
        pos = null;
      } else if (next.high >= pos.target) {
        trades.push({ pnl: (pos.target - pos.entry) / pos.entry, win: true, bars: i + 1 - pos.idx });
        pos = null;
      } else if (sig.final === "SAT" && sig.confidence >= 60) {
        // SAT sinyali geldi, çık
        trades.push({ pnl: (next.close - pos.entry) / pos.entry, win: next.close > pos.entry, bars: i + 1 - pos.idx });
        pos = null;
      }
    }
  }
  if (trades.length < 2) return { trades: trades.length, winrate: 0, avgPnl: 0, score: 0, error: "Yeterli sinyal yok (1y içinde 2'den az AL)" };
  const wins  = trades.filter(t => t.win).length;
  const wr    = wins / trades.length;
  const avg   = trades.reduce((a, b) => a + b.pnl, 0) / trades.length;
  const score = +((wr * 100) + (avg * 200)).toFixed(1);
  return { trades: trades.length, winrate: +(wr*100).toFixed(1), avgPnl: +(avg*100).toFixed(2), score };
}

// EMAIL UYARI
// ═══════════════════════════════════════════════════════════
async function sendAlertEmail(toEmail, symbol, signal, price, confidence) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID, template_id: EMAILJS_TEMPLATE_ID, user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: toEmail, symbol, signal,
        price: price != null ? (+price).toFixed(2) : "—",
        confidence: (confidence ?? 0) + "%",
        time: new Date().toLocaleString("tr-TR"),
        message: `${symbol} hissesi için ${signal} sinyali. Fiyat: ${price != null ? (+price).toFixed(2) : "—"}₺, Güven: ${(confidence ?? 0)}%, Zaman: ${new Date().toLocaleString("tr-TR")}`,
      }
    }),
  });
  if (!res.ok) throw new Error(`EmailJS: ${res.status}`);
}

// ═══════════════════════════════════════════════════════════
// DESIGN
// ═══════════════════════════════════════════════════════════
const T = {
  bg: "#060810", bg1: "#0c0f1a", bg2: "#111827",
  border: "#1e2d47", border2: "#253352",
  text: "#e2e8f8", muted: "#4a5a7a", dim: "#2a3a5a",
  green: "#00e5a0", red: "#ff4560", yellow: "#fbbf24",
  blue: "#38bdf8", orange: "#fb923c", purple: "#a78bfa",
  // Apple SF Pro öncelikli stack — iOS/macOS'ta native, diğerlerinde Inter web fontu
  // TradingView/Twitter chirp tarzı modern sans-serif — Trebuchet öncelikli, Inter fallback
  font: "'Trebuchet MS', 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  fontD: "'Trebuchet MS', 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  fontMono: "ui-monospace, 'SF Mono', 'Menlo', 'Roboto Mono', 'Consolas', monospace",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale} html,body{background:${T.bg};margin:0;padding:0;font-family:${T.font};letter-spacing:-0.011em;font-size:14px;line-height:1.45}
  body{-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}
  h1,h2,h3{font-family:${T.fontD};letter-spacing:-0.02em;font-weight:600}
  /* Sayılar tabular-nums ile hizalı, fiyat tablolarında titreme yok */
  input,button{font-family:inherit;letter-spacing:inherit}
  .tnum{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
  ::-webkit-scrollbar{width:3px;height:3px} ::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
  @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  .btn{transition:all .15s}.btn:active{filter:brightness(.9)}.btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
  .sc{transition:all .2s}.sc:hover{transform:translateY(-2px)}
  .nav-item{transition:all .15s;cursor:pointer;border-left:3px solid transparent}
  .nav-item:hover{background:rgba(56,189,248,.06)}
  .nav-item.active{border-left-color:#00e5a0;background:rgba(0,229,160,.06)}
  .mob-bottom{display:none}
  @media (max-width:720px){
    html,body{font-size:13px}
    .desk-only{display:none!important}
    .mob-bottom{display:flex!important;position:fixed;bottom:0;left:0;right:0;background:${T.bg1};border-top:1px solid ${T.border};z-index:99}
    .mob-bottom .nav-item{flex:1;border-left:none;border-bottom:3px solid transparent;padding:10px 0!important}
    .mob-bottom .nav-item.active{border-bottom-color:${T.green};border-left-color:transparent}
    .mob-bottom .nav-item > div:first-child{font-size:18px!important}
    .mob-bottom .nav-item > div:nth-child(2){font-size:9px!important;margin-top:3px!important}
    .mob-pad{padding:12px 10px!important}
    .mob-h1{font-size:24px!important}
    .mob-px{font-size:26px!important}
    .has-bottom-nav{padding-bottom:60px!important}
    /* Mobil ticker — akan kompakt sembol+fiyat görünür */
    .ticker-bar > div > div > div{padding:4px 10px!important;min-width:75px!important}
    .ticker-bar > div > div > div > div:first-child > span:not(:first-child){font-size:11px!important}
    .ticker-bar > div > div > div > div:nth-child(2) > span{font-size:10px!important}
    /* Email/AI panel input mobilde tam genişlik */
    input[type="email"], input[type="password"]{width:100%!important;max-width:100%!important;flex:1 1 100%!important}
    /* Stat box mobilde daha kompakt — 9-10 stat sığsın */
    .mob-stat{padding:6px 8px!important;min-width:62px!important;flex:1 1 60px!important;font-size:12px!important}
    .mob-stat > div:first-child{font-size:8px!important}
    .mob-stat > div:nth-child(2){font-size:11px!important}
    /* Mobil number input — sağa yaslı sayı görünüm */
    input[type="number"]{text-align:right;font-variant-numeric:tabular-nums}
  }
`;

// ═══════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════
function SigCard({ name, sig }) {
  if (!sig) return null;
  const c  = sig.dir === "AL" ? T.green : sig.dir === "SAT" ? T.red : T.muted;
  const bg = sig.dir === "AL" ? `${T.green}08` : sig.dir === "SAT" ? `${T.red}08` : T.bg2;
  return (
    <div className="sc" style={{ background: bg, border: `1px solid ${c}33`, borderRadius: 8, padding: "12px 14px", flex: "1 1 110px", minWidth: 100, animation: "fadeIn .3s" }}>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, letterSpacing: 1 }}>{name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: c, fontFamily: T.fontD, letterSpacing: 1 }}>{sig.dir}</span>
        <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}>{sig.value}</span>
      </div>
      <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, minHeight: 14 }}>{sig.label}</div>
      <div style={{ height: 2, background: T.dim, borderRadius: 1 }}>
        <div style={{ height: "100%", width: `${sig.strength}%`, background: `linear-gradient(90deg,${c}88,${c})`, transition: "width .8s", borderRadius: 1 }} />
      </div>
      <div style={{ fontSize: 9, color: c, marginTop: 3, textAlign: "right" }}>{sig.strength}%</div>
    </div>
  );
}

function Leg({ color, label, dashed }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <svg width="18" height="3"><line x1="0" y1="1.5" x2="18" y2="1.5" stroke={color} strokeWidth="2" strokeDasharray={dashed ? "4 2" : "0"} /></svg>
      <span style={{ fontSize: 11, color: T.muted, fontFamily: T.font }}>{label}</span>
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div className="mob-stat" style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", flex: "1 1 80px", textAlign: "center", minWidth: 75 }}>
      <div style={{ fontSize: 9, color: T.muted, marginBottom: 3, letterSpacing: 1 }}>{label}</div>
      <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: color || T.text }}>{value}</div>
    </div>
  );
}

function PriceTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: T.font, boxShadow: "0 4px 20px rgba(0,0,0,.7)" }}>
      <div style={{ color: T.muted, marginBottom: 3 }}>{label}</div>
      {d && <>
        <div style={{ color: T.blue }}>K: {d.close?.toFixed(2)}₺</div>
        <div><span style={{ color: T.green }}>Y:{d.high?.toFixed(2)}</span> <span style={{ color: T.red }}>D:{d.low?.toFixed(2)}</span></div>
        {d.ma20  && <div style={{ color: T.yellow }}>MA20: {d.ma20}</div>}
        {d.ma200 && <div style={{ color: T.orange }}>MA200: {d.ma200}</div>}
      </>}
    </div>
  );
}

// SPARKLINE — responsive (viewBox + width:100%) → mobilde kart genişliğine uyar
function Spark({ data, h = 22, color }) {
  if (!data || data.length < 2) return null;
  const w = 200; // viewBox sanal genişlik
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i/(data.length-1))*w},${h - ((v-min)/range)*(h-2) - 1}`).join(" ");
  const upColor = data[data.length-1] >= data[0] ? "#00e5a0" : "#ff4560";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color || upColor} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// LIGHTWEIGHT CHARTS — TradingView'in açık kaynak motoru, kendi data'mızla
// Mum grafiği + MA20/50/200 + BB. Profesyonel görünüm, kontrol bizde.
function LWChart({ data, height = 420 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current || !window.LightweightCharts || !data?.length) return;
    const LWC = window.LightweightCharts;
    const chart = LWC.createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: { background: { type: 'solid', color: '#060810' }, textColor: '#9aa6c0', fontFamily: T.font },
      grid:   { vertLines: { color: '#1e2d47', style: 1 }, horzLines: { color: '#1e2d47', style: 1 } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#253352' },
      rightPriceScale: { borderColor: '#253352' },
      crosshair: { mode: 0, vertLine: { color: '#38bdf8', width: 1, style: 3 }, horzLine: { color: '#38bdf8', width: 1, style: 3 } },
    });
    chartRef.current = chart;
    const candles = chart.addCandlestickSeries({
      upColor: '#00e5a0', downColor: '#ff4560',
      borderUpColor: '#00e5a0', borderDownColor: '#ff4560',
      wickUpColor: '#00e5a0', wickDownColor: '#ff4560',
    });
    const ma20  = chart.addLineSeries({ color: '#fbbf24', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ma50  = chart.addLineSeries({ color: '#a78bfa', lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const ma200 = chart.addLineSeries({ color: '#fb923c', lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
    const bbU   = chart.addLineSeries({ color: 'rgba(56,189,248,0.4)', lineWidth: 1, lineStyle: 3, priceLineVisible: false, lastValueVisible: false });
    const bbL   = chart.addLineSeries({ color: 'rgba(56,189,248,0.4)', lineWidth: 1, lineStyle: 3, priceLineVisible: false, lastValueVisible: false });
    // Time hizalama: ts varsa saniyeye çevir; yoksa bugünden geriye günlük synthetic timestamp üret
    // (1970 bug fix). Aynı zamanda sort+dedupe ile aynı time çakışmalarını engelle (ASTOR-tipi fix).
    const N = data.length;
    const todaySec = Math.floor(Date.now() / 1000);
    const formatTime = (d, i) => {
      if (d.ts && d.ts > 1e12) return Math.floor(d.ts / 1000);          // ms timestamp
      if (d.ts && d.ts > 1e9)  return Math.floor(d.ts);                  // sn timestamp
      return todaySec - (N - 1 - i) * 86400;                             // ts yoksa: bugünden geriye günlük
    };
    const dedupe = (arr) => {
      const sorted = arr.sort((a, b) => a.time - b.time);
      const out = [];
      for (const it of sorted) if (!out.length || it.time > out[out.length - 1].time) out.push(it);
      return out;
    };

    candles.setData(dedupe(data.filter(d => d.open != null && d.high != null && d.low != null && d.close != null)
      .map((d, i) => ({ time: formatTime(d, i), open: d.open, high: d.high, low: d.low, close: d.close }))));
    ma20.setData(dedupe(data.map((d, i) => d.ma20 != null ? { time: formatTime(d, i), value: d.ma20 } : null).filter(Boolean)));
    ma50.setData(dedupe(data.map((d, i) => d.ma50 != null ? { time: formatTime(d, i), value: d.ma50 } : null).filter(Boolean)));
    ma200.setData(dedupe(data.map((d, i) => d.ma200 != null ? { time: formatTime(d, i), value: d.ma200 } : null).filter(Boolean)));
    bbU.setData(dedupe(data.map((d, i) => d.bbU != null ? { time: formatTime(d, i), value: d.bbU } : null).filter(Boolean)));
    bbL.setData(dedupe(data.map((d, i) => d.bbL != null ? { time: formatTime(d, i), value: d.bbL } : null).filter(Boolean)));
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => chart.applyOptions({ width: containerRef.current.clientWidth }));
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); };
  }, [data, height]);
  return <div ref={containerRef} style={{ width: "100%", height, background: "#060810", borderRadius: 8 }} />;
}

// ═══ AI ANALİZ — Anthropic API direct browser çağrısı (key kullanıcının) ═══
// Backend yok, dosya erişimi yok. Sadece HTTPS → api.anthropic.com
async function aiAnalyze(apiKey, symbol, name, signal, indicators, profile, isCrypto) {
  const sysPrompt = `Sen profesyonel bir BIST/kripto trade analistsin. Kullanıcının verdiği teknik veriyi (indikatör snapshot + bot kararı) son makro/şirket haberleriyle harmanlayıp Türkçe, kısa ve uygulanabilir bir trade önerisi yapacaksın. Format: 1 cümle özet + 3-4 madde "ARTILAR/EKSİLER" + 1 net karar (AL/SAT/BEKLE) + tahmini vade.`;
  const userPrompt = `Sembol: ${symbol} (${name})
Tip: ${isCrypto ? "Kripto (Binance USDT)" : "BIST hissesi"}
Botun teknik kararı: ${signal.final} %${signal.confidence} · ${signal.mod}
Mevcut fiyat: ${indicators.price}
Trend: MA200 ${signal.trendMod} · ADX ${signal.adx?.toFixed(0)} · Üst TF: ${signal.higherTrend || "—"}
Vade profili: ${profile?.dur || "—"} (${profile?.why || ""})
İndikatör: RSI ${indicators.rsi}, MACD hist ${indicators.macdHist}, BB pozisyon ${indicators.bbPos}, Stoch ${indicators.stoch}, ATR ${indicators.atr}
Price Action: ${signal.signals?.PA?.label || "—"}
Stop: ${signal.stopLoss} · H1: ${signal.target1} · H2: ${signal.target2}

Bu hisse için:
1. Son 1-2 ay içindeki şirket-özel haberler ve sektör trendlerini düşün (KAP açıklamaları, kâr beklentileri, kur etkisi).
2. Botun teknik kararını haber kontekstiyle değerlendir — onaylıyor mu, çelişiyor mu?
3. Net trade önerin nedir? Stop ve hedef seviyeleri uygun mu? Vade gerçekçi mi?
4. Risk uyarısı varsa belirt.`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      system: sysPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const j = await res.json();
  return j.content?.[0]?.text || "Yanıt boş.";
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 6, padding: "8px 12px", fontSize: 12, fontFamily: T.font }}>
      <div style={{ color: T.muted, marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color || p.stroke || T.text }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(4) : p.value}</div>)}
    </div>
  );
}

// Borsa İstanbul logosu — kullanıcının yüklediği PNG dosyasını kullanır
const BistLogo = ({ size = 22 }) => {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ fontSize: size, lineHeight: 1 }}>₺</span>;
  return <img src="bist-logo.png" alt="BIST" width={size} height={size}
              onError={() => setErr(true)}
              style={{ display: "block", margin: "0 auto", borderRadius: "50%" }} />;
};

function NavBtn({ id, page, setPage, icon, label, badge }) {
  const active = page === id;
  return (
    <div className={`nav-item${active ? " active" : ""}`} onClick={() => setPage(id)}
      style={{ padding: "14px 0", textAlign: "center", position: "relative" }}>
      <div style={{ fontSize: 20, color: active ? T.green : T.muted, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", height: 22 }}>{icon}</div>
      <div style={{ fontSize: 10, color: active ? T.green : T.muted, letterSpacing: 0.2, marginTop: 4, fontWeight: 500 }}>{label}</div>
      {badge > 0 && (
        <div style={{ position: "absolute", top: 6, right: 8, background: T.green, color: T.bg, borderRadius: "50%", width: 16, height: 16, fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
          {badge > 99 ? "99+" : badge}
        </div>
      )}
    </div>
  );
}

// Sinyal değişiminde kısa bip — Web Audio API, kütüphane yok
let _audioCtx = null;
function playBip(direction = "up") {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine";
    // AL = yükselen iki nota, SAT = alçalan
    const f1 = direction === "up" ? 660 : 880;
    const f2 = direction === "up" ? 990 : 440;
    osc.frequency.setValueAtTime(f1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

const mailCooldown = {};
function canSendMail(sym) {
  const last = mailCooldown[sym] ?? 0;
  if (Date.now() - last < 30 * 60 * 1000) return false;
  mailCooldown[sym] = Date.now();
  return true;
}
const ls = {
  load: (k, d) => { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch { return d; } },
  save: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ═══════════════════════════════════════════════════════════
// ANA UYGULAMA
// ═══════════════════════════════════════════════════════════
export default function BISTBot() {
  const [page, setPage]             = useState("market");
  const [sel, setSel]               = useState("THYAO");
  const [tab, setTab]               = useState("fiyat");
  const [search, setSearch]         = useState("");
  const [showDD, setShowDD]         = useState(false);
  const [chartData, setChartData]   = useState([]);
  const [allStocks, setAllStocks]   = useState({});
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [lastUpd, setLastUpd]       = useState(null);
  const [tick, setTick]             = useState(0);
  const [scanLoading, setScanLoad]  = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [cryptoList, setCryptoList] = useState([]);
  const [cryptoLoad, setCryptoLoad] = useState(false);
  const [cryptoSignals, setCryptoSignals] = useState({});
  const [cryptoScanLoad, setCryptoScanLoad] = useState(false);
  const [cryptoSel, setCryptoSel] = useState(null);          // {symbol, pair, price, rate, volume}
  const [cryptoChartData, setCryptoChartData] = useState([]);
  const [cryptoChartLoad, setCryptoChartLoad] = useState(false);
  const [cryptoHigherTrend, setCryptoHigherTrend] = useState(null);
  const [cryptoHigherRows, setCryptoHigherRows] = useState(null);
  // AI ANALİZ state
  const [btResult, setBtResult]   = useState(null);
  const [btLoad, setBtLoad]       = useState(false);
  // Pozisyon büyüklüğü ayarı (portföy büyüklüğü + risk yüzdesi)
  const [portfolio, setPortfolio] = useState(() => +(localStorage.getItem("feybot_pf") || 100000));
  const [riskPct, setRiskPct]     = useState(() => +(localStorage.getItem("feybot_risk") || 1.5));
  const [lastAiTime, setLastAiTime] = useState(0);
  const [aiKey, setAiKey]         = useState(localStorage.getItem("feybot_aikey") || "");
  const [aiPanel, setAiPanel]     = useState(false);
  const [aiResp, setAiResp]       = useState(null);
  const [aiLoad, setAiLoad]       = useState(false);
  const [aiErr, setAiErr]         = useState(null);

  const runAI = async (sym, name, sigRes, isCryptoCtx, livePrice) => {
    if (!aiKey) { setAiPanel(true); return; }
    // 5 sn cooldown (gereksiz API maliyetinden korur)
    if (Date.now() - lastAiTime < 5000) { setAiErr("Çok hızlı — 5 sn bekle (API maliyeti koruması)"); return; }
    setLastAiTime(Date.now());
    setAiLoad(true); setAiErr(null); setAiResp(null);
    try {
      const last = sigRes.last;
      const bbPos = (last.bbU && last.bbL && last.bbU !== last.bbL) ? ((last.close - last.bbL) / (last.bbU - last.bbL)).toFixed(2) : "—";
      const ind = {
        price: livePrice || last.close,
        rsi: last.rsi?.toFixed(1) ?? "—",
        macdHist: last.macdHist?.toFixed(3) ?? "—",
        bbPos, stoch: last.stochRsi?.toFixed(1) ?? "—",
        atr: sigRes.atr ?? "—",
      };
      const txt = await aiAnalyze(aiKey, sym, name, sigRes, ind, sigRes.profile, isCryptoCtx);
      setAiResp({ symbol: sym, text: txt, time: new Date().toLocaleTimeString("tr-TR") });
    } catch (e) {
      setAiErr(e.message);
    } finally { setAiLoad(false); }
  };
  const [email, setEmail]           = useState(localStorage.getItem(LS_EMAIL) || "");
  const [emailSaved, setEmailSaved] = useState(!!localStorage.getItem(LS_EMAIL));
  const [showEmail, setShowEmail]   = useState(false);
  const [alertLog, setAlertLog]     = useState(() => ls.load(LS_ALERTS, []));
  const [sending, setSending]       = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [favs, setFavs]             = useState(() => ls.load(LS_FAVS, []));
  const [sigHistory, setSigHistory] = useState(() => ls.load(LS_SIGHIST, []));
  const prevSigs = useRef(ls.load(LS_PREVSIGS, {}));
  const selRef   = useRef(sel);

  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { localStorage.setItem("feybot_pf", portfolio); }, [portfolio]);
  useEffect(() => { localStorage.setItem("feybot_risk", riskPct); }, [riskPct]);
  // prevSigs leak fix — sadece son 100 sembolü tut
  useEffect(() => {
    const keys = Object.keys(prevSigs.current);
    if (keys.length > 100) {
      const trimmed = {};
      keys.slice(-100).forEach(k => { trimmed[k] = prevSigs.current[k]; });
      prevSigs.current = trimmed;
      ls.save(LS_PREVSIGS, trimmed);
    }
  }, [tick]);

  const toggleFav = (sym) => {
    setFavs(prev => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym];
      ls.save(LS_FAVS, next);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.toUpperCase();
    return q.length < 1 ? STOCKS : STOCKS.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q));
  }, [search]);

  const buildChart = useCallback((sym) => {
    const live = liveCache[sym] ?? [];
    const hist = histCache[sym] ?? [];
    const combined = live.length >= 30 ? live : [...hist, ...live];
    if (combined.length > 0) setChartData(enrichData(combined));
    else setChartData([]);
  }, []);

  // Periyodik tarama: seçili + favoriler
  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      // Seçili + favoriler + ticker'da gösterilen ilk 50 BIST hissesi (fiyat akışı için)
      const tickerSyms = STOCKS.slice(0, 50).map(s => s.symbol);
      const list = Array.from(new Set([selRef.current, ...favs, ...tickerSyms])).filter(Boolean);
      const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const map  = { ...allStocks };

      const BATCH = 5;
      for (let i = 0; i < list.length; i += BATCH) {
        const batch = list.slice(i, i + BATCH);
        await Promise.all(batch.map(async sym => {
          try {
            const d = await fetchYahooChart(sym, "15m", "5d");
            if (d?.rows?.length) {
              liveCache[sym] = d.rows; liveTS[sym] = Date.now();
              const last = d.rows[d.rows.length - 1];
              // Fiyat ÖNCE Yahoo meta'sından (regularMarketPrice = anlık), yoksa son bar
              const lastPrice = d.meta?.regularMarketPrice ?? last.close;
              const prevClose = d.meta?.previousClose ?? d.meta?.chartPreviousClose;
              let rate;
              if (prevClose && prevClose > 0) {
                rate = +((lastPrice - prevClose) / prevClose * 100).toFixed(2);
              } else {
                // Meta yoksa: aynı günün ilk barını bul
                const lastDay = new Date((last.ts || Date.now()) + 3*3600*1000).toISOString().slice(0, 10);
                let openOfDay = last;
                for (const r of d.rows) {
                  const k = new Date((r.ts || 0) + 3*3600*1000).toISOString().slice(0, 10);
                  if (k === lastDay) { openOfDay = r; break; }
                }
                rate = openOfDay.open > 0 ? +((lastPrice - openOfDay.open) / openOfDay.open * 100).toFixed(2) : 0;
              }
              map[sym] = { price: lastPrice, rate, hacim: last.volume };
              saveCache(sym);
            }
          } catch {}
        }));
      }

      setAllStocks(map);
      setLastUpd(time);
      buildChart(selRef.current);

      // Sinyal değişimi takibi
      const newSigs = { ...prevSigs.current };
      const newAlerts  = [];
      const newHistory = [];
      for (const sym of list) {
        const pts = liveCache[sym] ?? [];
        if (pts.length < 20) continue;
        try {
          const res = getSignals(enrichData(pts), getHigherTrend(histCache[sym]), histCache[sym]);
          if (!res) continue;
          const prev = newSigs[sym];
          if (prev !== undefined && prev !== res.final) {
            newHistory.push({ symbol: sym, from: prev, to: res.final, price: res.last.close?.toFixed(2), confidence: res.confidence, time, dateKey: new Date().toISOString().slice(0,10) });
            // Bip ses uyarısı: AL = yükselen, SAT = alçalan
            if (res.final === "AL" || res.final === "SAT") playBip(res.final === "AL" ? "up" : "down");
            if (emailSaved && email && res.final !== "NÖTR" && canSendMail(sym)) {
              setSending(true);
              try {
                await sendAlertEmail(email, sym, res.final, res.last.close, res.confidence);
                newAlerts.push({ symbol: sym, signal: res.final, price: res.last.close?.toFixed(2), time, sent: true });
              } catch (e2) {
                newAlerts.push({ symbol: sym, signal: res.final, price: res.last.close?.toFixed(2), time, sent: false, error: e2.message });
              } finally { setSending(false); }
            }
          }
          newSigs[sym] = res.final;
        } catch {}
      }
      prevSigs.current = newSigs;
      ls.save(LS_PREVSIGS, newSigs);
      if (newHistory.length > 0) setSigHistory(h => { const next = [...newHistory, ...h].slice(0, 200); ls.save(LS_SIGHIST, next); return next; });
      if (newAlerts.length > 0)  setAlertLog(a => { const next = [...newAlerts, ...a].slice(0, 50); ls.save(LS_ALERTS, next); return next; });

      setTick(t => t + 1);
    } catch (e) { setError(`Veri alınamadı: ${e.message}`); }
    finally { setLoading(false); }
  }, [emailSaved, email, buildChart, favs]); // allStocks kaldırıldı — sonsuz döngü riski

  useEffect(() => {
    fetchAll();
    let id;
    const schedule = () => {
      const h  = new Date().getHours();
      const ms = h >= 10 && h < 18 ? 60000 : 240000;
      id = setTimeout(async () => { await fetchAll(); schedule(); }, ms);
    };
    schedule();
    return () => clearTimeout(id);
  }, []); // eslint-disable-line

  // KRİPTO sekmesine ilk girince otomatik yükle
  useEffect(() => {
    if (page === "crypto" && cryptoList.length === 0 && !cryptoLoad) loadCryptos(false);
  }, [page]); // eslint-disable-line

  // Hisse değişince — cache varsa anında göster, yoksa fetch + retry
  useEffect(() => {
    let cancelled = false;
    buildChart(sel);
    const tryFetch = async (attempt = 1) => {
      if (cancelled) return;
      const d = await fetchYahooChart(sel, "15m", "5d");
      if (cancelled) return;
      if (d?.rows?.length) {
        liveCache[sel] = d.rows; liveTS[sel] = Date.now();
        saveCache(sel); buildChart(sel);
      } else if (attempt < 3) {
        setTimeout(() => tryFetch(attempt + 1), 2500);
      }
    };
    if (!liveCache[sel] || liveCache[sel].length < 20 || Date.now() - (liveTS[sel] ?? 0) > 3 * 60000) {
      tryFetch();
    }
    if (!histCache[sel] || Date.now() - (histTS[sel] ?? 0) > 12 * 3600000) {
      fetchYahooChart(sel, "1d", "1y").then(d => {
        if (cancelled || !d?.rows?.length) return;
        histCache[sel] = d.rows; histTS[sel] = Date.now();
        saveCache(sel);
      });
    }
    return () => { cancelled = true; };
  }, [sel, buildChart]);

  useEffect(() => {
    const fn = () => Object.keys(liveCache).forEach(sym => { if ((liveCache[sym]?.length ?? 0) > 0) saveCache(sym); });
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, []);

  // Sekme/uygulama tekrar görünür olunca anında tazele — Safari arka planda timer'ı durdurur
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchAll();
        // Seçili hisse için 15m verisini de yeniden çek
        fetchYahooChart(selRef.current, "15m", "5d").then(d => {
          if (d?.rows?.length) {
            liveCache[selRef.current] = d.rows;
            liveTS[selRef.current] = Date.now();
            saveCache(selRef.current);
            buildChart(selRef.current);
          }
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [fetchAll, buildChart]);

  const sendTest = async () => {
    setTestStatus("sending");
    try { await sendAlertEmail(email, "THYAO", "AL", 99.50, 82); setTestStatus("ok"); }
    catch { setTestStatus("err"); }
    setTimeout(() => setTestStatus(null), 4000);
  };

  // KRİPTO detay aç — BIST gibi tam analiz
  const openCryptoDetail = async (c) => {
    setCryptoSel(c);
    setPage("cryptoDetail");
    setCryptoChartLoad(true);
    setCryptoChartData([]);
    setCryptoHigherTrend(null);
    const [rows, htRows] = await Promise.all([
      fetchCryptoKlines(c.pair, "15m", 200),
      fetchCryptoKlines(c.pair, "1d", 100),
    ]);
    if (rows?.length) setCryptoChartData(enrichData(rows));
    if (htRows?.length) { setCryptoHigherTrend(getHigherTrend(htRows)); setCryptoHigherRows(htRows); }
    setCryptoChartLoad(false);
  };

  // KRİPTO yükle + her birine sinyal motoru
  const loadCryptos = async (withSignals = false) => {
    setCryptoLoad(true);
    const list = await fetchTopCryptos();
    setCryptoList(list);
    setCryptoLoad(false);
    if (withSignals && list.length) {
      setCryptoScanLoad(true);
      const sigs = {};
      const BATCH = 6;
      for (let i = 0; i < list.length; i += BATCH) {
        const batch = list.slice(i, i + BATCH);
        await Promise.all(batch.map(async c => {
          try {
            const [rows, htRows] = await Promise.all([
              fetchCryptoKlines(c.pair, "15m", 200),
              fetchCryptoKlines(c.pair, "1d", 100),
            ]);
            if (!rows || rows.length < 20) return;
            const res = getSignals(enrichData(rows), getHigherTrend(htRows), htRows);
            if (res && res.final !== "NÖTR" && res.confidence >= 50) {
              sigs[c.symbol] = {
                signal: res.final, confidence: res.confidence, mod: res.mod,
                price: c.price, atr: res.atr, stopLoss: res.stopLoss, target1: res.target1,
                paLabel: res.signals?.PA?.label, paStrength: res.signals?.PA?.strength,
                priority: res.confidence + (res.signals?.PA?.strength >= 86 ? 25 : 0),
              };
            }
          } catch {}
        }));
        setCryptoSignals({...sigs});
      }
      setCryptoScanLoad(false);
    }
  };

  // PİYASA TARAMA — BIST 100 üzerinde paralel
  const runScan = async () => {
    setScanLoad(true);
    setScanResults([]);
    const out = [];
    // BIST 100 sembolleri (en likit 100 hisse)
    const BIST100 = ["A1CAP","AEFES","AGHOL","AGROT","AHGAZ","AKBNK","AKFYE","AKSA","AKSEN","ALARK","ALFAS","ALTNY","ANSGR","ARCLK","ASELS","ASTOR","ASUZU","BERA","BIENY","BIMAS","BINHO","BIOEN","BRSAN","BRYAT","BTCIM","CANTE","CCOLA","CIMSA","CLEBI","CWENE","DAPGM","DOAS","DOHOL","ECILC","EGEEN","EKGYO","ENERY","ENJSA","ENKAI","EREGL","EUREN","FROTO","GARAN","GESAN","GUBRF","HALKB","HEKTS","IPEKE","ISCTR","ISMEN","KARSN","KCAER","KCHOL","KLSER","KMPUR","KONTR","KONYA","KOZAA","KOZAL","KRDMD","LMKDC","MAVI","MGROS","MIATK","MPARK","ODAS","OTKAR","OYAKC","PEKGY","PETKM","PGSUS","QUAGR","REEDR","SAHOL","SASA","SDTTR","SISE","SKBNK","SMRTG","SOKM","TABGD","TAVHL","TCELL","THYAO","TKFEN","TOASO","TSKB","TTKOM","TTRAK","TUKAS","TUPRS","TURSG","ULKER","VAKBN","VESBE","VESTL","YEOTK","YKBNK","ZOREN"];
    const list = Array.from(new Set([...favs, ...BIST100]));
    const BATCH = 5;
    for (let i = 0; i < list.length; i += BATCH) {
      const batch = list.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async sym => {
        try {
          let pts = liveCache[sym];
          if (!pts || pts.length < 20) {
            const d = await fetchYahooChart(sym, "15m", "5d");
            if (d?.rows?.length) { liveCache[sym] = d.rows; liveTS[sym] = Date.now(); pts = d.rows; }
          }
          if (!pts || pts.length < 20) return null;
          // Üst zaman dilimi: günlük data cache'te yoksa hızlıca çek
          let htRows = histCache[sym];
          if (!htRows || htRows.length < 50) {
            const dh = await fetchYahooChart(sym, "1d", "6mo");
            if (dh?.rows?.length) { histCache[sym] = dh.rows; histTS[sym] = Date.now(); htRows = dh.rows; }
          }
          const ht = getHigherTrend(htRows);
          const res = getSignals(enrichData(pts), ht, htRows);
          if (!res || res.final === "NÖTR" || res.confidence < 50) return null;
          // Aynı yön HTF onayı varsa ekstra +15 öncelik
          const htfBonus  = res.htfNote && res.htfNote.includes("✓") ? 15 : 0;
          const paBonus = res.signals.PA?.strength >= 86 ? 25 : res.signals.PA?.strength >= 80 ? 12 : 0;
          const dipBonus = res.dipSignal?.score >= 5 ? 18 : res.dipSignal?.score >= 4 ? 8 : 0;
          return { sym, signal: res.final, confidence: res.confidence, mod: res.mod,
            price: res.last.close, atr: res.atr, stopLoss: res.stopLoss, target1: res.target1,
            adx: res.adx, dipScore: res.dipSignal?.score,
            paLabel: res.signals.PA?.label, paStrength: res.signals.PA?.strength,
            htfNote: res.htfNote, durationLabel: res.profile?.dur,
            priority: res.confidence + paBonus + dipBonus + htfBonus };
        } catch { return null; }
      }));
      results.filter(Boolean).forEach(r => out.push(r));
      // Önce AL (alfabetik), sonra SAT (alfabetik)
      setScanResults([...out].sort((a, b) => {
        if (a.signal !== b.signal) return a.signal === "AL" ? -1 : 1;
        return a.sym.localeCompare(b.sym);
      }));
    }
    setScanLoad(false);
  };

  const live   = allStocks[sel];
  const result = useMemo(() => getSignals(chartData, getHigherTrend(histCache[sel]), histCache[sel]), [chartData, sel]);
  // RS vs BIST 100 — BIST 100 ortalama günlük değişim
  const bist100Rate = useMemo(() => {
    const BIST100 = ["AKBNK","GARAN","ISCTR","YKBNK","HALKB","VAKBN","SAHOL","KCHOL","THYAO","BIMAS","FROTO","TOASO","SISE","EREGL","ASELS","TUPRS","PETKM","MGROS","TCELL","TTKOM"];
    const rates = BIST100.map(s => allStocks[s]?.rate).filter(r => r != null);
    return rates.length > 5 ? +(rates.reduce((a,b)=>a+b,0) / rates.length).toFixed(2) : null;
  }, [allStocks]);
  const rs = (live?.rate != null && bist100Rate != null) ? +(live.rate - bist100Rate).toFixed(2) : null;
  // Ana pano: en güçlü 5 AL + 5 SAT — priority (confidence + PA + dip + HTF bonus) sıralı
  const topAL  = useMemo(() =>
    scanResults.filter(r => r.signal === "AL")
      .sort((a, b) => (b.priority ?? b.confidence) - (a.priority ?? a.confidence))
      .slice(0, 5), [scanResults]);
  const topSAT = useMemo(() =>
    scanResults.filter(r => r.signal === "SAT")
      .sort((a, b) => (b.priority ?? b.confidence) - (a.priority ?? a.confidence))
      .slice(0, 5), [scanResults]);
  // Backtest çalıştır
  const runBacktest = () => {
    setBtLoad(true);
    setTimeout(() => {
      const rows = histCache[sel];
      if (rows && rows.length > 60) setBtResult(backtest(rows));
      else setBtResult({ trades: 0, winrate: 0, avgPnl: 0, score: 0, error: "Yeterli geçmiş veri yok" });
      setBtLoad(false);
    }, 50);
  };
  const vis    = chartData.slice(-80);
  const pct    = live?.rate ?? 0;
  const isUp   = pct >= 0;
  const stock  = STOCKS.find(s => s.symbol === sel);
  const isFav  = favs.includes(sel);
  const fc     = result?.final === "AL" ? T.green : result?.final === "SAT" ? T.red : T.muted;
  const trendColor = result?.trendMod === "YUKARI" ? T.green : result?.trendMod === "ASAGI" ? T.red : T.muted;
  const xT     = vis.filter((_, i) => i % Math.ceil(Math.max(vis.length/8, 1)) === 0).map(d => d.date);
  const TABS   = [{ id: "fiyat", label: "FİYAT" }, { id: "rsi", label: "RSI" }, { id: "macd", label: "MACD" }];

  const favSignals = useMemo(() => {
    return favs.map(sym => {
      const pts = liveCache[sym] ?? [];
      const t   = allStocks[sym];
      if (pts.length < 20) return { sym, signal: "—", confidence: 0, price: t?.price, rate: t?.rate };
      try {
        const res = getSignals(enrichData(pts), getHigherTrend(histCache[sym]), histCache[sym]);
        return { sym, signal: res?.final ?? "—", confidence: res?.confidence ?? 0, price: t?.price, rate: t?.rate, mod: res?.mod };
      } catch { return { sym, signal: "—", confidence: 0, price: t?.price, rate: t?.rate }; }
    });
  }, [tick, favs, allStocks]); // eslint-disable-line

  return (
    <div className="has-bottom-nav" style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.font, display: "flex", flexDirection: "column" }}>
      <style>{CSS}</style>

      {/* TOPBAR */}
      <div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 22, background: `linear-gradient(180deg,${T.green},${T.blue})`, borderRadius: 2 }} />
            <span style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}><span style={{ color: T.red }}>FEY</span><span style={{ color: T.text }}>BOT</span></span>
            <span className="desk-only" style={{ fontSize: 10, color: T.muted, border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.3, fontWeight: 500 }}>v5.3</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {loading && <div style={{ width: 9, height: 9, border: `1.5px solid ${T.dim}`, borderTop: `1.5px solid ${T.blue}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
            {lastUpd && <span onClick={() => fetchAll()} title="Şimdi yenile" style={{ fontSize: 10, color: T.green, animation: "pulse 3s infinite", cursor: "pointer", userSelect: "none" }}>↻ {lastUpd}</span>}
            <button className="btn" onClick={() => setAiPanel(p => !p)}
              style={{ background: aiKey ? `${T.purple}15` : T.bg2, border: `1px solid ${aiKey ? T.purple : T.border}`, color: aiKey ? T.purple : T.muted, borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 10 }}>
              🤖 {aiKey ? "AI" : "AI?"}
            </button>
            <button className="btn" onClick={() => setShowEmail(p => !p)}
              style={{ background: emailSaved ? `${T.green}15` : T.bg2, border: `1px solid ${emailSaved ? T.green : T.border}`, color: emailSaved ? T.green : T.muted, borderRadius: 5, padding: "4px 8px", cursor: "pointer", fontSize: 10 }}>
              {sending ? "📤" : emailSaved ? "🔔 ON" : "🔔 OFF"}
            </button>
          </div>
        </div>
        <div className="ticker-bar" style={{ overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 50, background: `linear-gradient(90deg,${T.bg1},transparent)`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 50, background: `linear-gradient(270deg,${T.bg1},transparent)`, zIndex: 2, pointerEvents: "none" }} />
          <div style={{ display: "flex", animation: "marquee 240s linear infinite", width: "max-content" }}>
            {[0, 1].map(copy => (
              <div key={copy} style={{ display: "flex" }}>
                {STOCKS.slice(0, 50).map(s => {
                  const t = allStocks[s.symbol];
                  const up = t ? t.rate >= 0 : true;
                  const act = sel === s.symbol && page === "market";
                  const fav = favs.includes(s.symbol);
                  return (
                    <div key={s.symbol + copy} onClick={() => { setSel(s.symbol); setPage("market"); }}
                      style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, padding: "6px 14px", flexShrink: 0, borderRight: `1px solid ${T.border}`, borderBottom: act ? `2px solid ${T.green}` : "2px solid transparent", background: act ? `${T.green}06` : "transparent", minWidth: 90 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {fav && <span style={{ fontSize: 9, color: T.yellow }}>★</span>}
                        <span style={{ fontSize: 12, fontWeight: 700, color: act ? T.green : T.blue, letterSpacing: 0.3 }}>{s.symbol}</span>
                      </div>
                      {t ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span className="tnum" style={{ fontSize: 11, color: T.text, fontWeight: 500 }}>{t.price.toFixed(2)}₺</span>
                          <span className="tnum" style={{ fontSize: 10, color: up ? T.green : T.red, fontWeight: 600 }}>{up ? "▲" : "▼"}{Math.abs(t.rate).toFixed(2)}%</span>
                        </div>
                      ) : <span style={{ fontSize: 9, color: T.dim, animation: "pulse 1.5s infinite" }}>···</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI PANEL */}
      {aiPanel && (
        <div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, padding: "12px 14px", animation: "fadeIn .2s", flexShrink: 0 }}>
          <div style={{ maxWidth: 1116, margin: "0 auto" }}>
            <div style={{ fontSize: 12, color: T.purple, fontWeight: 700, marginBottom: 6 }}>🤖 AI ANALİZ — Anthropic Claude</div>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 8, lineHeight: 1.5 }}>
              API anahtarınla teknik analizi haber + makro bağlamla harmanlar. Anahtar SADECE telefonunda saklanır (localStorage), sunucumuza gönderilmez. Doğrudan api.anthropic.com'a HTTPS isteği gider.
              <br/>Anahtar al: <span style={{ color: T.blue }}>console.anthropic.com → API Keys</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder="sk-ant-api03-..."
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 5, padding: "6px 10px", fontSize: 11, fontFamily: T.font, width: 280, outline: "none" }} />
              <button className="btn" onClick={() => { localStorage.setItem("feybot_aikey", aiKey); setAiPanel(false); }}
                style={{ background: `${T.purple}20`, border: `1px solid ${T.purple}`, color: T.purple, borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>KAYDET</button>
              {aiKey && <button className="btn" onClick={() => { setAiKey(""); localStorage.removeItem("feybot_aikey"); }}
                style={{ background: `${T.red}10`, border: `1px solid ${T.red}44`, color: T.red, borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>SİL</button>}
            </div>
          </div>
        </div>
      )}

      {/* EMAIL PANEL */}
      {showEmail && (
        <div style={{ background: T.bg1, borderBottom: `1px solid ${T.border}`, padding: "12px 14px", animation: "fadeIn .2s", flexShrink: 0 }}>
          <div style={{ maxWidth: 1116, margin: "0 auto" }}>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>📧 Sinyal değişince mail — 30dk cooldown.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@gmail.com"
                style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 5, padding: "6px 10px", fontSize: 12, fontFamily: T.font, width: 200, outline: "none" }} />
              <button className="btn" onClick={() => { if (email.includes("@")) { setEmailSaved(true); localStorage.setItem(LS_EMAIL, email); setShowEmail(false); } }}
                style={{ background: `${T.blue}20`, border: `1px solid ${T.blue}`, color: T.blue, borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>
                {emailSaved ? "✓ GÜNCELLE" : "KAYDET"}
              </button>
              {emailSaved && <>
                <button className="btn" onClick={sendTest}
                  style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>
                  {testStatus === "sending" ? "..." : testStatus === "ok" ? "✓ OK" : testStatus === "err" ? "✗" : "TEST"}
                </button>
                <button className="btn" onClick={() => { setEmailSaved(false); setEmail(""); localStorage.removeItem(LS_EMAIL); localStorage.removeItem(LS_PREVSIGS); prevSigs.current = {}; }}
                  style={{ background: `${T.red}10`, border: `1px solid ${T.red}44`, color: T.red, borderRadius: 5, padding: "6px 12px", cursor: "pointer", fontSize: 11 }}>
                  KAPAT
                </button>
              </>}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* SOL NAV (DESKTOP) */}
        <div className="desk-only" style={{ width: 72, background: T.bg1, borderRight: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 2, padding: "10px 0", position: "sticky", top: 0, height: "100vh", flexShrink: 0 }}>
          <NavBtn id="market"    page={page} setPage={setPage} icon={<BistLogo size={22} />} label="BIST" />
          <NavBtn id="crypto"    page={page} setPage={setPage} icon="₿" label="KRİPTO" />
          <NavBtn id="favorites" page={page} setPage={setPage} icon="★" label="FAVORİ" badge={favs.length} />
          <NavBtn id="scanner"   page={page} setPage={setPage} icon="🔍" label="TARA" />
          <NavBtn id="signals"   page={page} setPage={setPage} icon="📶" label="SİNYAL" badge={sigHistory.length} />
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* FAVORİLER */}
          {page === "favorites" && (
            <div className="mob-pad" style={{ padding: "20px", maxWidth: 1060, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 700, color: T.yellow }}>★ FAVORİLER</span>
                <span style={{ fontSize: 11, color: T.muted }}>{favs.length} hisse</span>
              </div>
              {favs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>☆</div>
                  Henüz favori yok. Hisse sayfasında ☆ butonuna bas.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
                  {favSignals.map(f => {
                    const fc2 = f.signal === "AL" ? T.green : f.signal === "SAT" ? T.red : T.muted;
                    const up  = (f.rate ?? 0) >= 0;
                    return (
                      <div key={f.sym} onClick={() => { setSel(f.sym); setPage("market"); }}
                        style={{ background: T.bg1, border: `1px solid ${fc2}33`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", animation: "fadeIn .3s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div>
                            <div style={{ fontFamily: T.fontD, fontSize: 17, fontWeight: 700, color: T.text, letterSpacing: 1 }}>{f.sym}</div>
                            <div style={{ fontSize: 10, color: T.muted }}>{STOCKS_MAP[f.sym] || ""}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            {f.price != null && <div style={{ fontFamily: T.fontD, fontSize: 15, fontWeight: 700, color: up ? T.green : T.red }}>{f.price.toFixed(2)}₺</div>}
                            {f.rate  != null && <div style={{ fontSize: 11, color: up ? T.green : T.red }}>{up ? "▲" : "▼"}{Math.abs(f.rate).toFixed(2)}%</div>}
                          </div>
                        </div>
                        {/* Sparkline — son 30 gün trend */}
                        {(() => {
                          const sparkData = (histCache[f.sym] || []).slice(-30).map(r => r.close);
                          return sparkData.length > 5 ? <div style={{ marginBottom: 8, width: "100%" }}><Spark data={sparkData} h={24} /></div> : null;
                        })()}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ background: `${fc2}15`, border: `1px solid ${fc2}44`, color: fc2, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>{f.signal}</span>
                          {f.confidence > 0 && <span style={{ fontSize: 11, color: T.muted }}>%{f.confidence}</span>}
                          <button onClick={e => { e.stopPropagation(); toggleFav(f.sym); }}
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: T.yellow, fontSize: 14 }}>★</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TARAYICI */}
          {page === "crypto" && (
            <div className="mob-pad" style={{ padding: "20px", maxWidth: 1060, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 700, color: T.yellow }}>₿ KRİPTO</span>
                <button className="btn" onClick={() => loadCryptos(false)} disabled={cryptoLoad}
                  style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 11 }}>
                  {cryptoLoad ? "..." : "🔄 YENİLE"}
                </button>
                <button className="btn" onClick={() => loadCryptos(true)} disabled={cryptoScanLoad}
                  style={{ background: `${T.green}20`, border: `1px solid ${T.green}`, color: T.green, borderRadius: 5, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                  {cryptoScanLoad ? `TARANIYOR ${Object.keys(cryptoSignals).length}` : "⚡ SİNYAL TARA"}
                </button>
                <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}>Binance · Top 50 USDT · Hacme göre</span>
              </div>
              {cryptoList.length === 0 && !cryptoLoad && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>₿</div>
                  YENİLE'ye bas — Binance'tan top 50 kripto + canlı fiyat gelir.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 8 }}>
                {cryptoList
                  .sort((a, b) => b.volume - a.volume)
                  .map(c => {
                    const cUp = c.rate >= 0;
                    const sg  = cryptoSignals[c.symbol];
                    const cl  = sg?.signal === "AL" ? T.green : sg?.signal === "SAT" ? T.red : T.border;
                    return (
                      <div key={c.symbol} onClick={() => openCryptoDetail(c)}
                        style={{ background: T.bg1, border: `1px solid ${cl}44`, borderRadius: 8, padding: "10px 12px", animation: "fadeIn .3s", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontFamily: T.fontD, fontSize: 16, fontWeight: 700, color: T.text, letterSpacing: 1 }}>{c.symbol}</span>
                          {sg && <span style={{ background: `${cl}15`, border: `1px solid ${cl}66`, color: cl, borderRadius: 12, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{sg.signal} %{sg.confidence}</span>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 4 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: cUp ? T.green : T.red }}>${c.price.toFixed(c.price < 1 ? 4 : 2)}</span>
                          <span style={{ fontSize: 11, color: cUp ? T.green : T.red, fontWeight: 600 }}>{cUp ? "▲" : "▼"}{Math.abs(c.rate).toFixed(2)}%</span>
                        </div>
                        {sg?.paLabel && sg.paStrength >= 80 && <div style={{ fontSize: 10, color: T.green, fontWeight: 700, marginBottom: 3 }}>⚡ {sg.paLabel}</div>}
                        {sg && (
                          <div style={{ fontSize: 10, color: T.muted, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span>{sg.mod}</span>
                            {sg.target1 && <span style={{ color: T.green }}>H: {sg.target1}</span>}
                            {sg.stopLoss && <span style={{ color: T.red }}>S: {sg.stopLoss}</span>}
                          </div>
                        )}
                        <div style={{ fontSize: 9, color: T.dim, marginTop: 5, borderTop: `1px solid ${T.border}`, paddingTop: 4 }}>
                          Hacim: ${(c.volume / 1e6).toFixed(1)}M
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* KRİPTO DETAY — BIST gibi tam analiz */}
          {page === "cryptoDetail" && cryptoSel && (() => {
            const cd = cryptoChartData;
            const cRes = cd.length >= 20 ? getSignals(cd, cryptoHigherTrend, cryptoHigherRows) : null;
            const cVis = cd.slice(-80);
            const cIsUp = (cryptoSel.rate ?? 0) >= 0;
            const cFc = cRes?.final === "AL" ? T.green : cRes?.final === "SAT" ? T.red : T.muted;
            const cTC = cRes?.trendMod === "YUKARI" ? T.green : cRes?.trendMod === "ASAGI" ? T.red : T.muted;
            const cXt = cVis.filter((_, i) => i % Math.ceil(Math.max(cVis.length/8, 1)) === 0).map(d => d.date);
            const ep = cryptoSel.price;
            const px = (v) => v == null ? "—" : (v < 1 ? v.toFixed(4) : v.toFixed(2));
            return (
              <div className="mob-pad" style={{ maxWidth: 1060, margin: "0 auto", padding: "16px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <button className="btn" onClick={() => { setPage("crypto"); setCryptoSel(null); setCryptoChartData([]); }}
                    style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 5, padding: "5px 10px", cursor: "pointer", fontSize: 12 }}>← KRİPTO</button>
                  <h1 className="mob-h1" style={{ margin: 0, fontFamily: T.fontD, fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>{cryptoSel.symbol}</h1>
                  <span style={{ fontSize: 10, color: T.muted, border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 4 }}>USDT · Binance</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
                  <span className="mob-px" style={{ fontFamily: T.fontD, fontSize: 32, fontWeight: 700, color: cIsUp ? T.green : T.red }}>${px(cryptoSel.price)}</span>
                  <span style={{ fontSize: 13, color: cIsUp ? T.green : T.red, fontWeight: 600 }}>{cIsUp ? "▲" : "▼"} {Math.abs(cryptoSel.rate).toFixed(2)}%</span>
                  <span style={{ fontSize: 11, color: T.muted, marginLeft: "auto" }}>Hacim ${(cryptoSel.volume/1e6).toFixed(1)}M</span>
                </div>

                {cryptoChartLoad && (
                  <div style={{ background: T.bg2, border: `1px solid ${T.yellow}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 9, height: 9, border: `1.5px solid ${T.dim}`, borderTop: `1.5px solid ${T.yellow}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <span style={{ fontSize: 12, color: T.yellow }}>Binance'tan 15m + 1d veriler çekiliyor...</span>
                  </div>
                )}

                {cRes && (() => {
                  // getSignals'tan gelen akıllı vade profilini kullan
                  const ATR = cRes.atr ?? 0;
                  const sl = cRes.stopLoss; const t1 = cRes.target1; const t2 = cRes.target2;
                  const riskP = sl ? +((ep - sl) / ep * 100).toFixed(2) : null;
                  const g1P   = t1 ? +((t1 - ep) / ep * 100).toFixed(2) : null;
                  const g2P   = t2 ? +((t2 - ep) / ep * 100).toFixed(2) : null;
                  let txt = "BEKLE", det = "";
                  const cv = cRes.profile ? `Vade: ${cRes.profile.dur} · ${cRes.profile.why}` : "";
                  if      (cRes.final === "AL"  && cRes.trendMod === "YUKARI") { txt = "TREND YÖNÜNDE AL"; det = `MA200 üstünde · ADX ${cRes.adx?.toFixed(0)} · ${cv}`; }
                  else if (cRes.final === "AL"  && cRes.dipSignal)              { txt = "DİP DÖNÜŞ AL"; det = `${cRes.dipSignal.score}/7 şart · ${cv}`; }
                  else if (cRes.final === "AL")                                  { txt = "TEMKİNLİ AL"; det = `ADX ${cRes.adx?.toFixed(0)} (zayıf) · ${cv}`; }
                  else if (cRes.final === "SAT" && cRes.trendMod === "ASAGI")   { txt = "ÇIKIŞ / SAT"; det = "MA200 altında · pozisyon kapat"; }
                  else if (cRes.final === "SAT")                                 { txt = "SAT"; det = "Satış baskısı"; }
                  else                                                            { txt = "BEKLE"; det = cRes.waitReasons?.length ? "Sebep: " + cRes.waitReasons.join(" · ") : "Net sinyal yok"; }
                  return (
                    <div style={{ background: `linear-gradient(135deg,${T.bg1},${T.bg2})`, border: `1px solid ${cFc}44`, borderRadius: 12, padding: "16px", marginBottom: 12, position: "relative" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${cFc},transparent)` }} />
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                        <div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ background: `${cTC}15`, border: `1px solid ${cTC}44`, color: cTC, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>{cRes.mod}</span>
                            {cRes.adx > 0 && <span style={{ background: T.bg2, border: `1px solid ${T.border}`, color: cRes.trendStrong ? T.green : T.muted, borderRadius: 20, padding: "3px 10px", fontSize: 10 }}>ADX {cRes.adx.toFixed(0)}</span>}
                            {cRes.profile && <span style={{ background: `${T.yellow}15`, border: `1px solid ${T.yellow}66`, color: T.yellow, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>⏱ {cRes.profile.dur}</span>}
                            {cRes.htfNote && <span style={{ background: T.bg2, border: `1px solid ${T.border}`, color: cRes.htfNote.includes("✓") ? T.green : T.red, borderRadius: 20, padding: "3px 10px", fontSize: 10 }}>{cRes.htfNote}</span>}
                          </div>
                          <div style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 700, color: cFc, letterSpacing: 2, marginBottom: 6 }}>{txt}</div>
                          <div style={{ fontSize: 11, color: T.muted, maxWidth: 380, lineHeight: 1.5 }}>{det}</div>
                        </div>
                        <div style={{ background: T.bg, border: `1px solid ${cFc}33`, borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2 }}>GÜVEN</div>
                          <div style={{ fontFamily: T.fontD, fontSize: 30, fontWeight: 700, color: cFc, lineHeight: 1 }}>{cRes.confidence}</div>
                          <div style={{ fontSize: 10, color: T.muted }}>%</div>
                        </div>
                      </div>
                      {sl && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 6 }}>
                          {[
                            { l: "→ GİRİŞ",      sub: "Alım fiyatı",   p: "$"+px(ep), x: null,                                  c: T.blue },
                            { l: "⛔ ZARAR DUR", sub: "Stop seviyesi", p: "$"+px(sl), x: riskP ? `-${Math.abs(riskP)}%` : null,  c: T.red },
                            { l: "🎯 1. HEDEF",  sub: "İlk satış",     p: "$"+px(t1), x: g1P ? `+${g1P}%` : null,                c: T.green },
                            { l: "🎯 2. HEDEF",  sub: "Uzun tut",      p: "$"+px(t2), x: g2P ? `+${g2P}%` : null,                c: T.green },
                            { l: "📊 OYNAKLIK",  sub: "ATR",           p: "$"+px(ATR), x: null,                                  c: T.yellow },
                          ].map(s => (
                            <div key={s.l} style={{ background: `${s.c}10`, border: `1px solid ${s.c}40`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: s.c, marginBottom: 4, letterSpacing: 0.2, fontWeight: 600 }}>{s.l}</div>
                              <div className="tnum" style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{s.p}</div>
                              {s.x && <div className="tnum" style={{ fontSize: 10, color: s.c, fontWeight: 600 }}>{s.x}</div>}
                              {s.sub && <div style={{ fontSize: 9, color: T.muted, marginTop: 3 }}>{s.sub}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {cRes && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => runAI(cryptoSel.symbol, cryptoSel.symbol, cRes, true, cryptoSel.price)} disabled={aiLoad}
                      style={{ background: `${T.purple}20`, border: `1px solid ${T.purple}`, color: T.purple, borderRadius: 6, padding: "8px 14px", cursor: aiLoad ? "wait" : "pointer", fontSize: 12, fontWeight: 700 }}>
                      {aiLoad ? "🤖 ANALİZ..." : "🤖 AI ANALİZ"}
                    </button>
                    {!aiKey && <span style={{ fontSize: 10, color: T.muted }}>Önce üst barda 🤖 → API key</span>}
                  </div>
                )}
                {aiErr && <div style={{ background: `${T.red}10`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 11, color: T.red }}>⚠ {aiErr}</div>}
                {aiResp && aiResp.symbol === cryptoSel.symbol && (
                  <div style={{ background: `${T.purple}08`, border: `1px solid ${T.purple}44`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, animation: "fadeIn .3s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: T.fontD, fontSize: 13, fontWeight: 700, color: T.purple }}>🤖 CLAUDE — AI ANALİZ</span>
                      <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}>{aiResp.time}</span>
                    </div>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{aiResp.text}</div>
                  </div>
                )}

                {cRes && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                    <SigCard name="MA TREND" sig={cRes.signals.MA} />
                    <SigCard name="MACD" sig={cRes.signals.MACD} />
                    <SigCard name="RSI 14" sig={cRes.signals.RSI} />
                    <SigCard name="BOLLINGER" sig={cRes.signals.BB} />
                    <SigCard name="STOCH" sig={cRes.signals.SRSI} />
                    <SigCard name="HACİM" sig={cRes.signals.VOL} />
                    <SigCard name="ADX" sig={cRes.signals.ADX} />
                    <SigCard name="SUPERTREND" sig={cRes.signals.STR} />
                    <SigCard name="PRICE ACT." sig={cRes.signals.PA} />
                    <SigCard name="MOMENTUM"   sig={cRes.signals.MOM} />
                  </div>
                )}

                <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "8px", marginBottom: 14 }}>
                  {cd.length >= 5 ? <LWChart data={cd} height={400} /> :
                    <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: T.muted }}>
                      <div style={{ width: 24, height: 24, border: `2px solid ${T.dim}`, borderTop: `2px solid ${T.yellow}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontSize: 12 }}>{cryptoSel.symbol} için Binance data yükleniyor...</span>
                    </div>}
                </div>

                {cRes && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    <StatBox label="FİYAT" value={"$"+px(ep)} color={cIsUp?T.green:T.red} />
                    <StatBox label="DEĞ." value={(cIsUp?"▲":"▼")+Math.abs(cryptoSel.rate).toFixed(2)+"%"} color={cIsUp?T.green:T.red} />
                    <StatBox label="RSI" value={cRes.last?.rsi?.toFixed(1)??"—"} color={T.purple} />
                    <StatBox label="ADX" value={cRes.adx?.toFixed(0)??"—"} color={cRes.trendStrong?T.green:T.muted} />
                    <StatBox label="ATR" value={cRes.atr?"$"+px(cRes.atr):"—"} color={T.yellow} />
                    <StatBox label="ST" value={cRes.last?.stDir===1?"↑":"↓"} color={cRes.last?.stDir===1?T.green:T.red} />
                  </div>
                )}
              </div>
            );
          })()}

          {page === "scanner" && (
            <div className="mob-pad" style={{ padding: "20px", maxWidth: 1060, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 700, color: T.purple }}>⌬ TARAYICI</span>
                <button className="btn" onClick={runScan} disabled={scanLoading}
                  style={{ background: scanLoading ? T.bg2 : `${T.green}20`, border: `1px solid ${T.green}`, color: T.green, borderRadius: 6, padding: "6px 16px", cursor: scanLoading ? "wait" : "pointer", fontSize: 12, fontWeight: 700 }}>
                  {scanLoading ? `TARANIYOR... ${scanResults.length}` : "▶ TARA"}
                </button>
                <span style={{ fontSize: 11, color: T.muted }}>BIST 100 · Güven ≥ %50</span>
              </div>
              {scanResults.length === 0 && !scanLoading && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: T.muted, fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⌬</div>
                  En güçlü AL/SAT sinyallerini bulmak için TARA'ya bas.
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
                {scanResults.map(r => {
                  const c = r.signal === "AL" ? T.green : T.red;
                  return (
                    <div key={r.sym} onClick={() => { setSel(r.sym); setPage("market"); }}
                      style={{ background: T.bg1, border: `1px solid ${c}44`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", animation: "fadeIn .2s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontFamily: T.fontD, fontSize: 16, fontWeight: 700, color: T.blue, letterSpacing: 1 }}>{r.sym}</span>
                        <span style={{ background: `${c}15`, border: `1px solid ${c}66`, color: c, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{r.signal} %{r.confidence}</span>
                      </div>
                      <div style={{ fontSize: 10, color: T.muted, marginBottom: 5 }}>{r.mod}</div>
                      {r.paLabel && r.paStrength >= 80 && <div style={{ fontSize: 10, color: T.green, marginBottom: 4, fontWeight: 700 }}>⚡ {r.paLabel}</div>}
                      <div style={{ display: "flex", gap: 8, fontSize: 11, flexWrap: "wrap" }}>
                        <span style={{ color: T.text }}>{r.price?.toFixed(2)}₺</span>
                        {r.stopLoss && <span style={{ color: T.red }}>S: {r.stopLoss}</span>}
                        {r.target1 && <span style={{ color: T.green }}>H: {r.target1}</span>}
                        {r.durationLabel && <span style={{ color: T.yellow, fontWeight: 700 }}>⏱ {r.durationLabel}</span>}
                        {r.adx > 0 && <span style={{ color: T.muted }}>ADX:{r.adx.toFixed(0)}</span>}
                        {r.dipScore && <span style={{ color: T.orange }}>DİP {r.dipScore}/7</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SİNYALLER */}
          {page === "signals" && (() => {
            // Sadece bugünkü sinyal değişimleri
            const todayKey = new Date().toISOString().slice(0,10);
            const todaySigs = sigHistory.filter(s => !s.dateKey || s.dateKey === todayKey);
            return (
            <div className="mob-pad" style={{ padding: "20px", maxWidth: 1060, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 700, color: T.blue }}>📶 BUGÜNKÜ SİNYALLER</span>
                <span style={{ fontSize: 11, color: T.muted }}>{todaySigs.length}</span>
                {sigHistory.length > 0 && (
                  <button className="btn" onClick={() => { setSigHistory([]); ls.save(LS_SIGHIST, []); }}
                    style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 5, padding: "3px 10px", cursor: "pointer", fontSize: 10, marginLeft: "auto" }}>TEMİZLE</button>
                )}
              </div>
              {todaySigs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", color: T.muted, fontSize: 13 }}>Bugün henüz sinyal değişimi yok.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {todaySigs.map((s, i) => (
                    <div key={i} onClick={() => { setSel(s.symbol); setPage("market"); }}
                      style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: T.bg1, borderRadius: 8, cursor: "pointer", border: `1px solid ${T.border}`, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: T.blue, fontSize: 13, minWidth: 60 }}>{s.symbol}</span>
                      <span style={{ fontSize: 12, color: s.from === "AL" ? T.green : s.from === "SAT" ? T.red : T.muted }}>{s.from}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>→</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: s.to === "AL" ? T.green : s.to === "SAT" ? T.red : T.muted }}>{s.to}</span>
                      <span style={{ fontSize: 12, color: T.blue }}>{s.price}₺</span>
                      <span style={{ fontSize: 10, color: T.muted, border: `1px solid ${T.border}`, padding: "1px 6px", borderRadius: 8 }}>%{s.confidence}</span>
                      <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{s.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })()}

          {/* UYARILAR */}
          {page === "alerts" && (
            <div className="mob-pad" style={{ padding: "20px", maxWidth: 1060, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 700, color: T.orange }}>◎ MAİL UYARILARI</span>
              </div>
              {alertLog.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px", color: T.muted, fontSize: 13 }}>
                  Henüz mail gönderilmedi.<br/>
                  <span style={{ fontSize: 11, marginTop: 8, display: "block" }}>🔔 Yukarıdan e-posta kaydet.</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {alertLog.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", background: T.bg1, borderRadius: 8, border: `1px solid ${a.sent ? T.green+"33" : T.red+"33"}`, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: T.blue, fontSize: 13, minWidth: 60 }}>{a.symbol}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: a.signal === "AL" ? T.green : T.red }}>{a.signal}</span>
                      <span style={{ fontSize: 12, color: T.blue }}>{a.price}₺</span>
                      <span style={{ fontSize: 12, color: a.sent ? T.green : T.red }}>{a.sent ? "✓" : `✗ ${a.error ?? "hata"}`}</span>
                      <span style={{ fontSize: 10, color: T.dim, marginLeft: "auto" }}>{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PİYASA */}
          {page === "market" && (
            <div className="mob-pad" style={{ maxWidth: 1060, margin: "0 auto", padding: "16px 14px" }} onClick={() => setShowDD(false)}>

              {/* ANA PANO — Bugünün en güçlü AL/SAT'ları (TARA çalıştıysa görünür) */}
              {(topAL.length > 0 || topSAT.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(220px,100%),1fr))", gap: 10, marginBottom: 14 }}>
                  {topAL.length > 0 && (
                    <div style={{ background: `linear-gradient(135deg,${T.green}10,${T.bg1})`, border: `1px solid ${T.green}44`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.green, marginBottom: 6, letterSpacing: 0.3 }}>🔥 EN GÜÇLÜ 5 AL FIRSATI</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {topAL.map(r => (
                          <div key={r.sym} onClick={() => setSel(r.sym)} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", padding: "4px 6px", borderRadius: 4, background: T.bg2 }}>
                            <span style={{ fontWeight: 700, color: T.text, fontSize: 12, minWidth: 60 }}>{r.sym}</span>
                            <span style={{ color: T.green, fontSize: 11, fontWeight: 600 }}>%{r.confidence}</span>
                            {r.durationLabel && <span style={{ color: T.yellow, fontSize: 10 }}>⏱ {r.durationLabel}</span>}
                            <span className="tnum" style={{ color: T.muted, fontSize: 11, marginLeft: "auto" }}>{r.price?.toFixed(2)}₺</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topSAT.length > 0 && (
                    <div style={{ background: `linear-gradient(135deg,${T.red}10,${T.bg1})`, border: `1px solid ${T.red}44`, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 6, letterSpacing: 0.3 }}>💀 EN ZAYIF 5 (SAT)</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {topSAT.map(r => (
                          <div key={r.sym} onClick={() => setSel(r.sym)} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", padding: "4px 6px", borderRadius: 4, background: T.bg2 }}>
                            <span style={{ fontWeight: 700, color: T.text, fontSize: 12, minWidth: 60 }}>{r.sym}</span>
                            <span style={{ color: T.red, fontSize: 11, fontWeight: 600 }}>%{r.confidence}</span>
                            {r.durationLabel && <span style={{ color: T.yellow, fontSize: 10 }}>⏱ {r.durationLabel}</span>}
                            <span className="tnum" style={{ color: T.muted, fontSize: 11, marginLeft: "auto" }}>{r.price?.toFixed(2)}₺</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {topAL.length === 0 && topSAT.length === 0 && (
                <div onClick={() => setPage("scanner")} style={{ background: T.bg1, border: `1px dashed ${T.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: T.muted, textAlign: "center", cursor: "pointer" }}>
                  💡 Bugünün en güçlü fırsatlarını görmek için <span style={{ color: T.green, fontWeight: 700 }}>🔍 TARA</span> sekmesine git, "▶ TARA" butonuna bas
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 14, alignItems: "start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <h1 className="mob-h1" style={{ margin: 0, fontFamily: T.fontD, fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>{sel}</h1>
                    <button className="btn" onClick={() => toggleFav(sel)}
                      style={{ background: isFav ? `${T.yellow}15` : T.bg2, border: `1px solid ${isFav ? T.yellow : T.border}`, color: isFav ? T.yellow : T.dim, borderRadius: 5, padding: "3px 8px", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>
                      {isFav ? "★" : "☆"}
                    </button>
                    <span style={{ fontSize: 10, color: T.muted, border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 4 }}>{stock?.name}</span>
                  </div>
                  {live ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span className="mob-px" style={{ fontFamily: T.fontD, fontSize: 32, fontWeight: 700, color: isUp ? T.green : T.red }}>{live.price.toFixed(2)}<span style={{ fontSize: 14, color: T.muted, marginLeft: 4 }}>₺</span></span>
                      <span style={{ fontSize: 13, color: isUp ? T.green : T.red, fontWeight: 600 }}>{isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%</span>
                    </div>
                  ) : <div style={{ fontSize: 13, color: T.dim, animation: "pulse 1.5s infinite" }}>Yahoo Finance bağlanıyor...</div>}
                </div>

                <div style={{ position: "relative", minWidth: 200 }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ color: T.muted, fontSize: 13 }}>⌕</span>
                    <input value={search} onChange={e => { setSearch(e.target.value); setShowDD(true); }} onFocus={() => setShowDD(true)}
                      placeholder="Hisse ara..."
                      style={{ background: "transparent", border: "none", color: T.text, fontSize: 12, fontFamily: T.font, outline: "none", width: "100%" }} />
                  </div>
                  {showDD && filtered.length > 0 && filtered.length < 60 && (
                    <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: T.bg1, border: `1px solid ${T.border2}`, borderRadius: 8, maxHeight: 240, overflowY: "auto", zIndex: 200, boxShadow: "0 8px 30px rgba(0,0,0,.8)" }}>
                      {filtered.slice(0, 50).map(s => {
                        const t = allStocks[s.symbol];
                        return (
                          <div key={s.symbol} onClick={() => { setSel(s.symbol); setSearch(""); setShowDD(false); }}
                            style={{ padding: "8px 12px", cursor: "pointer", display: "flex", gap: 8, alignItems: "center", borderBottom: `1px solid ${T.border}`, background: sel === s.symbol ? `${T.green}0a` : "transparent" }}>
                            <span style={{ color: T.yellow, fontSize: 10, minWidth: 12 }}>{favs.includes(s.symbol) ? "★" : ""}</span>
                            <span style={{ color: T.blue, fontWeight: 700, fontSize: 12, minWidth: 55, letterSpacing: 1 }}>{s.symbol}</span>
                            <span style={{ color: T.muted, fontSize: 11, flex: 1 }}>{s.name}</span>
                            {t && <span style={{ color: t.rate >= 0 ? T.green : T.red, fontSize: 11 }}>{t.price.toFixed(2)}₺</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div style={{ background: `${T.red}0a`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: T.red, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>⚠ {error}</span>
                  <button className="btn" onClick={fetchAll} style={{ background: T.red, border: "none", color: "#000", borderRadius: 4, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>TEKRAR</button>
                </div>
              )}

              {chartData.length < 20 && (
                <div style={{ background: T.bg2, border: `1px solid ${T.yellow}44`, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 9, height: 9, border: `1.5px solid ${T.dim}`, borderTop: `1.5px solid ${T.yellow}`, borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.yellow }}>{loading ? `Yahoo'dan ${sel} çekiliyor (7 proxy paralel)...` : "Veri bekleniyor — biraz bekle veya başka hisse seç"}</span>
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>İlk yükleme 5-15 sn — proxy'ler yarışta. Çalıştıktan sonra cache'lenir, anlık olur.</div>
                </div>
              )}

              {/* TRADE ÖNERİ */}
              {result && (() => {
                const ep       = live?.price ?? result.last.close;
                const riskPct  = result.stopLoss ? +((ep - result.stopLoss) / ep * 100).toFixed(2) : null;
                const gain1Pct = result.target1  ? +((result.target1 - ep)  / ep * 100).toFixed(2) : null;
                const gain2Pct = result.target2  ? +((result.target2 - ep)  / ep * 100).toFixed(2) : null;
                let tradeText = "", tradeDetail = "";
                const pf = result.profile;
                const v = pf ? `Vade: ${pf.dur} · ${pf.why}` : "Standart swing";
                if      (result.final === "AL" && result.trendMod === "YUKARI") { tradeText = "TREND YÖNÜNDE AL"; tradeDetail = `MA200 üstünde, ADX ${result.adx?.toFixed(0)} · ${v}`; }
                else if (result.final === "AL" && result.dipSignal)              { tradeText = "DİP DÖNÜŞ AL";     tradeDetail = `${result.dipSignal.score}/7 şart · ${v}`; }
                else if (result.final === "AL")                                  { tradeText = "TEMKİNLİ AL";      tradeDetail = `ADX ${result.adx?.toFixed(0)} (zayıf trend) · Küçük giriş · ${v}`; }
                else if (result.final === "SAT" && result.trendMod === "ASAGI") { tradeText = "ÇIKIŞ / SAT";      tradeDetail = `MA200 altında · Pozisyon kapat · 5-10 gün baskı sürebilir`; }
                else if (result.final === "SAT")                                 { tradeText = "SAT";              tradeDetail = `Satış baskısı · 3-7 gün geri çekilme bekleniyor`; }
                else { tradeText = "BEKLE"; tradeDetail = result.waitReasons?.length ? "Sebep: " + result.waitReasons.join(" · ") : "İndikatörler net sinyal vermiyor (net puan: " + result.net + ")"; }
                return (
                  <div style={{ marginBottom: 14, animation: "fadeIn .3s" }}>
                    <div style={{ background: `linear-gradient(135deg,${T.bg1},${T.bg2})`, border: `1px solid ${fc}44`, borderRadius: 12, padding: "16px", marginBottom: 10, position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${fc},transparent)` }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: result.stopLoss ? 14 : 0 }}>
                        <div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ background: `${trendColor}15`, border: `1px solid ${trendColor}44`, color: trendColor, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>{result.mod}</span>
                            {result.trendStr != null && <span style={{ background: T.bg2, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 20, padding: "3px 10px", fontSize: 10 }}>TREND %{result.trendStr} {result.trendBias === "YUKARI" ? "↑" : result.trendBias === "ASAGI" ? "↓" : "→"}</span>}
                            {result.adx > 0 && <span style={{ background: T.bg2, border: `1px solid ${T.border}`, color: result.trendStrong ? T.green : T.muted, borderRadius: 20, padding: "3px 10px", fontSize: 10 }}>ADX {result.adx.toFixed(0)}</span>}
                            {result.profile && <span style={{ background: `${T.yellow}15`, border: `1px solid ${T.yellow}66`, color: T.yellow, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>⏱ {result.profile.dur}</span>}
                            {result.htfNote && <span style={{ background: T.bg2, border: `1px solid ${T.border}`, color: result.htfNote.includes("✓") ? T.green : T.red, borderRadius: 20, padding: "3px 10px", fontSize: 10 }}>{result.htfNote}</span>}
                          </div>
                          <div style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 700, color: fc, letterSpacing: 2, marginBottom: 6 }}>{tradeText}</div>
                          <div style={{ fontSize: 11, color: T.muted, maxWidth: 380, lineHeight: 1.5 }}>{tradeDetail}</div>
                        </div>
                        <div style={{ background: T.bg, border: `1px solid ${fc}33`, borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.muted, letterSpacing: 2, marginBottom: 3 }}>GÜVEN</div>
                          <div style={{ fontFamily: T.fontD, fontSize: 30, fontWeight: 700, color: fc, lineHeight: 1 }}>{result.confidence}</div>
                          <div style={{ fontSize: 10, color: T.muted }}>%</div>
                        </div>
                      </div>
                      {result.stopLoss && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(80px,1fr))", gap: 6 }}>
                          {[
                            { label: "→ GİRİŞ",       sub: "Alım fiyatı",   price: ep.toFixed(2)+"₺",   pct: null,                                                color: T.blue },
                            { label: "⛔ ZARAR DUR",  sub: "Stop seviyesi", price: result.stopLoss+"₺", pct: riskPct  ? `-${Math.abs(riskPct)}%` : null,           color: T.red },
                            { label: "🎯 1. HEDEF",   sub: "İlk satış",     price: result.target1+"₺",  pct: gain1Pct ? `+${gain1Pct}%` : null,                   color: T.green },
                            { label: "🎯 2. HEDEF",   sub: "Uzun tut",      price: result.target2+"₺",  pct: gain2Pct ? `+${gain2Pct}%` : null,                   color: T.green },
                            { label: "📊 OYNAKLIK",   sub: "ATR · "+result.riskReward, price: result.atr+"₺",  pct: null,                                          color: T.yellow },
                          ].map(s => (
                            <div key={s.label} style={{ background: `${s.color}10`, border: `1px solid ${s.color}40`, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: s.color, marginBottom: 4, letterSpacing: 0.2, fontWeight: 600 }}>{s.label}</div>
                              <div className="tnum" style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 2 }}>{s.price}</div>
                              {s.pct && <div className="tnum" style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.pct}</div>}
                              {s.sub && <div style={{ fontSize: 9, color: T.muted, marginTop: 3, letterSpacing: 0.1 }}>{s.sub}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Smart Entry Hint + RS + Backtest */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      {result.entryHint && (
                        <div style={{ flex: "1 1 200px", background: result.entryHint === "ŞİMDİ" ? `${T.green}10` : `${T.yellow}10`, border: `1px solid ${result.entryHint === "ŞİMDİ" ? T.green : T.yellow}40`, borderRadius: 8, padding: "8px 12px" }}>
                          <div style={{ fontSize: 10, color: result.entryHint === "ŞİMDİ" ? T.green : T.yellow, fontWeight: 700, marginBottom: 3 }}>⏱ GİRİŞ ZAMANI: {result.entryHint}</div>
                          <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.4 }}>{result.entryDetail}</div>
                        </div>
                      )}
                      {rs != null && (
                        <div style={{ flex: "0 1 auto", background: rs > 0 ? `${T.green}10` : `${T.red}10`, border: `1px solid ${rs > 0 ? T.green : T.red}40`, borderRadius: 8, padding: "8px 12px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.muted, marginBottom: 2 }}>BIST 100'E GÖRE</div>
                          <div className="tnum" style={{ fontSize: 13, fontWeight: 700, color: rs > 0 ? T.green : T.red }}>{rs > 0 ? "+" : ""}{rs}%</div>
                          <div style={{ fontSize: 9, color: T.muted }}>{rs > 0 ? "daha güçlü" : "daha zayıf"}</div>
                        </div>
                      )}
                    </div>

                    {/* AI ANALİZ butonu + sonuç + Backtest */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                      <button className="btn" onClick={() => runAI(sel, stock?.name || sel, result, false, live?.price)} disabled={aiLoad}
                        style={{ background: `${T.purple}20`, border: `1px solid ${T.purple}`, color: T.purple, borderRadius: 6, padding: "8px 14px", cursor: aiLoad ? "wait" : "pointer", fontSize: 12, fontWeight: 700 }}>
                        {aiLoad ? "🤖 ANALİZ..." : "🤖 AI ANALİZ"}
                      </button>
                      <button className="btn" onClick={runBacktest} disabled={btLoad}
                        style={{ background: `${T.blue}20`, border: `1px solid ${T.blue}`, color: T.blue, borderRadius: 6, padding: "8px 14px", cursor: btLoad ? "wait" : "pointer", fontSize: 12, fontWeight: 700 }}>
                        {btLoad ? "🔬 ÇALIŞTIRILIYOR..." : "🔬 BACKTEST (1 yıl)"}
                      </button>
                      {!aiKey && <span style={{ fontSize: 10, color: T.muted }}>Önce 🤖 → API key</span>}
                    </div>
                    {btResult && (
                      <div style={{ background: `${T.blue}08`, border: `1px solid ${T.blue}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 6 }}>🔬 1 Yıllık Backtest Sonucu</div>
                        {btResult.error ? <div style={{ fontSize: 11, color: T.red }}>{btResult.error}</div> : (
                          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11 }}>
                            <span><b>{btResult.trades}</b> trade</span>
                            <span style={{ color: btResult.winrate >= 50 ? T.green : T.red }}>Kazanma: <b>%{btResult.winrate}</b></span>
                            <span style={{ color: btResult.avgPnl >= 0 ? T.green : T.red }}>Ort. PnL: <b>{btResult.avgPnl > 0 ? "+" : ""}%{btResult.avgPnl}</b></span>
                            <span style={{ color: T.muted }}>Skor: <b>{btResult.score}</b></span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TRAILING STOP & POZİSYON HESAPLAYICI — sadece AL sinyalinde */}
                    {result.final === "AL" && result.trailingStop && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(260px,100%),1fr))", gap: 10, marginBottom: 10 }}>
                        <div style={{ background: `${T.green}08`, border: `1px solid ${T.green}44`, borderRadius: 10, padding: "10px 14px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.green, marginBottom: 8 }}>📈 KÂR KORUYUCU TRAILING STOP</div>
                          {[result.trailingStop.seviye1, result.trailingStop.seviye2, result.trailingStop.seviye3].map((s, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "4px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                              <span className="tnum" style={{ color: T.muted }}>Tetik: <b style={{ color: T.text }}>{s.tetik}₺</b></span>
                              <span className="tnum" style={{ color: T.green }}>Stop → <b>{s.stop}₺</b></span>
                            </div>
                          ))}
                          <div style={{ fontSize: 9, color: T.muted, marginTop: 6, lineHeight: 1.4 }}>Fiyat tetik seviyesine ulaştığında manuel olarak stop'unu yukarı çek — kâr kilitlenir, yön döndüğünde geri vermezsin.</div>
                        </div>
                        {(() => {
                          const stopDistPct = result.stopPct;
                          const riskTL = portfolio * (riskPct / 100);
                          const stopDistTL = ep * stopDistPct;
                          const lots = stopDistTL > 0 ? Math.floor(riskTL / stopDistTL) : 0;
                          const posTL = lots * ep;
                          return (
                            <div style={{ background: `${T.blue}08`, border: `1px solid ${T.blue}44`, borderRadius: 10, padding: "10px 14px" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: T.blue, marginBottom: 8 }}>💼 POZİSYON BÜYÜKLÜĞÜ</div>
                              <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                                <input type="number" value={portfolio} onChange={e => setPortfolio(+e.target.value || 0)}
                                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 5, padding: "4px 8px", fontSize: 11, width: 110 }} placeholder="Portföy ₺" />
                                <input type="number" value={riskPct} onChange={e => setRiskPct(+e.target.value || 0)} step="0.5"
                                  style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text, borderRadius: 5, padding: "4px 8px", fontSize: 11, width: 70 }} placeholder="Risk %" />
                              </div>
                              <div className="tnum" style={{ fontSize: 13, color: T.text, marginBottom: 4 }}>
                                <b style={{ color: T.green, fontSize: 18 }}>{lots}</b> lot ≈ <b>{posTL.toFixed(0)}₺</b>
                              </div>
                              <div className="tnum" style={{ fontSize: 10, color: T.muted }}>Maks. risk: {riskTL.toFixed(0)}₺ · Stop mesafesi: %{(stopDistPct*100).toFixed(1)}</div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {aiErr && <div style={{ background: `${T.red}10`, border: `1px solid ${T.red}44`, borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 11, color: T.red }}>⚠ {aiErr}</div>}
                    {aiResp && aiResp.symbol === sel && (
                      <div style={{ background: `${T.purple}08`, border: `1px solid ${T.purple}44`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, animation: "fadeIn .3s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: T.fontD, fontSize: 13, fontWeight: 700, color: T.purple }}>🤖 CLAUDE — AI ANALİZ</span>
                          <span style={{ fontSize: 10, color: T.muted, marginLeft: "auto" }}>{aiResp.time}</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{aiResp.text}</div>
                      </div>
                    )}

                    {result.dipSignal && (
                      <div style={{ background: `${result.dipSignal.color}08`, border: `1px solid ${result.dipSignal.color}44`, borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: T.fontD, fontSize: 14, fontWeight: 700, color: result.dipSignal.color, letterSpacing: 1 }}>{result.dipSignal.label}</span>
                          <span style={{ fontSize: 10, color: T.muted, border: `1px solid ${T.border}`, padding: "1px 6px", borderRadius: 10 }}>{result.dipSignal.score}/7</span>
                        </div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {Object.entries(result.dipSignal.checks).map(([k, v]) => {
                            const L = { rsiDip: "RSI Dip", macdTurning: "MACD↑", bbBottom: "BB Alt", highVolume: "Hacim 2x", stochDip: "Stoch<20", obvTurning: "OBV↑", stFlip: "ST Yön" };
                            return <span key={k} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 10, background: v ? `${T.green}15` : T.bg2, color: v ? T.green : T.dim, border: `1px solid ${v ? T.green+"44" : T.border}`, fontWeight: v ? 700 : 400 }}>{v ? "✓" : "✗"} {L[k]}</span>;
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <SigCard name="MA TREND"  sig={result.signals.MA} />
                      <SigCard name="MACD"      sig={result.signals.MACD} />
                      <SigCard name="RSI 14"    sig={result.signals.RSI} />
                      <SigCard name="BOLLINGER" sig={result.signals.BB} />
                      <SigCard name="STOCH"     sig={result.signals.SRSI} />
                      <SigCard name="HACİM"     sig={result.signals.VOL} />
                      <SigCard name="ADX"       sig={result.signals.ADX} />
                      <SigCard name="SUPERTREND" sig={result.signals.STR} />
                      <SigCard name="PRICE ACT." sig={result.signals.PA} />
                      <SigCard name="MOMENTUM"   sig={result.signals.MOM} />
                    </div>
                  </div>
                );
              })()}

              {/* GRAFİK */}
              {vis.length > 1 && (
                <div style={{ background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 3, marginBottom: 11, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
                    {TABS.map(t => (
                      <button key={t.id} className="btn" onClick={() => setTab(t.id)}
                        style={{ background: tab===t.id ? `${T.green}12` : "transparent", border: tab===t.id ? `1px solid ${T.green}44` : "1px solid transparent", color: tab===t.id ? T.green : T.muted, borderRadius: 5, padding: "5px 14px", cursor: "pointer", fontSize: 11, letterSpacing: 2, fontWeight: tab===t.id ? 700 : 400 }}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {tab === "fiyat" && (() => {
                    // Önce intraday (15m), o yetersizse günlük (1y) histCache, o da yoksa boş chart
                    const dailyEnriched = histCache[sel]?.length >= 20 ? enrichData(histCache[sel]) : [];
                    const display = chartData.length >= 30 ? chartData : dailyEnriched;
                    if (display.length < 5) {
                      return <div style={{ height: 420, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: T.muted, background: T.bg, borderRadius: 8 }}>
                        <div style={{ width: 24, height: 24, border: `2px solid ${T.dim}`, borderTop: `2px solid ${T.yellow}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        <span style={{ fontSize: 12 }}>{sel} için veri yükleniyor...</span>
                        <span style={{ fontSize: 10, color: T.dim }}>Yahoo + İş Yatırım fallback denenmektedir</span>
                      </div>;
                    }
                    return <LWChart data={display} height={420} />;
                  })()}

                  {tab === "rsi" && <>
                    <ResponsiveContainer width="100%" height={220}>
                      <ComposedChart data={vis} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="1 5" stroke={T.dim} opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} ticks={xT} />
                        <YAxis domain={[0,100]} tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} width={28} ticks={[20,30,50,70,80]} />
                        <Tooltip content={<ChartTip />} />
                        <ReferenceLine y={70} stroke={T.red+"55"} strokeDasharray="4 2" label={{ value:"70", fill:T.red, fontSize:11, position:"right" }} />
                        <ReferenceLine y={50} stroke={T.muted+"44"} strokeDasharray="3 4" />
                        <ReferenceLine y={30} stroke={T.green+"55"} strokeDasharray="4 2" label={{ value:"30", fill:T.green, fontSize:11, position:"right" }} />
                        <Line dataKey="rsiSignal" stroke={T.yellow+"88"} strokeWidth={1.5} dot={false} strokeDasharray="3 2" name="Sinyal" />
                        <Area dataKey="rsi" stroke={T.purple} strokeWidth={2.2} fill={T.purple+"10"} name="RSI-14" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </>}

                  {tab === "macd" && <>
                    <ResponsiveContainer width="100%" height={220}>
                      <ComposedChart data={vis} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="1 5" stroke={T.dim} opacity={0.3} />
                        <XAxis dataKey="date" tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} ticks={xT} />
                        <YAxis tick={{ fill: T.muted, fontSize: 10, fontFamily: T.font }} width={50} tickFormatter={v => v.toFixed(2)} />
                        <Tooltip content={<ChartTip />} />
                        <ReferenceLine y={0} stroke={T.border2} strokeWidth={1.5} />
                        <Bar dataKey="macdHist" name="Hist" shape={(props) => {
                          const { x, y, width, height, value } = props;
                          const h = Math.abs(height), yy = value >= 0 ? y : y + height;
                          return <rect x={x} y={yy} width={width} height={Math.max(h,1)} fill={value >= 0 ? T.green : T.red} rx={1} />;
                        }} />
                        <Line dataKey="macdLine" name="MACD" stroke={T.blue} strokeWidth={2} dot={false} />
                        <Line dataKey="macdSig" name="Sinyal" stroke={T.orange} strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </>}
                </div>
              )}

              {live && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  <StatBox label="CANLI"   value={live.price.toFixed(2)+"₺"} color={isUp?T.green:T.red} />
                  <StatBox label="DEĞİŞİM" value={(isUp?"▲":"▼")+Math.abs(pct).toFixed(2)+"%"} color={isUp?T.green:T.red} />
                  <StatBox label="RSI"     value={result?.last?.rsi?.toFixed(1)??"—"} color={T.purple} />
                  <StatBox label="ADX"     value={result?.adx?.toFixed(0)??"—"} color={result?.trendStrong?T.green:T.muted} />
                  <StatBox label="MA200"   value={result?.last?.ma200?.toFixed(2)??"—"} color={T.orange} />
                  <StatBox label="ATR"     value={result?.atr?result.atr+"₺":"—"} color={T.yellow} />
                  <StatBox label="VWAP"    value={result?.last?.vwap?.toFixed(2)??"—"} color={T.purple} />
                  <StatBox label="ST"      value={result?.last?.stDir===1?"↑":result?.last?.stDir===-1?"↓":"—"} color={result?.last?.stDir===1?T.green:T.red} />
                  <StatBox label="MFI"     value={result?.last?.mfi?.toFixed(0)??"—"} color={result?.last?.mfi>80?T.red:result?.last?.mfi<20?T.green:T.muted} />
                  <StatBox label="TSI"     value={result?.last?.tsi?.toFixed(1)??"—"} color={result?.last?.tsi>0?T.green:T.red} />
                </div>
              )}

              <div style={{ textAlign: "center", paddingBottom: 24, paddingTop: 16, borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
                <div style={{ fontFamily: T.fontD, fontSize: 16, fontWeight: 700, letterSpacing: -0.4, marginBottom: 6 }}>
                  <span style={{ color: T.red }}>Fey</span><span style={{ color: T.text }}>Bot</span>
                </div>
                <div style={{ fontSize: 10, color: T.dim, letterSpacing: 0.2 }}>
                  Bu uygulama yatırım tavsiyesi değildir.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBİL ALT NAV */}
      <div className="mob-bottom">
        <NavBtn id="market"    page={page} setPage={setPage} icon="◈" label="BIST" />
        <NavBtn id="crypto"    page={page} setPage={setPage} icon="₿" label="KRİPTO" />
        <NavBtn id="favorites" page={page} setPage={setPage} icon="★" label="FAVORİ" badge={favs.length} />
        <NavBtn id="scanner"   page={page} setPage={setPage} icon="⌬" label="TARA" />
        <NavBtn id="signals"   page={page} setPage={setPage} icon="◉" label="SİNYAL" badge={sigHistory.length} />
      </div>
    </div>
  );
}


