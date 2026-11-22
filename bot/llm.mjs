// LLM katmanı — Grok (xAI, X/Twitter araması) + Gemini (Google).
// FAIL-SAFE: anahtar yoksa veya hata/timeout olursa null döner; ASLA çağıranı patlatmaz.
// Anahtarlar GitHub secret: XAI_API_KEY, GEMINI_API_KEY. Model override: XAI_MODEL, GEMINI_MODEL.
const XAI_KEY = process.env.XAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
// xAI eski "Live Search"ü (chat/completions + search_parameters) ~2026-01'de KAPATTI (HTTP 410).
// Yeni yol: Responses API (/v1/responses) + sunucu-tarafı "x_search" aracı. grok-4.7 = xAI dokümanının örnek/önerilen modeli.
const XAI_MODEL = process.env.XAI_MODEL || "grok-4.7";
// gemini-2.0-flash 2026-06-01'de KAPATILDI (404). "latest" takma adı en güncel Flash'ı izler, emekliye ayrılmadan etkilenmez.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

export const llmEnabled = () => !!(XAI_KEY || GEMINI_KEY);
export const grokEnabled = () => !!XAI_KEY;
export const geminiEnabled = () => !!GEMINI_KEY;

// POST + zaman aşımı. Sayaç cevabın GÖVDESİ okunana kadar açık kalır (gövdede takılma = sonsuz bekleme olmasın).
async function postJSON(url, headers, body, timeout) {
  const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { ok: r.ok, status: r.status, json, text };
  } finally { clearTimeout(tid); }
}
const errMsg = r => { const e = r.json?.error; return String((e && (e.message || (typeof e === "string" ? e : JSON.stringify(e)))) || r.text || "").replace(/\s+/g, " ").slice(0, 110); };

// Responses API cevabından metni çıkar. Doküman tam şemayı vermiyor → esnek: output_text kısayolu VEYA output[].content[].text.
function respText(j) {
  if (!j) return "";
  if (typeof j.output_text === "string" && j.output_text.trim()) return j.output_text.trim();
  return (j.output || []).flatMap(o => typeof o?.content === "string" ? [o.content] : (Array.isArray(o?.content) ? o.content.map(c => (typeof c?.text === "string" ? c.text : "")) : [])).join("").trim();
}
// Metindeki ilk geçerli JSON nesnesi (model JSON'un etrafına açıklama/atıf yazsa da)
function parseJSONLoose(t) {
  const g = t.match(/\{[\s\S]*\}/);
  if (g) try { return JSON.parse(g[0]); } catch {}
  for (const m of t.match(/\{[^{}]*\}/g) || []) try { return JSON.parse(m); } catch {}
  return null;
}

// Grok'a X'te arama yaptırıp metin cevabı al. max_turns = arama turu tavanı (xAI gönderi başına ücretlendirir → sınırlı tut).
async function grokX(prompt, { timeout = 45000, days = 3, maxTurns = 2 } = {}) {
  const from = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);   // YYYY-MM-DD (doküman: başka format uygulanmaz)
  const r = await postJSON("https://api.x.ai/v1/responses", { Authorization: "Bearer " + XAI_KEY }, {
    model: XAI_MODEL,
    input: [{ role: "user", content: prompt }],
    tools: [{ type: "x_search", from_date: from }],
    max_turns: maxTurns,
  }, timeout);
  return { ok: r.ok, status: r.status, json: r.json, text: respText(r.json), posts: r.json?.usage?.server_side_tool_usage_details?.x_posts_fetched, err: r.ok ? "" : errMsg(r) };
}

// Son Grok hatası (kullanıcıya gösterilir: /yorum ve günlük AI yorumu). Eskiden yalnız konsola yazılıyordu →
// Telegram'da "geçici sorun" görünüyor, anahtar/model/kota hatası anlaşılmıyordu.
let _grokErr = "";
export const grokLastError = () => _grokErr;

// Grok: X (Twitter) aramasıyla bir BIST hissesi hakkında son gönderilere göre duyarlılık + kısa yorum.
// Dönüş: { score:-2..2, label, ozet, uyari, posts } | null   (posts = xAI'nin okuduğu X gönderisi sayısı → arama gerçekten yapıldı mı)
export async function grokXSentiment(symbol, timeout = 45000) {
  _grokErr = "";
  if (!XAI_KEY) { _grokErr = "XAI_API_KEY secret'ı yok"; return null; }
  try {
    const g = await grokX(`Sen BIST odaklı, temkinli bir analistsin. X (Twitter) aramasıyla Borsa İstanbul hissesi ${symbol} hakkında son günlerin gönderilerini incele (${symbol}, $${symbol}, #${symbol} ve şirket adıyla ara). Nesnel duyarlılık değerlendir; pump/manipülasyon işaretlerine dikkat et. SADECE şu JSON'u döndür, başka metin yazma: {"score": -2..2 tam sayı, "label": "çok negatif|negatif|nötr|pozitif|çok pozitif", "ozet": "tek cümle Türkçe", "uyari": "manipülasyon/pump şüphesi kısa not, yoksa boş"}`, { timeout });
    if (!g.ok) { _grokErr = `HTTP ${g.status} · ${g.err}`; console.error(`[Grok] ${_grokErr}`); return null; }
    const o = parseJSONLoose(g.text);
    if (!o) { _grokErr = "cevapta JSON yok: " + (g.text || "(boş)").slice(0, 80); console.error("[Grok]", _grokErr); return null; }
    return { score: Math.max(-2, Math.min(2, Math.round(Number(o.score) || 0))), label: o.label || "nötr", ozet: o.ozet || "", uyari: o.uyari || "", posts: typeof g.posts === "number" ? g.posts : null };
  } catch (e) { _grokErr = e?.name === "AbortError" ? "zaman aşımı (45 sn)" : (e?.message || String(e)); console.error("[Grok]", _grokErr); return null; }
}

// Gemini: serbest metin analiz/yorum (günlük portföy/aday yorumu). Dönüş: string | null
// Anahtar URL'de değil başlıkta (x-goog-api-key) → log/hata metnine sızmaz. Yeni Flash modelleri "düşünme" token'ı da
// harcadığı için çıktı tavanı geniş (500'de cevap boş dönebiliyordu); ücretsiz katmanda maliyet yok.
export async function geminiAdvise(prompt, timeout = 30000) {
  if (!GEMINI_KEY) return null;
  try {
    const r = await postJSON(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, { "x-goog-api-key": GEMINI_KEY },
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } }, timeout);
    if (!r.ok) { console.error(`[Gemini] HTTP ${r.status} · ${errMsg(r)}`); return null; }
    const t = r.json?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    return t.trim() || null;
  } catch (e) { console.error("[Gemini]", e.message); return null; }
}

// TEŞHİS (/aitest): her anahtarın GERÇEK kullanım yolunu dener (Grok'ta X araması dahil — eskiden sadece "hi" deniyordu,
// X araması bozukken bile "OK" diyordu). Format beklenmedikse ne geldiğini yazar (düzeltmek için).
export async function llmDiag() {
  const out = { geminiModel: GEMINI_MODEL, grokModel: XAI_MODEL };
  if (!GEMINI_KEY) out.gemini = "secret YOK (repo Secrets → GEMINI_API_KEY)";
  else try {
    const r = await postJSON(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, { "x-goog-api-key": GEMINI_KEY },
      { contents: [{ parts: [{ text: "Tek kelimeyle cevap ver: merhaba" }] }], generationConfig: { maxOutputTokens: 2048 } }, 25000);
    const t = r.json?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || "";
    out.gemini = r.ok ? (t ? "OK ✓" : "HTTP 200 ama metin yok (finish: " + (r.json?.candidates?.[0]?.finishReason || "?") + ")") : `HTTP ${r.status} · ${errMsg(r)}`;
  } catch (e) { out.gemini = "ERR " + e.message; }
  if (!XAI_KEY) out.grok = "secret YOK (repo Secrets → XAI_API_KEY)";
  else try {
    const g = await grokX("X'te THYAO (Türk Hava Yolları hissesi) hakkında son günün en dikkat çekici gönderisini tek cümleyle Türkçe özetle.", { days: 1, maxTurns: 1 });
    out.grok = !g.ok ? `HTTP ${g.status} · ${g.err}`
      : g.text ? `OK ✓ X araması çalışıyor${g.posts != null ? ` (${g.posts} gönderi)` : ""}`
      : `HTTP 200 ama metin okunamadı — alanlar: ${Object.keys(g.json || {}).join(",")} · output: ${(g.json?.output || []).map(o => o?.type).join(",")}`.slice(0, 200);
  } catch (e) { out.grok = "ERR " + e.message; }
  return out;
}
