// EAGLE EYE — ENDEKS TARA için CORS proxy (Cloudflare Worker, ücretsiz tier).
// borsamcp MCP'si tarayıcıya CORS header'ı vermiyor → bu Worker araya girip ekler.
//
// KURULUM:
// 1) dash.cloudflare.com → Workers & Pages → Create → Worker → bu kodu yapıştır → Deploy.
// 2) Verilen URL'i not al (ör. https://eagle-mcp.<hesabin>.workers.dev).
// 3) Bana o URL'i ver; Worker'ı curl'leyip doğrularım, sonra app'teki MCP URL'ini
//    "<worker-url>/mcp" ile değiştiririm (app'i kör değiştirmem).
//
// 100k istek/gün ücretsiz; günde birkaç yüz istek atarsın → sıfır maliyet.

const TARGET = "https://borsamcp.fastmcp.app";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, mcp-session-id, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

export default {
  async fetch(req) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const target = TARGET + url.pathname + url.search;
    let resp;
    try {
      resp = await fetch(target, {
        method: req.method,
        headers: req.headers,
        body: (req.method === "GET" || req.method === "HEAD") ? undefined : await req.arrayBuffer(),
      });
    } catch (e) {
      return new Response("proxy error: " + e, { status: 502, headers: CORS });
    }
    const h = new Headers(resp.headers);
    for (const [k, v] of Object.entries(CORS)) h.set(k, v);
    return new Response(resp.body, { status: resp.status, headers: h });
  },
};
