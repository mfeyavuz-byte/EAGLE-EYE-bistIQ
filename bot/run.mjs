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

async function runPaper(signals, xuNow) {
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

  // --- AÇMA: en güçlü + en yüksek potansiyelli AL sinyalleri ---
  // Sizing: güvene göre %10-%30. Seçim: güven + hedefe yükseliş potansiyeli (en iyi önce).
  const MAX_POS = 5;
  const sizePct = c => c >= 85 ? 0.30 : c >= 70 ? 0.20 : 0.10;   // %10–%30
  const upside = s => (s.target1 && s.price) ? (s.target1 - s.price) / s.price * 100 : 0;
  const equity = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * ((scanMap[s]?.price) || p.entry), 0);
  const ddOK = !st.dayStart || (equity - st.dayStart) / st.dayStart > -0.03;
  const candidates = signals.filter(s => s.signal === "AL" && !st.pos[s.sym])
    .map(s => ({ ...s, _score: (s.confidence || 0) + upside(s) * 0.6 }))   // güç + potansiyel
    .sort((a, b) => b._score - a._score);
  for (const sig of candidates) {
    if (Object.keys(st.pos).length >= MAX_POS || !ddOK) break;
    const conf = sig.confidence || 0, j = sig.price, up = upside(sig);
    const Q = Math.floor(equity * sizePct(conf) / j);              // portföyün %10–%30'u
    if (Q > 0 && Q * j <= st.cash) {
      st.cash -= Q * j;
      const sl = sig.stopLoss || +(j * 0.99).toFixed(2), tp = sig.target1 || +(j * 1.04).toFixed(2);
      st.pos[sig.sym] = { lot: Q, entry: j, date: today, sl, tp, peak: 0 };
      opened.push(`📈 ${sig.sym} · ${Q} lot @ ${j}₺ (%${Math.round(sizePct(conf) * 100)} portföy) · güven %${conf} · potansiyel %${up.toFixed(1)} · stop ${sl} · hedef ${tp}`);
    }
  }

  const newDay = st.dayKey !== today;
  if (newDay) st.dayStart = equity;        // yeni gün: günlük drawdown referansını sıfırla
  st.dayKey = today;
  st.trades = st.trades.slice(0, 300);
  // Aç/kapat'ları saatlik rapora kadar biriktir (her run anlık mesaj atmaz, saat başı rapor eder)
  st.hourOpens = (st.hourOpens || []).concat(opened);
  st.hourCloses = (st.hourCloses || []).concat(closed);
  await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
  return st;
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

  // Her run: tara + pozisyon yönet (sessiz, state'e biriktir). Mesaj saat başı gider.
  let st = null;
  if (GIST_ID && GIST_TOKEN) {
    st = await runPaper(signals, xuNow);
  } else {
    console.log("⚠ Gist yok — AI TRADER atlandı (state kalıcı olmadan paper trading her çalışmada sıfırlanır). GH_GIST_TOKEN + GIST_ID secret'larını ekle.");
  }

  // ---------- SAAT BAŞI RAPOR (her saat 1 kez; tarama 20+ kez/gün ama mesaj saatlik) ----------
  const istHour = +new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", hour: "2-digit", hour12: false });
  const manual = process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
  const doReport = !st || manual || st.lastReportHour !== istHour;
  let sent = 0;

  if (doReport) {
    // 1) HİSSE TARA — güncel en güçlü AL/SAT
    const al = signals.filter(s => s.signal === "AL").slice(0, 15), sa = signals.filter(s => s.signal === "SAT").slice(0, 15);
    const f = s => `${s.sym} %${s.confidence} @${s.price}₺ · stop ${s.stopLoss} · hedef ${s.target1}`;
    let m1 = "🦅 EAGLE EYE — HİSSE TARA (motor)\n" + fmtTime();
    if (al.length) m1 += `\n\n📈 EN GÜÇLÜ AL (${al.length}):\n` + al.map(f).join("\n");
    if (sa.length) m1 += `\n\n📉 SAT (${sa.length}):\n` + sa.map(f).join("\n");
    m1 += "\n\n⚠ Yatırım tavsiyesi değildir · ~15dk gecikmeli olabilir.";
    await sendTG(m1); sent++; await sleep(400);

    // 2) AI TRADER durumu (saatlik): yeni pozisyon?, açık pozisyonlar + açılıştan beri K/Z
    if (st) {
      const priceOf = s => signals.find(x => x.sym === s)?.price || st.pos[s]?.last || st.pos[s]?.entry;
      const eq = st.cash + Object.entries(st.pos).reduce((a, [s, p]) => a + p.lot * priceOf(s), 0);
      const portRet = (eq - st.start) / st.start * 100;
      const idxRet = (st.xuStart && xuNow) ? (xuNow - st.xuStart) / st.xuStart * 100 : null;
      const rel = idxRet != null ? portRet - idxRet : null;
      const openLines = Object.entries(st.pos).map(([s, p]) => {
        const cur = priceOf(s), pr = (cur - p.entry) / p.entry * 100;
        return `• ${s} ${p.lot} lot · giriş ${p.entry}₺ → ${cur}₺ · K/Z ${pr >= 0 ? "+" : ""}${pr.toFixed(1)}%`;
      });
      const ho = st.hourOpens || [], hc = st.hourCloses || [];
      let m2 = `📊 AI TRADER — DURUM\n${fmtTime()}\n`;
      m2 += `\n🆕 Bu saat: ${ho.length ? ho.length + " yeni pozisyon açıldı" : "yeni pozisyon açılmadı"}`;
      if (ho.length) m2 += "\n" + ho.join("\n");
      if (hc.length) m2 += `\n\n✅ Bu saat ${hc.length} kapanış:\n` + hc.join("\n");
      m2 += `\n\n📌 Açık pozisyonlar (${openLines.length}/5) — açılıştan beri K/Z:\n` + (openLines.join("\n") || "yok");
      m2 += `\n\n💼 Değer: ${Math.round(eq).toLocaleString("tr-TR")}₺ · Nakit: ${Math.round(st.cash).toLocaleString("tr-TR")}₺`;
      m2 += `\n📈 Toplam getiri: ${portRet >= 0 ? "+" : ""}${portRet.toFixed(2)}%`;
      if (idxRet != null) {
        m2 += `\n🏛 XU100: ${idxRet >= 0 ? "+" : ""}${idxRet.toFixed(2)}%`;
        m2 += `\n⚖️ Endekse relatif: ${rel >= 0 ? "+" : ""}${rel.toFixed(2)}% ${rel >= 0 ? "✅ üstünde" : "🔻 altında"}`;
      }
      await sendTG(m2); sent++; await sleep(400);
      // raporu kaydet: bu saati işaretle, saatlik birikimi sıfırla
      st.lastReportHour = istHour; st.hourOpens = []; st.hourCloses = [];
      await gistPut({ [PAPER_FILE]: { content: JSON.stringify(st) } });
      console.log(`Rapor gönderildi · değer ~${Math.round(eq)}₺ · getiri ${portRet.toFixed(2)}% · poz ${openLines.length}`);
    }
  } else {
    console.log(`Saat ${istHour} raporu zaten gönderildi — sessiz tarama/yönetim. Birikim: ${(st.hourOpens || []).length} açılış, ${(st.hourCloses || []).length} kapanış.`);
  }

  console.log(`${sent} Telegram mesajı gönderildi. Toplam ${((Date.now() - t0) / 1e3).toFixed(1)}s`);
}
main().catch(e => { console.error("FATAL:", e); process.exit(1); });
