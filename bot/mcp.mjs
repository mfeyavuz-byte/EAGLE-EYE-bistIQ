// Sunucu-tarafı MCP istemcisi (borsamcp.fastmcp.app).
// Bot Node'da çalışır → CORS yok (tarayıcıdaki "Failed to fetch" buradan olmaz).
// FAIL-SAFE: her hata/timeout/şema sorununda null döner; ASLA çağıranı patlatmaz.
const MCP_URL = "https://borsamcp.fastmcp.app/mcp";

export async function mcpCall(name, args, timeout = 9000) {
  const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(MCP_URL, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }),
    });
    clearTimeout(tid);
    if (!r.ok) return null;
    const txt = await r.text();
    // SSE: "data: {...}" satırını ayıkla
    const line = txt.split("\n").map(s => s.replace(/^data:\s*/, "").trim()).find(s => s.startsWith("{"));
    if (!line) return null;
    const j = JSON.parse(line);
    if (j?.result?.isError) return null;
    const t = j?.result?.content?.[0]?.text;
    return t ? JSON.parse(t) : null;
  } catch { clearTimeout(tid); return null; }
}
