// LLM katmanı — Grok (xAI, X/Twitter canlı arama) + Gemini (Google).
// FAIL-SAFE: anahtar yoksa veya hata/timeout olursa null döner; ASLA çağıranı patlatmaz.
// Anahtarlar GitHub secret: XAI_API_KEY, GEMINI_API_KEY. Model override: XAI_MODEL, GEMINI_MODEL.
const XAI_KEY = process.env.XAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const XAI_MODEL = process.env.XAI_MODEL || "grok-4";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export const llmEnabled = () => !!(XAI_KEY || GEMINI_KEY);
export const grokEnabled = () => !!XAI_KEY;
export const geminiEnabled = () => !!GEMINI_KEY;

// Grok: X (Twitter) canlı aramasıyla bir BIST hissesi hakkında son gönderilere göre duyarlılık + kısa yorum.
// Dönüş: { score:-2..2, label, ozet, uyari } | null
export async function grokXSentiment(symbol, timeout = 22000) {
  if (!XAI_KEY) return null;
  const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + XAI_KEY },
      body: JSON.stringify({
        model: XAI_MODEL,
        search_parameters: { mode: "on", sources: [{ type: "x" }], max_search_results: 20 },
        temperature: 0.2,
        messages: [
          { role: "system", content: "Sen BIST odaklı, temkinli bir analistsin. X (Twitter) gönderilerine dayanarak nesnel duyarlılık değerlendir; pump/manipülasyon işaretlerine dikkat et. Sadece istenen JSON'u döndür." },
          { role: "user", content: `Borsa İstanbul hissesi ${symbol} hakkında son X gönderilerini incele. SADECE şu JSON: {"score": -2..2 tam sayı, "label": "çok negatif|negatif|nötr|pozitif|çok pozitif", "ozet": "tek cümle Türkçe", "uyari": "manipülasyon/pump şüphesi kısa not, yoksa boş"}` },
        ],
      }),
    });
    clearTimeout(tid);
    if (!r.ok) return null;
    const j = await r.json();
    const txt = j?.choices?.[0]?.message?.content || "";
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const o = JSON.parse(m[0]);
    return { score: Number(o.score) || 0, label: o.label || "nötr", ozet: o.ozet || "", uyari: o.uyari || "" };
  } catch { clearTimeout(tid); return null; }
}

// Gemini: serbest metin analiz/yorum (günlük portföy/aday yorumu). Dönüş: string | null
export async function geminiAdvise(prompt, timeout = 22000) {
  if (!GEMINI_KEY) return null;
  const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 500 } }),
    });
    clearTimeout(tid);
    if (!r.ok) return null;
    const j = await r.json();
    const t = j?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "";
    return t.trim() || null;
  } catch { clearTimeout(tid); return null; }
}
