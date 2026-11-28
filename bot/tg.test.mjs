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

console.log("HİSSE TARA — sade (en güçlü 5 + toplam) ve /tara tam liste:");
for (const [nA, nS] of [[1, 81], [3, 118], [60, 135], [4, 3]]) {
  const sig = [...mk(nA, "AL"), ...mk(nS, "SAT", 500)], m = buildScanMsg(sig), full = buildScanMsg(sig, 0, null, true);
  const L = m.split("\n").filter(l => /^\S+ Q[A-Z]{3} (GÜÇLÜ )?(AL|SAT) · giriş/.test(l)), F = full.split("\n").filter(l => /^\S+ Q[A-Z]{3} (GÜÇLÜ )?(AL|SAT) · giriş/.test(l));
  ok(L.length === Math.min(5, nA) + Math.min(5, nS) && (nA <= 5 || m.includes(`toplam ${nA}`)) && (nS <= 5 || m.includes(`toplam ${nS}`)), `${nA} AL / ${nS} SAT → mesajda ${L.length} satır, başlıkta toplam`);
  ok(F.length === nA + nS && symsIn(full).size === nA + nS, `  /tara tam liste: ${F.length}/${nA + nS} hisse`);
  ok(L.every(l => /^\S+ Q[A-Z]{3} (GÜÇLÜ )?(AL|SAT) · giriş [\d.]+₺ · hedef [\d.]+₺ · stop [\d.]+₺$/.test(l)), "  her satır YALNIZ giriş · hedef · stop");
}
{
  const [a] = mk(1, "AL"), [sa] = mk(1, "SAT", 500); a.atr = 1; sa.atr = 1; a.price = sa.price = 50;
  const la = buildScanMsg([a]).split("\n").find(l => l.includes(a.sym + " ")), ls = buildScanMsg([sa]).split("\n").find(l => l.includes(sa.sym + " "));
  ok(la.endsWith("giriş 50₺ · hedef 54₺ · stop 48₺") && ls.endsWith("giriş 50₺ · hedef 46₺ · stop 52₺"), "AL: stop 2ATR altta, hedef 2R üstte · SAT: ters yön (" + ls.split(" · ").slice(1).join(" · ") + ")");
  ok(buildScanMsg([]).includes("Tarama 0 sinyal") && buildScanMsg(mk(1, "AL"), 401).includes("⛔ GIST ERİŞİLEMİYOR (HTTP 401)"), "0 sinyal ve gist hatası satırları korunuyor");
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
console.log("Takip listesi TETİK uyarısı (alttan üste geçiş, günde 1):");
{
  process.env.TG_GAP_MS = "0"; const { watchAlerts, _setWatchCache } = await import("./run.mjs"); const got = [];
  globalThis.fetch = async (u, o) => { got.push(JSON.parse(o.body).text); return J({ ok: true }); };
  const W = hit => [{ sym: "YEOTK", c: 27, trig: { t: "ma50", hit, text: "MA50 26.85₺ üstüne çıktı" } }, { sym: "ASTOR", c: 150, trig: { t: "ma20", hit: true, text: "MA20 üstü" } }];
  const st = { watchPrev: { YEOTK: "ma50:0", ASTOR: "hi20:0" } };
  _setWatchCache(W(true)); let n = await watchAlerts([], false, st);
  ok(n === 1 && got.length === 1 && got[0].includes("YEOTK @27₺: MA50 26.85₺ üstüne çıktı") && !got[0].includes("ASTOR"), "YEOTK alttan üste geçti → uyarı · ASTOR tetik TÜRÜ değişti (hi20→ma20) → uyarı YOK");
  _setWatchCache(W(false)); await watchAlerts([], false, st); _setWatchCache(W(true)); n = await watchAlerts([], false, st);
  ok(n === 0 && got.length === 1, "aynı gün tekrar alttan üste geçse de ikinci uyarı YOK (günde 1)");
  const st2 = {}; _setWatchCache(W(true)); n = await watchAlerts([], false, st2);
  ok(n === 0 && st2.watchPrev.YEOTK === "ma50:1", "ilk kez görülen (önceki durum yok) → uyarı yok, sadece kaydedilir");
}
console.log("Güç kademesi (GÜÇLÜ AL / AL / GÜÇLÜ SAT / SAT):");
{
  const { tierOf } = await import("./run.mjs");
  ok(tierOf({ signal: "AL", confidence: 90, trendUp: true }) === "GÜÇLÜ AL" && tierOf({ signal: "AL", confidence: 90 }) === "AL" && tierOf({ signal: "AL", confidence: 70, pUp: true, strongClose: true }) === "GÜÇLÜ AL", "AL: 4 teyitten ≥2 → GÜÇLÜ AL, tek teyit → AL");
  ok(tierOf({ signal: "SAT", bigDrop: true }) === "GÜÇLÜ SAT" && tierOf({ signal: "SAT", confidence: 95, trendDn: true, pDn: true }) === "SAT", "SAT: yalnız gün ≤−%4 → GÜÇLÜ SAT (ölçülen tek çalışan teyit)");
  const m = buildScanMsg([{ sym: "QAAA", signal: "AL", confidence: 70, price: 10, atr: 0.5 }, { sym: "QBBB", signal: "AL", confidence: 90, trendUp: true, price: 10, atr: 0.5 }]);
  ok(m.indexOf("QBBB") < m.indexOf("QAAA") && m.includes("🟢🟢 QBBB GÜÇLÜ AL · giriş") && m.includes("🟢 AL — 1 GÜÇLÜ"), "GÜÇLÜ olan önce, başlıkta GÜÇLÜ sayısı");
}
console.log(fail ? `\n❌ ${fail} BAŞARISIZ` : "\n✅ TÜM TELEGRAM TESTLERİ GEÇTİ");
process.exit(fail ? 1 : 0);
