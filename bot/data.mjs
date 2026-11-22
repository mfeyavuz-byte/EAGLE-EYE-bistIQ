// Veri katmanı — Yahoo Finance (Node'dan doğrudan, proxy yok).
// SİNYAL: günlük mumlar (çok-günlük pozisyon için doğru tf; MA50/MA200/ADX anlamlı).
// ÜST TREND: haftalık mumlar. (15dk artık kullanılmıyor — çok-günlük tutuşta gürültüydü.)
const UA={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'};

async function yfetch(sym, interval, range, timeout=8000){
  for(const host of ['query1','query2']){                 // query1 başarısızsa query2'ye düş (güvenilirlik)
    const u=`https://${host}.finance.yahoo.com/v8/finance/chart/${sym}.IS?interval=${interval}&range=${range}&includePrePost=false`;
    const ctrl=new AbortController(), tid=setTimeout(()=>ctrl.abort(), timeout);
    try{
      const r=await fetch(u,{headers:UA,signal:ctrl.signal});
      if(!r.ok)continue;
      const j=await r.json();
      const n=j?.chart?.result?.[0];
      if(!n?.timestamp?.length)continue;
      const q=n.indicators.quote[0], rows=[];
      n.timestamp.forEach((S,D)=>{
        if(q.close[D]==null)return;
        rows.push({ts:S*1e3,date:'',close:+(+q.close[D]).toFixed(2),open:+(+(q.open[D]??q.close[D])).toFixed(2),high:+(+(q.high[D]??q.close[D])).toFixed(2),low:+(+(q.low[D]??q.close[D])).toFixed(2),volume:q.volume[D]??0});
      });
      return rows;
    }catch(e){ continue; }
    finally{ clearTimeout(tid); }               // sayaç gövde okunana kadar açık: gövdede takılma = sonsuz bekleme olmasın
  }
  return [];
}
export const fetch15m = sym => yfetch(sym,'15m','5d');     // (kullanımdan kalktı, dursun)
export const fetchDaily = sym => yfetch(sym,'1d','2y');
export const fetchHourly = sym => yfetch(sym,'60m','2y',20000);   // portföy simülatörü: gerçek gün içi yol (günde ~10 mum)    // sinyal: ~500 günlük mum → MA200 geçerli
// ÜST TREND: haftalık. Yahoo haftalık serinin SONUNA son günlük mumu AYRI bir "hafta" olarak ekliyor (2026-11-22 ölçümü:
// 195/195 hissede; önceki haftalık mum o günü zaten içeriyor). Motorun haftalık doji/üst-trend hesabı bu 1 günlük sahte mumu
// hafta sanıyordu (portföy simülatörünün canlı-tekrar doğrulaması yakaladı: AGESA/MAGEN SAT sinyali kayboluyordu).
// → aynı İstanbul haftasına düşen ardışık mumlar tek muma indirilir (içeriyorsa atılır, içermiyorsa birleştirilir).
export const fetchWeekly = async sym => dedupWeeks(await yfetch(sym,'1wk','5y'));
export function dedupWeeks(rows) {
  const out = [];
  for (const r of rows) {
    const p = out[out.length - 1];
    if (!p || weekKey(p.ts) !== weekKey(r.ts)) { out.push({ ...r }); continue; }
    if (p.close === r.close && p.high >= r.high && p.low <= r.low) continue;          // saf kopya (gözlenen durum)
    p.high = Math.max(p.high, r.high); p.low = Math.min(p.low, r.low); p.close = r.close; p.volume = (p.volume || 0) + (r.volume || 0);
  }
  return out;
}
// Endeks (XU100 vb.) son kapanışı — portföyü endeksle kıyaslamak için
export async function fetchIndexClose(sym='XU100'){
  const rows = await yfetch(sym,'1d','5d');
  return rows.length ? rows[rows.length-1].close : null;
}

// GEÇMİŞ TEKRARI İÇİN (backtest + portföy simülatörü): İstanbul (UTC+3, 2016'dan beri yaz saati yok) takvim haftası anahtarı
// = o haftanın Pazartesi tarihi. weeklyAsOf: i. gün itibarıyla haftalık seri = TAMAMLANMIŞ haftalar (Yahoo) + bu haftanın i. güne
// kadarki günlüklerinden kısmi mum (canlıdaki gibi; gelecek sızıntısı yok — Yahoo haftalık mumuyla birebir doğrulandı).
export const istDay = ts => new Date(ts + 3 * 3600e3).toISOString().slice(0, 10);
export const weekKey = ts => { const d = new Date(ts + 3 * 3600e3), wd = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd)).toISOString().slice(0, 10); };
export function weeklyAsOf(wk, all, i) {
  const wkI = weekKey(all[i].ts), out = wk.filter(w => weekKey(w.ts) < wkI), part = [];
  for (let j = i; j >= 0 && weekKey(all[j].ts) === wkI; j--) part.unshift(all[j]);
  if (part.length) out.push({ ts: part[0].ts, date: '', open: part[0].open, high: Math.max(...part.map(b => b.high)), low: Math.min(...part.map(b => b.low)), close: part[part.length - 1].close, volume: part.reduce((a, b) => a + (b.volume || 0), 0) });
  return out;
}
