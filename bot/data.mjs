// Veri katmanı — Yahoo Finance (Node'dan doğrudan, proxy yok).
// 15m mumlar (sinyal) + günlük mumlar (üst trend). MCP daily seyrek olduğu için Yahoo kullanılır.
const UA={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'};

async function yfetch(sym, interval, range, timeout=8000){
  const u=`https://query1.finance.yahoo.com/v8/finance/chart/${sym}.IS?interval=${interval}&range=${range}&includePrePost=false`;
  const ctrl=new AbortController(), tid=setTimeout(()=>ctrl.abort(), timeout);
  try{
    const r=await fetch(u,{headers:UA,signal:ctrl.signal});
    clearTimeout(tid);
    if(!r.ok)return [];
    const j=await r.json();
    const n=j?.chart?.result?.[0];
    if(!n?.timestamp?.length)return [];
    const q=n.indicators.quote[0], rows=[];
    n.timestamp.forEach((S,D)=>{
      if(q.close[D]==null)return;
      rows.push({ts:S*1e3,date:'',close:+(+q.close[D]).toFixed(2),open:+(+(q.open[D]??q.close[D])).toFixed(2),high:+(+(q.high[D]??q.close[D])).toFixed(2),low:+(+(q.low[D]??q.close[D])).toFixed(2),volume:q.volume[D]??0});
    });
    return rows;
  }catch(e){ clearTimeout(tid); return []; }
}
export const fetch15m = sym => yfetch(sym,'15m','5d');
export const fetchDaily = sym => yfetch(sym,'1d','1y');
// Endeks (XU100 vb.) son kapanışı — portföyü endeksle kıyaslamak için
export async function fetchIndexClose(sym='XU100'){
  const rows = await yfetch(sym,'1d','5d');
  return rows.length ? rows[rows.length-1].close : null;
}
