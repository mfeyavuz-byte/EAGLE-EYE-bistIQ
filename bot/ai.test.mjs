// GROK / GEMINI KULLANIM TESTİ — ağsız (fetch taklit edilir, HİÇBİR istek dışarı gitmez). Çalıştır: node bot/ai.test.mjs
// Soru: "Grok çıktısı gerçekten kullanılıyor mu, nereye gidiyor?" → her yolu uçtan uca yürütür:
//   günlük AI yorumu (aiDaily → Telegram metni), /yorum komutu (handleCommands → Telegram), anahtar yok / hata durumları.
// Anahtar ortamı modül yüklenirken okunduğu için her senaryo grubu ayrı süreçte koşar (ana süreç kendini 3 kez çağırır).
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MODE = process.argv[2];
if (!MODE) {
  let bad = 0;
  for (const [mode, env] of [["both", { XAI_API_KEY: "test-xai", GEMINI_API_KEY: "test-gem" }], ["grokOnly", { XAI_API_KEY: "test-xai" }], ["geminiOnly", { GEMINI_API_KEY: "test-gem" }]]) {
    const e = { ...process.env, TG_TOKEN: "t", TG_CHAT: "c", TG_GAP_MS: "0", GH_GIST_TOKEN: "g", GIST_ID: "id", XAI_API_KEY: "", GEMINI_API_KEY: "", ...env };
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), mode], { env: e, encoding: "utf8" });
    process.stdout.write(r.stdout); if (r.stderr.trim()) process.stdout.write(r.stderr.split("\n").filter(l => !/^\[(Grok|Gemini)\]/.test(l)).join("\n"));
    if (r.status !== 0) bad++;
  }
  console.log(bad ? `\n❌ ${bad} SENARYO GRUBU BAŞARISIZ` : "\n✅ TÜM AI TESTLERİ GEÇTİ");
  process.exit(bad ? 1 : 0);
}

let fail = 0; const ok = (c, m) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; };
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });
let calls = [], tg = [], grokResp, gemResp, updates = [];
globalThis.fetch = async (url, opt = {}) => {
  const u = String(url); calls.push({ u, body: opt.body ? JSON.parse(opt.body) : null });
  if (u.startsWith("https://api.x.ai/")) return grokResp();
  if (u.includes("generativelanguage.googleapis.com")) return gemResp();
  if (u.includes("/sendMessage")) { tg.push(JSON.parse(opt.body).text); return J({ ok: true }); }
  if (u.includes("/getUpdates")) return J({ ok: true, result: updates });
  if (u.includes("api.github.com/gists")) return J({});
  throw new Error("beklenmeyen istek: " + u);
};
const GROK_OK = () => J({ id: "resp_1", output: [{ type: "x_search_call", status: "completed" }, { type: "message", role: "assistant", content: [{ type: "output_text", text: 'X özeti: {"score": 1, "label": "pozitif", "ozet": "Savunma ihracatı haberleriyle yatırımcı ilgisi artıyor.", "uyari": ""}' }] }], usage: { server_side_tool_usage_details: { x_posts_fetched: 23 } } });
const GEM_OK = () => J({ candidates: [{ content: { parts: [{ text: "Piyasa temkinli; ASELS öne çıkıyor." }] } }] });
const { aiDaily, handleCommands } = await import("./run.mjs");
const today = "2026-11-23";
const st0 = () => ({ cash: 400000, start: 500000, pos: { ALBRK: { lot: 100, entry: 8.79 } }, trades: [{ sym: "X", pnl: 100, setup: "trend" }], dayKey: today, lastLlmDay: "2026-11-20", tgOffset: 5 });
const sigs = [{ sym: "ASELS", signal: "AL", confidence: 80, rr: 2, analyst: "Buy 30%" }, { sym: "THYAO", signal: "AL", confidence: 72 }, { sym: "SASA", signal: "SAT", confidence: 70 }];
const xCalls = () => calls.filter(c => c.u.startsWith("https://api.x.ai/")), gCalls = () => calls.filter(c => c.u.includes("generativelanguage"));

if (MODE === "both") {
  console.log("GÜNLÜK AI YORUMU — iki anahtar da var:");
  grokResp = GROK_OK; gemResp = GEM_OK; calls = [];
  let st = st0(), m = await aiDaily(st, sigs, false);
  const xb = xCalls()[0]?.body;
  ok(xCalls().length === 1 && xCalls()[0].u === "https://api.x.ai/v1/responses", "Grok çağrıldı: /v1/responses (1 kez, yalnız en güçlü AL adayı)");
  ok(xb?.model === "grok-4.7" && xb?.tools?.[0]?.type === "x_search" && /^\d{4}-\d{2}-\d{2}$/.test(xb.tools[0].from_date) && xb.max_turns === 2 && !("search_parameters" in xb), "istek: grok-4.7 · x_search · from_date " + xb?.tools?.[0]?.from_date + " · max_turns 2 · eski search_parameters YOK");
  ok(JSON.stringify(xb?.input).includes("ASELS"), "Grok'a sorulan hisse = en güçlü AL (ASELS)");
  const gp = gCalls()[0]?.body?.contents?.[0]?.parts?.[0]?.text || "";
  ok(gp.includes("X (Twitter) duyarlılığı — Grok, ASELS: pozitif (1)"), "Grok sonucu Gemini'nin girdisine eklendi");
  ok(m?.startsWith("🤖 GÜNLÜK AI YORUM (Gemini+Grok)"), "başlık: (Gemini+Grok)");
  ok(m?.includes("Piyasa temkinli; ASELS öne çıkıyor."), "Gemini yorumu mesajda");
  ok(m?.includes("🐦 Grok/X (ASELS): pozitif (+1) · 23 X gönderisi okundu") && m.includes("Savunma ihracatı haberleriyle"), "Grok sonucu mesajda AYRI SATIR (+ okunan gönderi sayısı = arama gerçekten yapıldı)");
  ok(m?.includes("AI TRADER kararlarına girmez"), "mesaj: yalnız yorum, işlem kararına girmez");
  calls = []; ok(await aiDaily(st, sigs, false) === null && calls.length === 0, "aynı gün 2. kez: hiç istek yok (maliyet tavanı 1/gün)");

  console.log("Gemini BAŞARISIZ (eskiden Grok sonucu çöpe gidiyordu):");
  gemResp = () => J({ error: { code: 503, message: "overloaded" } }, 503);
  m = await aiDaily(st0(), sigs, false);
  ok(m?.startsWith("🤖 GÜNLÜK AI YORUM (Grok)") && m.includes("🐦 Grok/X (ASELS): pozitif (+1)") && m.includes("Gemini yorumu alınamadı"), "Grok satırı yine gönderiliyor + Gemini hatası görünür");

  console.log("Grok BAŞARISIZ (eskiden sessizdi):");
  grokResp = () => J({ code: "invalid", error: "Incorrect API key provided" }, 400); gemResp = GEM_OK;
  m = await aiDaily(st0(), sigs, false);
  ok(m?.startsWith("🤖 GÜNLÜK AI YORUM (Gemini)") && m.includes("🐦 Grok/X (ASELS): alınamadı — HTTP 400 · Incorrect API key provided"), "hata sebebi mesajda: HTTP 400 · Incorrect API key");
  grokResp = () => J({ error: "Live search is deprecated" }, 410);
  m = await aiDaily(st0(), sigs, false); ok(m?.includes("alınamadı — HTTP 410"), "eski API (410) hatası görünür");
  grokResp = () => J({ output_text: "Bu hisse hakkında yeterli gönderi bulunamadı." });
  m = await aiDaily(st0(), sigs, false); ok(m?.includes("alınamadı — cevapta JSON yok: Bu hisse hakkında"), "JSON'suz cevap → sebebiyle görünür");
  grokResp = () => { throw new Error("ECONNRESET"); };
  m = await aiDaily(st0(), sigs, false); ok(m?.includes("alınamadı — ECONNRESET") && m.includes("Piyasa temkinli"), "ağ hatası → çökme yok, Gemini yine gelir");

  console.log("Gemini düşünme ayarı / zaman aşımı:");
  { let n = 0; grokResp = GROK_OK; gemResp = () => (++n === 1 ? J({ error: { code: 400, message: "Unknown name thinkingConfig: thinking is not supported" } }, 400) : GEM_OK()); calls = [];
    m = await aiDaily(st0(), sigs, false); const gb = gCalls().map(c => c.body.generationConfig);
    ok(m?.includes("Piyasa temkinli") && gb.length === 2 && gb[0].thinkingConfig?.thinkingBudget === 0 && !gb[1].thinkingConfig, "düşünme kapalı istenir; model reddederse (400) ayarsız tekrar → yorum geldi"); }
  { gemResp = () => { const e = new Error("This operation was aborted"); e.name = "AbortError"; throw e; }; tg = [];
    updates = [{ update_id: 30, message: { chat: { id: "c" }, text: "/aitest" } }]; await handleCommands(st0());
    ok(tg[1]?.includes("Gemini (gemini-flash-latest): ERR zaman aşımı (60 sn)"), "zaman aşımı anlaşılır yazılır: " + (tg[1] || "").split("\n")[1]); gemResp = GEM_OK; }

  console.log("AL adayı yok:");
  grokResp = GROK_OK; calls = [];
  m = await aiDaily(st0(), sigs.filter(s => s.signal !== "AL"), false);
  ok(xCalls().length === 0 && m?.startsWith("🤖 GÜNLÜK AI YORUM (Gemini)"), "Grok çağrılmaz (para harcanmaz), yalnız Gemini");

  console.log("/yorum KOMUTU (Telegram):");
  grokResp = GROK_OK; tg = []; calls = [];
  updates = [{ update_id: 9, message: { chat: { id: "c" }, text: "/yorum asels" } }, { update_id: 10, message: { chat: { id: "BASKA" }, text: "/yorum THYAO" } }];
  let s = st0(); await handleCommands(s);
  ok(tg[0]?.includes("ASELS için X gönderileri Grok ile inceleniyor") && tg[1]?.startsWith("🐦 Grok/X (ASELS): pozitif (+1) · 23 X gönderisi okundu"), "cevap: " + JSON.stringify(tg[1]?.split("\n")[0]));
  ok(xCalls().length === 1, "yabancı sohbetten gelen /yorum YOK SAYILDI (yalnız TG_CHAT)");
  ok(s.tgOffset === 11, "Telegram offset ilerledi (komut tekrar işlenmez)");
  grokResp = () => J({ error: { message: "Model grok-4.7 not found" } }, 404); tg = [];
  updates = [{ update_id: 11, message: { chat: { id: "c" }, text: "/yorum ASELS" } }]; await handleCommands(st0());
  ok(tg[1] === "🐦 ASELS: Grok/X yorumu alınamadı — HTTP 404 · Model grok-4.7 not found", "hata sebebi: " + tg[1]);

  console.log("/aitest:");
  grokResp = () => J({ output: [{ type: "message", content: [{ type: "output_text", text: "THYAO yükseliş." }] }], usage: { server_side_tool_usage_details: { x_posts_fetched: 7 } } }); gemResp = GEM_OK; tg = [];
  updates = [{ update_id: 12, message: { chat: { id: "c" }, text: "/aitest" } }]; await handleCommands(st0());
  ok(tg[1]?.includes("Gemini (gemini-flash-latest): OK ✓") && tg[1]?.includes("Grok (grok-4.7): OK ✓ X araması çalışıyor (7 gönderi)"), "teşhis: " + JSON.stringify(tg[1]));
}

if (MODE === "grokOnly") {
  console.log("YALNIZ XAI anahtarı (eskiden Grok HİÇ çağrılmıyordu — günlük blok GEMINI anahtarına bağlıydı):");
  grokResp = GROK_OK; gemResp = () => { throw new Error("Gemini çağrılmamalı"); }; calls = [];
  const m = await aiDaily(st0(), sigs, false);
  ok(xCalls().length === 1 && gCalls().length === 0, "Grok çağrıldı, Gemini çağrılmadı");
  ok(m?.startsWith("🤖 GÜNLÜK AI YORUM (Grok)") && m.includes("🐦 Grok/X (ASELS): pozitif (+1)") && !m.includes("Gemini yorumu alınamadı"), "mesaj: yalnız Grok satırı (Gemini hatası yazmaz — anahtarı yok)");
}

if (MODE === "geminiOnly") {
  console.log("YALNIZ GEMINI anahtarı:");
  grokResp = () => { throw new Error("Grok çağrılmamalı"); }; gemResp = GEM_OK; calls = [];
  const m = await aiDaily(st0(), sigs, false);
  ok(xCalls().length === 0 && m?.startsWith("🤖 GÜNLÜK AI YORUM (Gemini)") && !m.includes("Grok/X"), "Grok çağrılmadı, mesaj yalnız Gemini");
  tg = []; updates = [{ update_id: 20, message: { chat: { id: "c" }, text: "/yorum ASELS" } }]; await handleCommands(st0());
  ok(tg[0] === "🐦 ASELS: Grok/X yorumu için XAI_API_KEY secret'ı gerekli.", "/yorum → anahtar gerekli uyarısı");
}
process.exit(fail ? 1 : 0);
