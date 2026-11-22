// TELEGRAM TESLİM TESTİ — ağsız (fetch taklit edilir, hiçbir mesaj gitmez). Çalıştır: node bot/tg.test.mjs
// Soru: "AL/SAT hisseleri mesajda eksik geliyor mu?" → (1) HİSSE TARA mesajı her sinyali içeriyor mu, (2) uzun mesaj
// parçalanırken satır kayboluyor mu, (3) Telegram 429/5xx/ağ hatasında parça kayboluyor mu.
process.env.TG_TOKEN = "t"; process.env.TG_CHAT = "c"; process.env.TG_GAP_MS = "0";
const { buildScanMsg, sendTG } = await import("./run.mjs");
let fail = 0; const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

// gerçekçi sentetik sinyaller (benzersiz sembol adları: "S" + harfler → alt-dize karışması olmasın)
const name = i => "Q" + String.fromCharCode(65 + (i % 26)) + String.fromCharCode(65 + Math.floor(i / 26) % 26) + String.fromCharCode(65 + Math.floor(i / 676));
const mk = (n, signal, off = 0) => Array.from({ length: n }, (_, k) => ({ sym: name(k + off), signal, confidence: 99 - (k % 30), price: 10 + k, stopLoss: 9 + k, target1: 12 + k,
  breakout: k % 7 === 0 ? 1 : 0, boTarget: 20 + k, preMom: k % 3 ? 60 : 0, er: 0.6, ret60: 20, news: k % 4 ? "📰+1.2" : "" }));
const symsIn = m => new Set(m.match(/\bQ[A-Z]{3}\b/g) || []);

console.log("HİSSE TARA mesajı — hiçbir sinyal kaybolmuyor mu:");
for (const [nA, nS, label] of [[1, 81, "bugünkü gerçek durum (1 AL / 81 SAT)"], [3, 118, "geçmişin en kötü günü 2026-10-16 (3 AL / 118 SAT)"], [60, 135, "uç durum: 195 hissenin hepsi sinyal (60 AL / 135 SAT)"], [15, 15, "tam 15/15"], [4, 9, "az sinyal"]]) {
  const sig = [...mk(nA, "AL"), ...mk(nS, "SAT", 500)];
  const m = buildScanMsg(sig), got = symsIn(m);
  ok(sig.every(s => got.has(s.sym)) && got.size === nA + nS, `${label}: ${got.size}/${nA + nS} hisse mesajda · ${m.length} krk`);
  ok(m.includes(`📈 AL (${nA})`) && m.includes(`📉 SAT (${nS})`), `  başlıkta TOPLAM sayı: AL (${nA}) · SAT (${nS})`);
  const detailed = m.split("\n").filter(l => /^Q[A-Z]{3} %/.test(l)).length, more = (m.match(/➕ Diğer (\d+)/g) || []).map(x => +x.split(" ").pop());
  ok(detailed === Math.min(nA, 15) + Math.min(nS, 15) && more.reduce((a, b) => a + b, 0) === Math.max(0, nA - 15) + Math.max(0, nS - 15), `  ayrıntılı ${detailed} satır + kısa listede ${more.reduce((a, b) => a + b, 0)} (${more.length ? "➕ Diğer satırı var" : "hepsi ayrıntılı"})`);
}
{
  const m = buildScanMsg([...mk(2, "AL"), ...mk(2, "SAT", 500)]), L = m.split("\n").filter(l => /^Q[A-Z]{3} %/.test(l));
  ok(L.slice(0, 2).every(l => l.includes("stop") && l.includes("hedef")) && L.slice(2).every(l => !l.includes("stop") && !l.includes("hedef")), "AL satırında stop/hedef var, SAT satırında yok (alış yönlüydü)");
  ok(buildScanMsg([]).includes("Tarama 0 sinyal"), "0 sinyal → uyarı satırı");
  ok(buildScanMsg(mk(1, "AL"), 401).includes("⛔ GIST ERİŞİLEMİYOR (HTTP 401)"), "gist hatası satırı korunuyor");
}

console.log("sendTG — parçalama (satır kaybı yok, her parça ≤3900):");
let sent = [], plan = [];
globalThis.fetch = async (u, o) => { const step = plan.shift() || "ok"; if (step === "net") throw new Error("ECONNRESET"); const b = JSON.parse(o.body); sent.push(b.text);
  if (step === "ok") return J({ ok: true, result: {} });
  if (step === "429") return J({ ok: false, error_code: 429, description: "Too Many Requests: retry after 1", parameters: { retry_after: 1 } }, 429);
  if (step === "500") return J({ ok: false, description: "Internal Server Error" }, 500);
  if (step === "400") return J({ ok: false, description: "Bad Request: chat not found" }, 400); };
{
  const big = buildScanMsg([...mk(60, "AL"), ...mk(135, "SAT", 500)]) + "\n" + Array.from({ length: 120 }, (_, i) => `satır ${i} ` + "x".repeat(60)).join("\n");
  sent = []; const r = await sendTG(big);
  ok(r && sent.length >= 2 && sent.every(t => t.length <= 3900) && sent.join("\n") === big, `${big.length} krk → ${sent.length} parça, en uzun ${Math.max(...sent.map(t => t.length))}, birleşince birebir aynı`);
  const longLine = "Z".repeat(9000); sent = []; await sendTG("başlık\n" + longLine + "\nson");
  ok(sent.every(t => t.length <= 3900) && sent.join("").replace(/\n/g, "") === ("başlık" + longLine + "son"), `3900'den uzun TEK satır (9000 krk) kesilmeden ${sent.length} parçaya bölündü (eskiden 4000'de kesiliyordu)`);
}

console.log("sendTG — Telegram hatalarında parça kaybolmuyor mu:");
{
  sent = []; plan = ["429", "ok"]; let t0 = Date.now(), r = await sendTG("rapor A");
  ok(r && sent.length === 2 && sent[1] === "rapor A" && Date.now() - t0 >= 1000, `429 "retry after 1" → ${Date.now() - t0} ms bekledi, 2. denemede teslim (eskiden KAYBOLUYORDU)`);
  sent = []; plan = ["500", "ok"]; r = await sendTG("rapor B"); ok(r && sent.length === 2, "500 → yeniden denendi, teslim");
  sent = []; plan = ["net", "ok"]; r = await sendTG("rapor C"); ok(r && sent.length === 1 && sent[0] === "rapor C", "ağ hatası → yeniden denendi, teslim");
  sent = []; plan = ["400"]; r = await sendTG("rapor D"); ok(r === false && sent.length === 1, "400 (sohbet yok) → boşuna tekrar denemiyor, false döner");
  sent = []; plan = ["429", "429", "429"]; t0 = Date.now(); r = await sendTG("rapor E");
  ok(r === false && sent.length === 3 && Date.now() - t0 < 10000, `sürekli 429 → 3 denemede bırakır (sonsuz döngü yok, ${Date.now() - t0} ms)`);
  sent = []; plan = ["ok", "429", "ok", "ok"]; const multi = Array.from({ length: 3 }, (_, i) => `P${i} ` + "y".repeat(3000)).join("\n");
  r = await sendTG(multi); ok(r && sent.filter(t => t.startsWith("P")).length === 4 && [...new Set(sent)].join("\n") === multi, "çok parçalı mesajın ORTA parçası 429 alınca o parça yeniden gönderildi, sıra korunuyor");
}

console.log("sendTG — hız sınırı (sohbet başına ~1 mesaj/sn):");
{
  process.env.TG_GAP_MS = "300"; const at = []; globalThis.fetch = async () => { at.push(Date.now()); return J({ ok: true }); };
  await sendTG("a"); await sendTG("b"); await sendTG("c");
  const gaps = at.slice(1).map((t, i) => t - at[i]);
  ok(gaps.every(g => g >= 290), `ardışık mesajlar arası ≥ TG_GAP_MS: ${gaps.join(", ")} ms (varsayılan 1000)`);
}
console.log(fail ? `\n❌ ${fail} BAŞARISIZ` : "\n✅ TÜM TELEGRAM TESTLERİ GEÇTİ");
process.exit(fail ? 1 : 0);
