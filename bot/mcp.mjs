// Sunucu-tarafı MCP istemcisi (BorsaMCP).
// 2026-11: eski adres (borsamcp.fastmcp.app) emekliye ayrıldı; kendi notuna göre borsa.surucu.dev/mcp'ye taşındı
// (kullanıcı onayıyla geçildi). Yeni sunucu JSON yerine kompakt METİN döndürüyor: "anahtar: değer" satırları,
// "## bölüm" başlıkları ve ```tsv tabloları → parseMcpText bunu eski JSON şekline çevirir; JSON gelirse aynen okunur.
// Bot Node'da çalışır → CORS yok. FAIL-SAFE: her hata/timeout/şema sorununda null döner; ASLA çağıranı patlatmaz.
const MCP_URL = "https://borsa.surucu.dev/mcp";

const val = v => {
  const s = v.trim();
  if (/^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(s)) return +s;
  if (s === "null" || s === "None") return null;
  if (s === "true" || s === "false") return s === "true";
  return s;
};
// "## bölüm" → alt nesne (alanları ayrıca üst seviyeye de kopyalanır: ör. next_earnings_date), ```tsv → nesne dizisi.
export function parseMcpText(t) {
  const out = {}; let sec = null, tsv = null;
  for (const line of String(t).split(/\r?\n/)) {
    if (tsv) {
      if (line.trim().startsWith("```")) { out[tsv.key] = tsv.rows; tsv = null; sec = null; continue; }   // tablo sonrası alanlar üst seviyeye
      if (!line.trim()) continue;
      const cells = line.split("\t");
      if (!tsv.head) tsv.head = cells.map(c => c.trim());
      else tsv.rows.push(Object.fromEntries(tsv.head.map((h, i) => [h, val(cells[i] ?? "")])));
      continue;
    }
    const h = line.match(/^##\s+(.+?)\s*$/);
    if (h) { sec = h[1]; continue; }
    if (/^```tsv\s*$/.test(line.trim())) { tsv = { key: sec || "rows", head: null, rows: [] }; continue; }
    const m = line.match(/^([A-Za-z_][\w.]*)\s*:\s?(.*)$/);
    if (!m) continue;
    const k = m[1], v = val(m[2]);
    if (sec) {
      if (!out[sec] || typeof out[sec] !== "object" || Array.isArray(out[sec])) out[sec] = {};
      out[sec][k] = v; if (!(k in out)) out[k] = v;
    } else out[k] = v;
  }
  if (tsv) out[tsv.key] = tsv.rows;   // kapanmamış tablo
  return out;
}

// Sunucu tek sonuçlu tabloyu dizi yerine NESNE döndürebiliyor (ör. supertrend 1 hisse) → her zaman dizi.
export const mcpRows = (r, key = "stocks") => { const v = r?.[key] ?? r?.data; return Array.isArray(v) ? v : v && typeof v === "object" && v.symbol ? [v] : []; };
// Analist özeti: tekli istekte nesne, TOPLU istekte JSON metni ("summary": "{...}") → nesne
export const anSummary = x => { let s = x?.summary; if (typeof s === "string") { try { s = JSON.parse(s); } catch { s = null; } } return s && typeof s === "object" && s.consensus ? s : null; };
// SAĞLIK: bu çalışmadaki MCP çağrılarının özeti (raporda "sunucu yanıt vermiyor" uyarısı için). 2026-11-28: sunucu 503 "no available server".
export const mcpHealth = { calls: 0, fails: 0, last: "" };
export async function mcpCall(name, args, timeout = 9000) {
  mcpHealth.calls++;
  const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(MCP_URL, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    });
    if (!r.ok) { mcpHealth.fails++; mcpHealth.last = "HTTP " + r.status; return null; }
    const txt = await r.text();
    // SSE: "data: {...}" satırını ayıkla
    const line = txt.split("\n").map(s => s.replace(/^data:\s*/, "").trim()).find(s => s.startsWith("{"));
    if (!line) return null;
    const j = JSON.parse(line);
    if (j?.result?.isError) return null;
    const t = j?.result?.content?.[0]?.text;
    if (!t) return null;
    try { return JSON.parse(t); } catch { return parseMcpText(t); }
  } catch (e) { mcpHealth.fails++; mcpHealth.last = e?.name === "AbortError" ? "zaman aşımı" : "ağ hatası"; return null; }
  finally { clearTimeout(tid); }   // sayaç gövde okunana kadar açık (takılma = sonsuz bekleme olmasın)
}
