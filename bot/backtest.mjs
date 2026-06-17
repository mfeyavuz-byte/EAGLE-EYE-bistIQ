// Hafif backtest: geçmiş günlük veride AL sinyali üret → 10 gün sonraki getiriyi ölç.
import { enrichData, getHigherTrend, getSignals } from './engine.mjs';
import { fetchDaily } from './data.mjs';
import syms from './symbols.json' with {type:'json'};
const MIN_CONF=65,MIN_ADX=20,FWD=10;
const sample=syms.filter((_,i)=>i%5===0).slice(0,40);   // ~40 sembol
let trades=[];
for(let b=0;b<sample.length;b+=8){
  await Promise.all(sample.slice(b,b+8).map(async sym=>{
    const all=await fetchDaily(sym); if(all.length<260)return;
    for(let i=210;i<all.length-FWD;i+=3){           // her 3 günde bir
      const slice=all.slice(0,i+1); const ed=enrichData(slice); const last=ed[ed.length-1]; if(!last)return;
      const k=getSignals(ed,getHigherTrend(slice),slice);
      if(!k||k.final!=='AL'||k.confidence<MIN_CONF)continue;
      const isDip=!!k.dipSignal;
      if(!isDip&&(k.adx||0)<MIN_ADX)continue;
      if(!isDip&&k.higherTrend==='ASAGI')continue;
      const fwd=(all[i+FWD].close-last.close)/last.close*100;
      trades.push({conf:k.confidence,dip:isDip,fwd});
    }
  }));
}
const wr=a=>a.length?(a.filter(t=>t.fwd>0).length/a.length*100).toFixed(0):'-';
const av=a=>a.length?(a.reduce((s,t)=>s+t.fwd,0)/a.length).toFixed(2):'-';
console.log(`Toplam AL sinyali: ${trades.length} (${FWD} gün ileri getiri)`);
console.log(`GENEL: isabet %${wr(trades)} · ort. getiri %${av(trades)}`);
for(const[lo,hi] of [[65,75],[75,85],[85,101]]){
  const g=trades.filter(t=>t.conf>=lo&&t.conf<hi);
  console.log(`  güven ${lo}-${hi-1}: ${g.length} sinyal · isabet %${wr(g)} · ort %${av(g)}`);
}
const dips=trades.filter(t=>t.dip);
console.log(`  DİP dönüşler: ${dips.length} · isabet %${wr(dips)} · ort %${av(dips)}`);
