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
console.log("200 haftalık ortalama (wma200Status, güven bandı −%1):");
{
  const { wma200Status } = await import("./run.mjs"), W = tail => [...Array(215).fill(100), ...tail].map(c => ({ close: c, low: c }));
  ok(wma200Status(W([102, 98])).k === "SAT" && wma200Status(W([102, 98, 97])).t.includes("TEYİTLİ AŞAĞI"), "−%1 bandının altına kapanış → SAT · 2. hafta da altında → TEYİTLİ SAT");
  ok(wma200Status(W([102, 99.6])).k === "IZLE", "HMA'nın −%1 içine kapanış → IZLE (SAT değil)");
  ok(wma200Status(W([98, 101])).k === "KIRILIM" && wma200Status(W([98, 108])).t.includes("KOVALAMA"), "ilk yukarı kırılım → KIRILIM (takibe al; ≥%5 üstündeyse KOVALAMA)");
  ok(wma200Status(W([98, 101, 99.5])).k === "AL" && wma200Status(W([98, 101, 102])).k === "AL", "2. hafta bandın üstünde (−%1 tolerans) → AL teyit");
  ok(wma200Status(W([98, 106, 107, 102.5])).t.includes("GERİ ÇEKİLME") && !wma200Status(W([98, 106, 98.5, 102.5]))?.t.includes("GERİ ÇEKİLME"), "kırılım sonrası %3 içine geri çekilme → AL · arada bandın altına indiyse → yok");
  ok(wma200Status(W([101, 101.5])).k === "YAKIN" && wma200Status(W([120, 121])) === null && wma200Status(W([]).slice(0, 150)) === null, "yakın → YAKIN · uzak → yok · kısa seri → yok");
}
console.log("Formasyonlar (paCore: Elliott ABC / 3. dalga / uyarılar):");
{
  const { paCore, zigzag } = await import("./run.mjs"), B = (c, h = c * 1.005, l = c * 0.995) => ({ close: c, high: h, low: l, volume: 1e6 });
  const z = zigzag([100, 104, 108, 112, 100, 95, 101, 106].map(c => B(c, c, c)), 0.06);
  ok(z.length === 3 && z[0].t === "L" && z[0].p === 100 && z[0].at === 2 && z[1].t === "H" && z[1].p === 112 && z[1].at === 4 && z[2].t === "L" && z[2].p === 95 && z[2].at === 6, "zigzag: yön ilk %6 harekette belirlenir (dip 100, 2. gün) · tepe 112 (4. gün onay) · dip 95 (101 ≥ 95×1.06 → 6. gün onay) — gelecek sızmıyor");
  // yükselen trend + zigzag ABC (%10): H 151 → A 120 → B 138 (A'nın %58'i geri alındı) → C 115 (< A) → B tepesi (138) kırıldı
  const seg = (pts, st) => { const p = []; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.round(Math.abs(b - a) / st)); for (let q = 0; q < n; q++) p.push(+(a + (b - a) * q / n).toFixed(2)); } p.push(pts.at(-1)); return p; };
  const up = [70, 66, 62, ...Array.from({ length: 140 }, (_, i) => 60 + i * 0.65)], abc = seg([151, 120, 138, 115, 139.5], 5);
  const p = paCore([...up, ...abc].map(c => B(c, c, c)));
  const x = p.al.find(r => r.k === "ABC");
  ok(x && x.stop < 139.5 && x.tgt > 139.5 && x.stop >= 139.5 * 0.92, "yükselen trendde zigzag ABC bitti → AL · stop C dibi altında (en çok −%8) · hedef girişin üstünde (" + (x && `stop ${x.stop} hedef ${x.tgt}`) + ")");
  const bad = paCore([...up, ...seg([151, 120, 149, 115, 150], 5)].map(c => B(c, c, c)));
  ok(!bad.al.some(r => r.k === "ABC"), "B, A'nın %78.6'sından fazlasını geri aldıysa (yassı) → zigzag ABC YOK");
  const dn = paCore([...up, ...abc].map(c => B(c, c, c)).map((b, i) => i > 142 ? b : { ...b, close: 200 - i * 0.5, high: 200 - i * 0.5, low: 200 - i * 0.5 }));
  ok(!dn.al.some(r => r.k === "ABC"), "aynı ABC düşen trendde → AL YOK");
  ok(paCore(up.slice(0, 100).map(c => B(c))).al.length === 0, "kısa seri (<130 gün) → boş");
  // 5 dalga itki (%10): 60→80→70→110→95→120 sonra düşüş: 4. dalga dibi onayında 5. DALGA AL, 95 aşağı kırılınca İTKİ BİTTİ SAT
  const pts = [70, 60, 80, 70, 110, 95, 120, 90], path = Array(80).fill(70); for (let i = 1; i < pts.length; i++) { const a0 = pts[i - 1], a1 = pts[i], n = Math.abs(a1 - a0); for (let k = 0; k < n; k++) path.push(a0 + (a1 - a0) * k / n); } path.push(90);
  const bars = path.map(c => B(c, c, c)), hits = { W5: [], IMP: [] };
  for (let i = 130; i < bars.length; i++) { const r = paCore(bars.slice(0, i + 1)); if (r.al.some(x => x.k === "W5")) hits.W5.push(path[i]); if (r.sat.some(x => x.k === "IMP")) hits.IMP.push(path[i]); }
  ok(hits.W5.length === 1 && hits.W5[0] > 95 && hits.W5[0] < 110, "itki kuralları sağlanınca 4. dalga dibi onay gününde 5. DALGA AL (fiyat " + hits.W5[0] + ")");
  ok(hits.IMP.length === 1 && hits.IMP[0] < 95, "5. dalga bitip 4. dalga dibi (95) kırılınca İTKİ BİTTİ → SAT, tek sefer (fiyat " + hits.IMP[0] + ")");
}
console.log("Otomatik susturma + en iyiler listesi:");
{
  const { muteCalc, setMuted, topPicks, kvList } = await import("./run.mjs"), td = new Date().toISOString().slice(0, 10);
  const I = (k, why, R, n, src) => Array.from({ length: n }, () => ({ k, why, src, R, cd: td }));
  const m = muteCalc({ closed: [...I("KV", "güçlü kapanış", -0.2, 25), ...I("KV", "dönüş günü", 0.4, 25), ...I("EW", "x", -0.5, 10, "W3"), ...I("AL", "", -1, 40), ...I("MA20", "", -0.1, 20)] });
  ok(m["KV:güçlü kapanış"] && !m["KV:dönüş günü"] && !m["EW:W3"] && !m.AL && m.MA20, "≥20 sonuç + ort. R ≤ 0 → susturulur · kârlı / <20 sonuç / tarama AL'ı susturulmaz (" + Object.keys(m).join(", ") + ")");
  const R = (sym, extra = {}) => ({ sym, c: 10, dr: 5, pos: 0.9, vr: 2, atr: 0.5, rec: 3, ...extra });
  const k = { rev: true, xDay: 1, top: [R("AAA"), R("BBB")], strong: [R("CCC")], pull3: [], rsi2: [], weakSet: new Set(["DDD"]), weak: [{ sym: "DDD", c: 5, dr: -6 }], ma20: [], ew: [{ sym: "BBB", k: "W5", c: 10, stop: 9.5, tgt: 11 }], ews: [{ sym: "CCC", k: "IMP", c: 10, lv: 9.8 }], paw: [] };
  setMuted({}); let T = topPicks(k, [], { gz: [] });
  ok(T.al[0].sym === "AAA" || T.al[0].sym === "BBB", "en yüksek günlük ölçüm (dönüş günü 1.48/3g) ilk sırada");
  ok(T.al.find(x => x.sym === "BBB")?.conf.includes("Elliott 5. dalga") && T.clash.includes("CCC") && !T.al.some(x => x.sym === "CCC") && T.sat[0].sym === "DDD", "aynı hissede ikinci kaynak = teyit · AL+SAT çakışan (CCC) listede yok · gün ≤−%4 SAT listesinde");
  setMuted({ muted: { "KV:dönüş günü": { n: 20, r: -0.1 } } }); T = topPicks(k, [], { gz: [] });
  ok(!T.al.some(x => x.key === "KV:dönüş günü") && kvList(k).every(r => r.why !== "dönüş günü") && kvList(k, true).some(r => r.why === "dönüş günü"), "susturulan kaynak listelerde yok ama karne kaydı için (all) gölgede üretiliyor");
  setMuted({});
}
console.log(fail ? `\n❌ ${fail} BAŞARISIZ` : "\n✅ TÜM KARNE TESTLERİ GEÇTİ");
process.exit(fail ? 1 : 0);
