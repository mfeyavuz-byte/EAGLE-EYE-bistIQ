#!/usr/bin/env node
// EAGLE EYE bistIQ — otonom tarayıcı
// Uygulamanın kullandığı AYNI MCP sunucusunu çağırır, sinyalleri Telegram'a iter.
// Bağımlılık yok (Node 20+ global fetch). GitHub Actions cron ile çalışır.

const MCP = "https://borsamcp.fastmcp.app/mcp";

const TG_TOKEN = process.env.TG_TOKEN || "";
const TG_CHAT  = process.env.TG_CHAT  || "";
const INDEX    = process.env.INDEX    || "XU100";
const PRESETS  = (process.env.PRESETS || "bullish_momentum,oversold").split(",").map(s => s.trim()).filter(Boolean);
const TF       = process.env.TF       || "1d";
const TOP_N    = +(process.env.TOP_N  || 8);
// Opsiyonel: aynı sinyali tekrar bildirmemek için Gist hafızası
const GIST_TOKEN = process.env.GH_GIST_TOKEN || "";
const GIST_ID    = process.env.GIST_ID || "";
const STATE_FILE = "eagle_bot_state.json";

const PRESET_LABEL = {
  oversold: "Aşırı Satım (Dip)", overbought: "Aşırı Alım (Tepe)",
  bullish_momentum: "Yükseliş Momentumu", bearish_momentum: "Düşüş Momentumu",
  supertrend_bullish: "Trend AL (Supertrend)", t3_bullish: "T3 AL Sinyali",
  high_volume: "Yüksek Hacim",
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callMCP(tool, args, timeout = 20000) {
  const delays = [0, 1500, 3000];
  let lastReason = "";
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await sleep(delays[i]);
    const r = await mcpOnce(tool, args, timeout + i * 2000);
    if (!r._retry) return r;
    lastReason = r._reason;
  }
  return { error: "MCP 3 denemede yanıt vermedi · " + lastReason };
}

async function mcpOnce(tool, args, timeout) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(MCP, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "Accept": "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: tool, arguments: args } }),
    });
    clearTimeout(tid);
    if (!res.ok) return { _retry: true, _reason: "HTTP " + res.status };
    const text = await res.text();
    if (!text || text.length < 10) return { _retry: true, _reason: "boş yanıt" };
    const dataLine = text.split("\n").find(l => l.startsWith("data:"));
    if (!dataLine) return { _retry: true, _reason: "SSE data yok" };
    let obj;
    try { obj = JSON.parse(dataLine.slice(5)); }
    catch (e) { return { _retry: true, _reason: "JSON parse: " + e.message }; }
    if (obj.error) return { error: obj.error.message || JSON.stringify(obj.error) };
    const inner = obj.result?.content?.[0]?.text;
    if (!inner) return { error: "içerik yok" };
    try { return JSON.parse(inner); } catch { return { raw: inner }; }
  } catch (e) {
    clearTimeout(tid);
    return { _retry: true, _reason: e.name === "AbortError" ? "timeout" : e.message };
  }
}

async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT) { console.log("TG yapılandırılmamış, atlanıyor."); return false; }
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text, disable_web_page_preview: true }),
  });
  if (!res.ok) console.error("Telegram hata:", res.status, await res.text().catch(() => ""));
  return res.ok;
}

async function loadState() {
  if (!GIST_TOKEN || !GIST_ID) return { sent: {} };
  try {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: "Bearer " + GIST_TOKEN, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) return { sent: {} };
    const g = await r.json();
    const content = g.files?.[STATE_FILE]?.content;
    return content ? JSON.parse(content) : { sent: {} };
  } catch { return { sent: {} }; }
}

async function saveState(state) {
  if (!GIST_TOKEN || !GIST_ID) return;
  try {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + GIST_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ files: { [STATE_FILE]: { content: JSON.stringify(state) } } }),
    });
  } catch (e) { console.error("Gist kaydedilemedi:", e.message); }
}

function fmtStock(s, i) {
  const sym = s.symbol || s.name || "?";
  const px  = s.close != null ? ` ${s.close}₺` : "";
  const rsi = s.rsi != null ? ` · RSI ${(+s.rsi).toFixed(0)}` : "";
  const chg = s.change != null ? ` · %${(+s.change).toFixed(2)}` : "";
  return `${i + 1}. ${sym}${px}${rsi}${chg}`;
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const state = await loadState();
  state.sent = state.sent || {};
  const dayKey = `${today}`;
  const alreadySent = new Set(state.sent[dayKey] || []);

  const blocks = [];
  let freshCount = 0;

  for (const preset of PRESETS) {
    const res = await callMCP("scan_stocks", { index: INDEX, preset, timeframe: TF });
    if (res.error) { console.error(`[${preset}]`, res.error); continue; }
    const stocks = res.stocks || res.data?.stocks || [];
    if (!stocks.length) { console.log(`[${preset}] sinyal yok`); continue; }

    const top = stocks.slice(0, TOP_N);
    const fresh = top.filter(s => !alreadySent.has(`${preset}:${s.symbol || s.name}`));
    freshCount += fresh.length;
    top.forEach(s => alreadySent.add(`${preset}:${s.symbol || s.name}`));

    const label = PRESET_LABEL[preset] || preset;
    const marker = fresh.length ? "🆕" : "";
    blocks.push(`📊 ${label} ${marker}\n` + top.map(fmtStock).join("\n"));
  }

  if (!blocks.length) {
    console.log("Hiç sinyal yok, mesaj atılmadı.");
    return;
  }

  // Gist dedup açıksa ve yeni sinyal yoksa spam yapma
  if ((GIST_TOKEN && GIST_ID) && freshCount === 0) {
    console.log("Yeni sinyal yok (hepsi bugün gönderilmiş), mesaj atılmadı.");
    return;
  }

  const header = `🦅 EAGLE EYE bistIQ — ${INDEX}\n${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}\n`;
  const footer = `\n⚠ Yatırım tavsiyesi değildir · ~15dk gecikmeli olabilir`;
  const msg = header + "\n" + blocks.join("\n\n") + footer;

  const ok = await sendTG(msg);
  console.log(ok ? `Gönderildi (${freshCount} yeni sinyal).` : "Gönderilemedi.");

  state.sent = { [dayKey]: [...alreadySent] }; // sadece bugünü tut
  await saveState(state);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
