// Haber çekici — Node'dan RSS kaynaklarını DOĞRUDAN çeker (CORS proxy yok, sunucuda gerek yok).
// Tarayıcıdaki proxy'ler güvenilmez olduğu için bot haberleri çekip Gist'e yazar, app oradan da okur.
const UA = { "User-Agent": "Mozilla/5.0 (compatible; EagleBot/1.0)" };

const SOURCES = [
  { id: "hur-eko", name: "Hürriyet Eko.", url: "https://www.hurriyet.com.tr/rss/ekonomi" },
  { id: "mil-eko", name: "Milliyet Eko.", url: "https://www.milliyet.com.tr/rss/rssNew/ekonomiRss.xml" },
  { id: "dunya", name: "Dünya Gazetesi", url: "https://www.dunya.com/rss" },
  { id: "bloomberg", name: "BloombergHT", url: "https://www.bloomberght.com/rss" },
  { id: "cnn-eko", name: "CNN Türk Eko.", url: "https://www.cnnturk.com/feed/rss/ekonomi/news" },
  { id: "sabah", name: "Sabah Eko.", url: "https://www.sabah.com.tr/rss/ekonomi.xml" },
  { id: "bbc-tr", name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml" },
  { id: "trt", name: "TRT Haber", url: "https://www.trthaber.com/sondakika.rss" },
];

const clean = s => (s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/&#\d+;/g, " ")
  .replace(/\s+/g, " ").trim();

function parseRSS(xml, src) {
  const out = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const it of items.slice(0, 15)) {
    const tag = t => { const m = it.match(new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">", "i")); return m ? clean(m[1]) : ""; };
    const title = tag("title");
    if (title && title.length >= 10) {
      out.push({ id: src.id + ":" + title.slice(0, 50), source: src.name, sourceId: src.id,
        title, link: tag("link"), date: tag("pubDate") || tag("date") || "", desc: tag("description").slice(0, 200) });
    }
  }
  return out;
}

async function fetchOne(src) {
  try {
    const ctrl = new AbortController(), tid = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(src.url, { headers: UA, signal: ctrl.signal, redirect: "follow" });
    clearTimeout(tid);
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRSS(xml, src);
  } catch { return []; }
}

export async function fetchNews() {
  const all = [];
  const batches = await Promise.allSettled(SOURCES.map(fetchOne));
  batches.forEach(b => b.status === "fulfilled" && all.push(...b.value));
  // dedup + sort (yeni → eski)
  const seen = new Set();
  const dedup = all.filter(n => { const k = n.title.toLowerCase().slice(0, 70); return seen.has(k) ? false : (seen.add(k), true); });
  dedup.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  return dedup.slice(0, 80);
}
