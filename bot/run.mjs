#!/usr/bin/env node
// EAGLE EYE — Otonom motor botu (bulutta, cihaz gerekmez)
// 1) 197 BIST hissesini UYGULAMANIN KENDİ MOTORUYLA tarar (getSignals) -> AL/SAT -> Telegram
// 2) AI TRADER sanal portföyünü yönetir (aç/kapat, TP/SL/trailing) -> Telegram
// State Gist'te (feybot_paper.json). Bağımlılıksız (Node 20+ ESM).

import { getSignals, enrichData, getHigherTrend } from "./engine.mjs";
import { fetch15m, fetchDaily, fetchIndexClose } from "./data.mjs";
import { fetchNews } from "./news.mjs";
import syms from "./symbols.json" with { type: "json" };
import SECTORS from "./sectors.json" with { type: "json" };

const TG_TOKEN = process.env.TG_TOKEN || "";
const TG_CHAT  = process.env.TG_CHAT  || "";
const GIST_TOKEN = process.env.GH_GIST_TOKEN || "";
const GIST_ID    = process.env.GIST_ID || "";
const PAPER_FILE = "feybot_paper.json";
const SENT_FILE  = "eagle_sent.json";
const CONC = +(process.env.CONC || 8);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const fmtTime = () => new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
const sectorOf = sym => Object.entries(SECTORS).find(([, ss]) => ss.includes(sym))?.[0];

// ---------- Telegram ----------
async function sendTG(text) {
  if (!TG_TOKEN || !TG_CHAT) { console.log("[TG] yapılandırılmamış"); return false; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT, text, disable_web_page_preview: true }),
    });
    if (!r.ok) console.error("[TG] hata", r.status, (await r.text().catch(() => "")).slice(0, 120));
    return r.ok;
  } catch (e) { console.error("[TG]", e.message); return false; }
}

// ---------- Gist state ----------
async function gistGet(file, fallback) {
  if (!GIST_TOKEN || !GIST_ID) return fallback;
  try {
    const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: "Bearer " + GIST_TOKEN, Accept: "application/vnd.github+json" },
    });
    if (!r.ok) return fallback;
    const g = await r.json();
    const c = g.files?.[file]?.content;
    return c ? JSON.parse(c) : fallback;
  } catch { return fallback; }
}
async function gistPut(files) {
  if (!GIST_TOKEN || !GIST_ID) return;
  try {
    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + GIST_TOKEN, "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    });
  } catch (e) { console.error("[Gist] kaydedilemedi:", e.message); }
}

// ---------- Tarama (motor) ----------
async function scanOne(sym) {
  const s = await fetch15m(sym);
  if (s.length < 20) return null;
  const d = s[s.length - 1];
  if (s.slice(-5).reduce((a, b) => a + (b.volume || 0), 0) / 5 * (d?.close || 0) < 1e5) return null;
  const y = await fetchDaily(sym);
  const k = getSignals(enrichData(s), getHigherTrend(y), y);
  if (!k || k.final === "NÖTR" || k.confidence < 50) return null;
  return { sym, signal: k.final, confidence: k.confidence, price: d.close,
           stopLoss: k.stopLoss, target1: k.target1, mod: k.mod };
}
async function scanAll() {
  const out = [];
  for (let i = 0; i < syms.length; i += CONC) {
    const r = await Promise.all(syms.slice(i, i + CONC).map(s => scanOne(s).catch(() => null)));
    r.forEach(x => x && out.push(x));
  }
  out.sort((a, b) => a.signal !== b.signal ? (a.signal === "AL" ? -1 : 1) : b.confidence - a.confidence);
  return out;
}

// ---------- AI TRADER (paper trading) ----------
async function currentPrice(sym, scanMap) {
  if (scanMap[sym]) return scanMap[sym].price;
  const s = await fetch15m(sym);
  return s.length ? s[s.length - 1].close : null;
}

async function runPaper(signals, notify, xuNow) {
  const today = new Date().toISOString().slice(0, 10);
  let st = await gistGet(PAPER_FILE, null);
  if (!st || typeof st.cash !== "number") st = { cash: 1e5, start: 1e5, pos: {}, trades: [], dayKey: today, dayStart: 1e5, startDate: today, xuStart: xuNow || null };
  st.pos = st.pos || {}; st.trades = st.trades || [];
  if (!st.xuStart && xuNow) st.xuStart = xuNow;   // endeks başlangıcı (relatif getiri için)
  const scanMap = Object.fromEntries(signals.map(s => [s.sym, s]));
  const satSet = new Set(signals.filter(s => s.signal === "SAT").map(s => s.sym));
  const opened = [], closed = [];

  // --- KAPAMA: TP/SL/trailing + SAT sinyali ---
  for (const [sym, ps] of Object.entries({ ...st.pos })) {
    const cur = await currentPrice(sym, scanMap);
    if (cur == null || !isFinite(cur)) continue;
    ps.last = cur;   // güncel fiyatı pozisyona yaz (performans/valuation için)
    const pct = (cur - ps.entry) / ps.entry;
    if (pct >= 0.02) { const np = Math.max(ps.peak || 0, cur); if (np > (ps.peak || 0)) ps.peak = np; }
    const trailLv = ps.peak ? +(ps.peak * 0.985).toFixed(2) : null;
    const hitSL = ps.sl && cur <= ps.sl, hitTP = ps.tp && cur >= ps.tp, hitTS = !!trailLv && cur <= trailLv;
    const hitSIG = satSet.has(sym);
    if (hitSL || hitTP || hitTS || hitSIG) {
      const reason = hitSL ? "SL" : hitTS ? "TS" : hitTP ? "TP" : "SIG";
      const label = { SL: "Zarar Durdur", TS: "Trailing Stop", TP: "Hedef", SIG: "SAT sinyali" }[reason];
      const pnl = +((cur - ps.entry) * ps.lot).toFixed(0), pnlPct = +(pct * 100).toFixed(2);
      st.cash += ps.lot * cur;
      st.trades.unshift({ sym, entry: ps.entry, exit: cur, lot: ps.lot, pnl, pnlPct, open: ps.date, close: today, reason });
      delete st.pos[sym];
      closed.push(`${pct >= 0 ? "📈" : "📉"} ${sym} @ ${cur}₺ · ${label} · K/Z %${pnlPct} (${pnl >= 0 ? "+" : ""}${pnl}₺)`);
    }
  }

  // --- AÇMA: AL sinyalleri ---
  // Kural: pozisyon başına TOPLAM portföyün %10'u, toplam EN FAZLA 5 farklı hisse.
  const MAX_POS = 5, POS_PCT = 0.10;
  const equity = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * ((scanMap[s]?.price) || p.entry), 0);
  const ddOK = !st.dayStart || (equity - st.dayStart) / st.dayStart > -0.03;
  for (const sig of signals.filter(s => s.signal === "AL")) {
    if (Object.keys(st.pos).length >= MAX_POS) break;   // en fazla 5 pozisyon
    const sym = sig.sym;
    if (st.pos[sym] || !ddOK) continue;
    const conf = sig.confidence || 0;
    const j = sig.price;
    const Q = Math.floor(equity * POS_PCT / j);          // toplam portföyün %10'u
    if (Q > 0 && Q * j <= st.cash) {
      st.cash -= Q * j;
      const sl = sig.stopLoss || +(j * 0.99).toFixed(2), tp = sig.target1 || +(j * 1.04).toFixed(2);
      st.pos[sym] = { lot: Q, entry: j, date: today, sl, tp, peak: 0 };
      opened.push(`📈 ${sym} · ${Q} lot @ ${j}₺ · güven %${conf} · stop ${sl} · hedef ${tp}`);
    }
  }

  const newDay = st.dayKey !== today;
  if (newDay) st.dayStart = equity;        // yeni gün: günlük drawdown referansını sıfırla
  st.dayKey = today;
  st.trades = st.trades.slice(0, 300);
  await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
  if (closed.length) notify.push(`🤖 AI TRADER — ${closed.length} POZİSYON KAPANDI\n` + closed.join("\n"));
  if (opened.length) notify.push(`🤖 AI TRADER — ${opened.length} POZİSYON AÇILDI\n` + opened.join("\n"));
  return st;
}

// ---------- HİSSE TARA AL/SAT bildirimi (dedup) ----------
async function notifyScan(signals, notify) {
  const today = new Date().toISOString().slice(0, 10);
  const sent = await gistGet(SENT_FILE, {});
  const k = sent.d === today ? sent.k || {} : {};
  const fresh = signals.filter(s => !k[s.signal + s.sym]);
  if (!fresh.length) { console.log("Yeni sinyal yok (dedup)."); return false; }
  fresh.forEach(s => k[s.signal + s.sym] = 1);
  await gistPut({ [SENT_FILE]: { content: JSON.stringify({ d: today, k }) } });
  const al = fresh.filter(s => s.signal === "AL"), sa = fresh.filter(s => s.signal === "SAT");
  const f = s => `${s.sym} %${s.confidence} @${s.price}₺ · stop ${s.stopLoss} · hedef ${s.target1}`;
  let m = "🦅 EAGLE EYE — HİSSE TARA (motor)\n" + fmtTime();
  if (al.length) m += `\n\n📈 AL (${al.length}):\n` + al.slice(0, 20).map(f).join("\n");
  if (sa.length) m += `\n\n📉 SAT (${sa.length}):\n` + sa.slice(0, 20).map(f).join("\n");
  m += "\n\n⚠ Yatırım tavsiyesi değildir · ~15dk gecikmeli olabilir.";
  notify.push(m);
  return true;
}

// ---------- Ana ----------
async function main() {
  const t0 = Date.now();
  console.log("Tarama başlıyor:", syms.length, "sembol");
  const signals = await scanAll();
  console.log(`Tarama bitti ${((Date.now() - t0) / 1e3).toFixed(1)}s · ${signals.length} sinyal (${signals.filter(s => s.signal === "AL").length} AL, ${signals.filter(s => s.signal === "SAT").length} SAT)`);

  const xuNow = await fetchIndexClose("XU100").catch(() => null);  // endeks (XU100) anlık

  // Haberleri çek ve Gist'e yaz (app proxy başarısız olursa oradan okur)
  if (GIST_ID && GIST_TOKEN) {
    try {
      const news = await fetchNews();
      if (news.length) {
        await gistPut({ "eagle_news.json": { content: JSON.stringify({ ts: Date.now(), items: news }) } });
        console.log(`Haber: ${news.length} başlık Gist'e yazıldı`);
      }
    } catch (e) { console.error("Haber hatası:", e.message); }
  }

  const notify = [];
  await notifyScan(signals, notify);          // HİSSE TARA AL/SAT
  let st = null;
  if (GIST_ID && GIST_TOKEN) {
    st = await runPaper(signals, notify, xuNow);   // AI TRADER aç/kapat (state Gist'te)
  } else {
    console.log("⚠ Gist yok — AI TRADER atlandı (state kalıcı olmadan paper trading her çalışmada sıfırlanır). GH_GIST_TOKEN + GIST_ID secret'larını ekle.");
  }

  // ---------- Portföy performans özeti (alım-satım, gün sonu, endeks-relatif) ----------
  if (st) {
    const priceOf = s => signals.find(x => x.sym === s)?.price || st.pos[s]?.last || st.pos[s]?.entry;
    const eq = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * priceOf(s), 0);
    const portRet = (eq - st.start) / st.start * 100;
    const idxRet = (st.xuStart && xuNow) ? (xuNow - st.xuStart) / st.xuStart * 100 : null;
    const rel = idxRet != null ? portRet - idxRet : null;
    const today = new Date().toISOString().slice(0, 10);
    const todayTrades = st.trades.filter(t => t.close === today);
    const wins = todayTrades.filter(t => t.pnl > 0).length;
    const openLines = Object.entries(st.pos).map(([s, p]) => {
      const cur = priceOf(s), pr = ((cur - p.entry) / p.entry * 100).toFixed(1);
      return `• ${s} ${p.lot} lot @ ${p.entry}₺ → ${cur}₺ (${pr >= 0 ? "+" : ""}${pr}%)`;
    });
    let perf = `📊 AI TRADER — PORTFÖY DURUMU\n${fmtTime()}\n`;
    perf += `\n💼 Değer: ${Math.round(eq).toLocaleString("tr-TR")}₺ · Nakit: ${Math.round(st.cash).toLocaleString("tr-TR")}₺`;
    perf += `\n📈 Toplam getiri: ${portRet >= 0 ? "+" : ""}${portRet.toFixed(2)}%`;
    if (idxRet != null) {
      perf += `\n🏛 XU100: ${idxRet >= 0 ? "+" : ""}${idxRet.toFixed(2)}%`;
      perf += `\n⚖️ Endekse relatif: ${rel >= 0 ? "+" : ""}${rel.toFixed(2)}% ${rel >= 0 ? "✅ üstünde" : "🔻 altında"}`;
    }
    if (todayTrades.length) perf += `\n🔁 Bugün ${todayTrades.length} kapanış · ${wins} kârlı`;
    perf += `\n\n📌 Açık pozisyonlar (${openLines.length}):\n` + (openLines.join("\n") || "yok");
    await sendTG(perf); await sleep(400);
    console.log(`Portföy: değer ~${Math.round(eq)}₺ · getiri ${portRet.toFixed(2)}% · endeks-relatif ${rel != null ? rel.toFixed(2) + "%" : "-"} · poz ${openLines.length}`);
  }

  // Telegram mesajlarını sırayla gönder
  for (const m of notify) { await sendTG(m); await sleep(400); }

  console.log(`${notify.length + (st ? 1 : 0)} Telegram mesajı gönderildi. Toplam ${((Date.now() - t0) / 1e3).toFixed(1)}s`);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
