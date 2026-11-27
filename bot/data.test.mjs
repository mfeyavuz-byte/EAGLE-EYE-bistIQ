// VERİ KATMANI TESTİ — ağsız. Çalıştır: node bot/data.test.mjs
// (1) Yahoo'nun haftalık serinin sonuna eklediği sahte "1 günlük hafta" mumu temizleniyor mu (2026-11-22: 195/195 hissede vardı)
// (2) weeklyAsOf geçmiş tekrarında geleceği sızdırmıyor mu (backtest + portföy simülatörü buna dayanır)
import { dedupWeeks, weeklyAsOf, weekKey } from "./data.mjs";
let fail = 0; const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; };
const B = (iso, o, h, l, c, v) => ({ ts: Date.parse(iso), date: "", open: o, high: h, low: l, close: c, volume: v });

console.log("dedupWeeks (Yahoo haftalık çift son mum):");
{
  // gözlenen gerçek örnek (AGESA): 16 Kasım haftası tam mum + aynı haftaya düşen Cuma mumu
  const y = [B("2026-11-09T06:00:00Z", 211.2, 215.7, 207.1, 213.6, 1370829), B("2026-11-16T06:00:00Z", 214.5, 215.3, 201.9, 205.6, 744400), B("2026-11-20T06:00:00Z", 206, 206.5, 201.9, 205.6, 128137)];
  const w = dedupWeeks(y);
  ok(w.length === 2 && w[1].close === 205.6 && w[1].volume === 744400 && w[1].open === 214.5, "AGESA örneği: sahte Cuma 'haftası' atıldı, gerçek hafta mumu aynen kaldı");
  ok(new Set(w.map(x => weekKey(x.ts))).size === w.length, "çıktıda aynı haftadan iki mum yok");
  const m = dedupWeeks([B("2026-11-16T06:00:00Z", 2, 5, 1, 4, 30), B("2026-11-20T06:00:00Z", 4, 7, 3, 6, 5)]);
  ok(m.length === 1 && m[0].high === 7 && m[0].low === 1 && m[0].close === 6 && m[0].volume === 35, "son gün haftalık muma dahil DEĞİLSE birleştirilir (yüksek/düşük/kapanış/hacim)");
  const n = dedupWeeks(y.slice(0, 2)); ok(n.length === 2 && n !== y, "çift yoksa dokunulmaz (kopya döner)");
  ok(dedupWeeks([]).length === 0, "boş seri");
}

console.log("weeklyAsOf (gelecek sızıntısı yok):");
{
  // 3 haftalık günlük seri (Pzt-Cuma) + aynı dönemin Yahoo haftalıkları
  const days = [], wk = [];
  for (let w = 0; w < 3; w++) {
    const mon = Date.parse("2026-11-02T06:00:00Z") + w * 7 * 864e5, part = [];
    for (let d = 0; d < 5; d++) { const c = 100 + w * 10 + d; const b = B(new Date(mon + d * 864e5).toISOString(), c - 0.5, c + 1, c - 1, c, 1000); days.push(b); part.push(b); }
    wk.push({ ts: mon, date: "", open: part[0].open, high: Math.max(...part.map(x => x.high)), low: Math.min(...part.map(x => x.low)), close: part[4].close, volume: 5000 });
  }
  const i = 11;   // 3. haftanın Salı'sı
  const s = weeklyAsOf(wk, days, i);
  ok(s.length === 3 && s[2].close === days[i].close && s[2].high === Math.max(days[10].high, days[11].high), "Salı itibarıyla: 2 tamamlanmış hafta + Pzt-Salı kısmi mum");
  ok(s.every(x => x.high <= Math.max(...days.slice(0, i + 1).map(b => b.high))), "hiçbir mum o günden sonraki fiyatı içermiyor");
  const f = weeklyAsOf(wk, days, 14); ok(f.length === 3 && f[2].close === wk[2].close && f[2].high === wk[2].high, "Cuma itibarıyla kısmi mum = Yahoo'nun tam hafta mumu");
}
console.log("Yahoo son mum kapanışı null (bugünkü mum):");
{
  const { fetchDaily } = await import("./data.mjs"), real = globalThis.fetch, t0 = Date.parse("2026-11-26T06:00:00Z") / 1e3, t1 = Date.parse("2026-11-27T06:00:00Z") / 1e3;
  const mk = (cl, mp, mt) => new Response(JSON.stringify({ chart: { result: [{ meta: { regularMarketPrice: mp, regularMarketTime: mt }, timestamp: [t0, t1], indicators: { quote: [{ open: [100, 101], high: [102, 112], low: [99, 100], close: [101, cl], volume: [5, 7] }] } }] } }), { status: 200 });
  globalThis.fetch = async () => mk(null, 110.5, t1 + 30000); let d = await fetchDaily("TEST");
  ok(d.length === 2 && d[1].close === 110.5 && d[1].high === 112 && d[1].low === 100 && d[1].volume === 7, "son mum close=null → canlı fiyat (110.5) ile tamamlandı, O/Y/D/H korundu");
  globalThis.fetch = async () => mk(null, 110.5, t0 - 10); d = await fetchDaily("TEST");
  ok(d.length === 1, "canlı fiyat o güne ait değilse (eski zaman damgası) mum yine atılır");
  globalThis.fetch = async () => mk(105, 110.5, t1 + 30000); d = await fetchDaily("TEST");
  ok(d[1].close === 105, "kapanış doluysa dokunulmaz");
  globalThis.fetch = real;
}
console.log(fail ? `\n❌ ${fail} BAŞARISIZ` : "\n✅ TÜM VERİ TESTLERİ GEÇTİ");
process.exit(fail ? 1 : 0);
