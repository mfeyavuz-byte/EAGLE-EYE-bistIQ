// 1-2 AY TUTUŞ — pozisyon taraması (Stage-2 yerleşik yükseliş trendi, günlük mum).
// TAMAMEN AYRI / SADECE BİLGİ: botun sinyal üretimine, runPaper'a, AI TRADER'a HİÇ dokunmaz.
// Sadece bir liste döndürür; main() bunu ayrı bir Telegram mesajı olarak (günde 1) atar.
import { enrichData } from "./engine.mjs";
import { fetchDaily } from "./data.mjs";

async function scanOnePos(sym, idxRet120) {
  const d = await fetchDaily(sym);
  if (d.length < 240) return null;                                  // MA200 eğimi + marj
  const ed = enrichData(d);
  const last = ed[ed.length - 1], prev = ed[ed.length - 22];        // ~1 ay önce (MA200 eğimi + OBV birikimi)
  if (!last || !prev) return null;
  const avgVol = d.slice(-20).reduce((a, b) => a + (b.volume || 0), 0) / 20;
  if (avgVol * last.close < 5e6) return null;                        // likidite

  // --- Stage-2 kapıları (yerleşik yükseliş trendi) ---
  if (!(last.ma50 && last.ma200 && last.ma50 > last.ma200)) return null;      // trend stack: MA50 > MA200
  if (!(last.close > last.ma50)) return null;                                 // fiyat MA50 üstünde
  if (!(prev.ma200 && last.ma200 > prev.ma200)) return null;                  // MA200 yükseliyor (uzun trend yukarı)
  if (!(last.rsi >= 50 && last.rsi <= 72)) return null;                       // sağlıklı momentum (aşırı-alım değil)
  if ((last.adx || 0) < 20) return null;                                      // yerleşik trend
  const c0 = d[d.length - 121]?.close;                                        // 6 ay (120g) göreli güç
  const ret120 = c0 ? (last.close - c0) / c0 * 100 : 0;
  const rs = +(ret120 - idxRet120).toFixed(1);
  if (rs <= 0) return null;                                                   // endeksten güçlü olmalı

  const obvUp = last.obv != null && prev.obv != null && last.obv > prev.obv;  // hacim birikimi
  const ext = +((last.close / last.ma50 - 1) * 100).toFixed(1);               // MA50'den uzaklık (aşırı uzamayı cezalandır)
  const score = +(rs * 0.6 + (last.adx || 0) * 0.4 + (obvUp ? 10 : 0) - Math.max(0, ext - 15) * 0.5).toFixed(1);
  const stop = +(last.ma50 * 0.97).toFixed(2);                                // tez bozulma referansı: MA50 altı kapanış
  return { sym, price: last.close, rs, adx: Math.round(last.adx || 0), rsi: Math.round(last.rsi), obvUp, ext, score, stop };
}

export async function positionScan(syms, idxDaily, conc = 8) {
  const ic = idxDaily.map(r => r.close);
  const idxRet120 = ic.length >= 121 ? (ic[ic.length - 1] - ic[ic.length - 121]) / ic[ic.length - 121] * 100 : 0;
  const out = [];
  for (let i = 0; i < syms.length; i += conc) {
    const b = await Promise.all(syms.slice(i, i + conc).map(s => scanOnePos(s, idxRet120).catch(() => null)));
    b.forEach(x => x && out.push(x));
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}
