// FİKİR KARNESİ + EŞİK AYARI + MAKRO TAKVİM TESTİ — ağsız (gist ve Yahoo taklit). Çalıştır: node bot/karne.test.mjs
process.env.GH_GIST_TOKEN = "g"; process.env.GIST_ID = "id"; delete process.env.TG_TOKEN;
let fail = 0; const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
const files = {}, bars = {};   // gist dosyaları · sembol → [{d, o, h, l, c}]
const ts = d => Date.parse(d + "T07:00:00Z") / 1e3;
globalThis.fetch = async (url, opt = {}) => {
  const u = String(url);
  if (u.includes("api.github.com/gists")) {
    if ((opt.method || "GET") === "GET") return J({ files: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, { content: v }])) });
    for (const [k, v] of Object.entries(JSON.parse(opt.body).files)) files[k] = v.content; return J({});
  }
  const m = u.match(/chart\/(\w+)\.IS/); if (m) { const b = bars[m[1]] || []; return J({ chart: { result: [{ meta: {}, timestamp: b.map(x => ts(x.d)), indicators: { quote: [{ open: b.map(x => x.o), high: b.map(x => x.h), low: b.map(x => x.l), close: b.map(x => x.c), volume: b.map(() => 1e6) }] } }] } }); }
  throw new Error("beklenmeyen istek " + u);
};
const { ideasAdd, ideasEval, ideasLoad, karneText, tuneMinConf, macroToday } = await import("./run.mjs");
const B = (d, o, h, l, c) => ({ d, o, h, l, c });

console.log("Fikir kaydı ve sonuçlandırma:");
bars.HDF = [B("2026-11-02", 10, 10, 10, 10), B("2026-11-03", 10, 10.5, 9.8, 10.2), B("2026-11-04", 10.2, 12.5, 10.1, 12)];   // 2. gün hedef
bars.STP = [B("2026-11-02", 10, 10, 10, 10), B("2026-11-03", 10, 10.2, 8.9, 9)];                                         // 1. gün stop
bars.IKI = [B("2026-11-02", 10, 10, 10, 10), B("2026-11-03", 10, 12.5, 8.9, 11)];                                         // aynı mumda ikisi → STOP
bars.SUR = [B("2026-11-02", 10, 10, 10, 10), B("2026-11-03", 10, 10.4, 9.7, 10.3), B("2026-11-04", 10.3, 10.6, 9.9, 10.5), B("2026-11-05", 10.5, 10.6, 10.1, 10.4)];   // 3 gün ufuk → SÜRE
bars.ACK = [B("2026-11-02", 10, 10, 10, 10), B("2026-11-03", 10, 10.3, 9.7, 10.1)];                                       // ufuk dolmadı → açık
const I = (sym, h = 10, k = "AL") => ({ k, sym, d: "2026-11-02", e: 10, s: 9, t: 12, h, conf: 80 });
await ideasAdd([I("HDF"), I("STP"), I("IKI"), I("SUR", 3, "DONUS"), I("ACK")]);
await ideasAdd([I("HDF")]);   // aynı fikir ikinci kez
let b = await ideasLoad(); ok(b.open.length === 5, "5 fikir kaydedildi, aynı fikir tekrar eklenmedi");
await ideasAdd([{ k: "AL", sym: "BOZ", d: "2026-11-02", e: 10, s: 11, t: 12, h: 10 }]); b = await ideasLoad(); ok(b.open.length === 5, "bozuk seviyeli fikir (stop girişin üstünde) reddedildi");
b = await ideasEval();
const r = s => b.closed.find(x => x.sym === s);
ok(r("HDF")?.r === "HEDEF" && r("HDF").R === 2, "hedef → HEDEF, +2R");
ok(r("STP")?.r === "STOP" && r("STP").R === -1, "stop → STOP, −1R");
ok(r("IKI")?.r === "STOP", "aynı mumda stop ve hedef → STOP (temkinli)");
ok(r("SUR")?.r === "SÜRE" && r("SUR").R === 0.4, "ufuk doldu → SÜRE, kapanıştan R (" + r("SUR")?.R + ")");
ok(b.open.length === 1 && b.open[0].sym === "ACK", "ufku dolmayan açık kaldı");
const kt = karneText({ closed: b.closed.map(x => ({ ...x, cd: new Date().toISOString().slice(0, 10) })), open: b.open }, 30);
ok(kt.includes("🔔 Yeni AL: 3 fikir · hedef 1 · stop 2") && kt.includes("🔄 Dönüş günü: 1 fikir"), "karne metni: " + kt.split("\n")[1]);

console.log("Eşik ayarı (yalnız sıkılaşır):");
const today = new Date().toISOString().slice(0, 10), mk = (n, conf, R) => Array.from({ length: n }, () => ({ k: "AL", conf, R, cd: today }));
ok(tuneMinConf({ closed: mk(25, 70, 0.3) }, 65) === 65, "mevcut eşikte ort. R > 0 → değişmez");
ok(tuneMinConf({ closed: [...mk(30, 70, -0.5), ...mk(22, 80, 0.4)] }, 65) === 75, "65'te kayıp, ≥75'te 22 fikir kârlı → 75");
ok(tuneMinConf({ closed: [...mk(30, 70, -0.5), ...mk(10, 80, 0.4)] }, 65) === 65, "daha yüksek eşikte <20 fikir → değişmez");
ok(tuneMinConf({ closed: mk(10, 70, -0.5) }, 65) === 65, "<20 fikir → değişmez");

console.log("Makro takvim:");
ok(macroToday("2026-12-03").includes("TÜİK enflasyon verisi 10:00"), "3 Aralık 2026 (Perşembe) → TÜİK");
ok(macroToday("2026-12-10").includes("TCMB faiz kararı 14:00"), "10 Aralık 2026 → TCMB PPK");
ok(macroToday("2027-01-04").includes("TÜİK enflasyon verisi 10:00") && !macroToday("2027-01-03").length, "3 Ocak 2027 Pazar → TÜİK 4 Ocak Pazartesi'ye kayar");
ok(macroToday("2026-12-04").length === 0, "sıradan gün → boş");
console.log(fail ? `\n❌ ${fail} BAŞARISIZ` : "\n✅ TÜM KARNE TESTLERİ GEÇTİ");
process.exit(fail ? 1 : 0);
