// Hafif backtest: geçmiş günlük veride AL sinyali üret → 10 gün sonraki getiriyi ölç.
// 2026-11-22 DÜZELTME — artık CANLI botun (run.mjs scanOne + main) sinyal filtrelerini birebir uygular:
//  • ÜST TREND HAFTALIK mumdan (eskiden günlük dilim "haftalık" diye veriliyordu → üst trend/haftalık doji filtreleri yanlış).
//    Gelecek sızmasın diye: o güne kadar TAMAMLANMIŞ haftalar + içinde bulunulan haftanın o güne kadarki kısmı (canlıdaki gibi).
//  • Eskiden eksik olan canlı filtreler: likidite (≥5M₺/gün), üst-zaman ⚠, hacim kuruması, RSI≥63, endekse göre zayıf (RS).
//  ⇒ Sayılar 2026-06-22 tabanıyla (eski gevşek filtre) KIYASLANAMAZ; yeni taban PROJECT.md'de.
//  (Haber ve MCP katmanı geçmişe dönük üretilemez → dahil değil. scanOne'daki filtre değişirse BURAYI da güncelle.)
import { enrichData, getHigherTrend, getSignals } from './engine.mjs';
import { fetchDaily, fetchWeekly } from './data.mjs';
import syms from './symbols.json' with {type:'json'};
const MIN_CONF=65,MIN_ADX=20,FWD=10;
const sample=syms.filter((_,i)=>i%5===0).slice(0,40);   // ~40 sembol

// İstanbul (UTC+3, 2016'dan beri yaz saati yok) takvim haftası anahtarı = o haftanın Pazartesi tarihi
const weekKey=ts=>{const d=new Date(ts+3*3600e3),wd=(d.getUTCDay()+6)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-wd)).toISOString().slice(0,10);};
// i. gün itibarıyla haftalık seri: tamamlanmış haftalar (Yahoo) + bu haftanın i. güne kadarki günlüklerinden kısmi mum
function weeklyAsOf(wk,all,i){
  const wkI=weekKey(all[i].ts), out=wk.filter(w=>weekKey(w.ts)<wkI), part=[];
  for(let j=i;j>=0&&weekKey(all[j].ts)===wkI;j--)part.unshift(all[j]);
  if(part.length)out.push({ts:part[0].ts,date:'',open:part[0].open,high:Math.max(...part.map(b=>b.high)),low:Math.min(...part.map(b=>b.low)),close:part[part.length-1].close,volume:part.reduce((a,b)=>a+(b.volume||0),0)});
  return out;
}

const istDay=ts=>new Date(ts+3*3600e3).toISOString().slice(0,10);
const idx=await fetchDaily('XU100'), idxAt=new Map(idx.map((x,k)=>[istDay(x.ts),k]));   // endeks barı = aynı İstanbul günü
let trades=[], skipped=0;
for(let b=0;b<sample.length;b+=8){
  await Promise.all(sample.slice(b,b+8).map(async sym=>{
    const [all,wk]=await Promise.all([fetchDaily(sym),fetchWeekly(sym)]); if(all.length<260||wk.length<60){skipped++;return;}
    for(let i=210;i<all.length-FWD;i+=3){           // her 3 günde bir
      const slice=all.slice(0,i+1); const ed=enrichData(slice); const last=ed[ed.length-1]; if(!last)continue;
      const wks=weeklyAsOf(wk,all,i);
      const k=getSignals(ed,getHigherTrend(wks),wks);
      if(!k||k.final!=='AL'||k.confidence<MIN_CONF)continue;
      // --- canlı scanOne filtreleri (aynı sıra) ---
      const avgVol=slice.slice(-20).reduce((a,x)=>a+(x.volume||0),0)/Math.min(20,slice.length);
      if(avgVol*last.close<5e6)continue;                                   // likidite
      const isDip=!!k.dipSignal;
      if(!isDip&&(k.adx||0)<MIN_ADX)continue;                              // trendsiz
      if(!isDip&&(k.htfNote||'').includes('⚠'))continue;                   // üst zaman çelişkili
      if(!isDip&&k.higherTrend==='ASAGI')continue;                         // düşen trende momentum-AL yok
      if(!isDip&&(last.volume||0)<avgVol*0.7)continue;                     // hacim kuruması
      if(!isDip&&(last.rsi||0)>=63)continue;                               // aşırı-alım/geç giriş
      // --- canlı main() RS filtresi: endeksten belirgin zayıf AL'ı ele (dip hariç) ---
      if(!isDip){
        const ago=slice[Math.max(0,slice.length-60)], ret60=ago?(last.close-ago.close)/ago.close*100:0;
        const xi=idxAt.get(istDay(all[i].ts));
        if(xi!=null&&xi>=59){const ir=(idx[xi].close-idx[xi-59].close)/idx[xi-59].close*100; if(ret60-ir<=-3)continue;}
      }
      const fwd=(all[i+FWD].close-last.close)/last.close*100;
      trades.push({conf:k.confidence,dip:isDip,fwd});
    }
  }));
}
const wr=a=>a.length?(a.filter(t=>t.fwd>0).length/a.length*100).toFixed(0):'-';
const av=a=>a.length?(a.reduce((s,t)=>s+t.fwd,0)/a.length).toFixed(2):'-';
console.log(`Toplam AL sinyali: ${trades.length} (${FWD} gün ileri getiri · canlı filtreler · ${sample.length-skipped}/${sample.length} sembol)`);
console.log(`GENEL: isabet %${wr(trades)} · ort. getiri %${av(trades)}`);
for(const[lo,hi] of [[65,75],[75,85],[85,101]]){
  const g=trades.filter(t=>t.conf>=lo&&t.conf<hi);
  console.log(`  güven ${lo}-${hi-1}: ${g.length} sinyal · isabet %${wr(g)} · ort %${av(g)}`);
}
const dips=trades.filter(t=>t.dip);
console.log(`  DİP dönüşler: ${dips.length} · isabet %${wr(dips)} · ort %${av(dips)}`);
