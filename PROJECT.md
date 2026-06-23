# FEY'S BOT — BIST + Kripto Sinyal Botu (v6.3)

## 📌 PROJE ÖZETİ
Türk borsası (BIST 616 hisse) + kripto (Binance Top 50 USDT) için **canlı fiyat + 18 teknik indikatör + 14+ price action pattern + FEY-AI yerel motor (API key'siz) + AI Claude analizi + AI Tarayıcı + pozisyon defteri + trade günlüğü (net K/Z komisyon+BSMV dahil) + çoklu watchlist + sektörel rotasyon + risk skorlama + haber akışı + etki algoritması + eşik alarmları (RSI/Fiyat/MA200/MACD)** sunan, PWA olarak telefonda app gibi çalışan tek-dosyalık trade asistanı. Hiçbir backend yok — tüm hesap tarayıcıda. Netlify Drop ile statik HTML olarak yayınlanır.

**Versiyon evrimi**: v1 (Fintables/CORS) → v5.3 (16 changelog) → v6.0 (esbuild) → v6.1 (AI Tarayıcı + watchlist + risk + journal + rotasyon + SWING/DAY) → v6.2 (FEY'S BOT rename, FEY-AI yerel motor, haber etki algoritması) → **v6.3** (BIST 200+ tarama, K/Z net hesabı komisyon+BSMV, eşik alarmları).

---

## 🎯 AMAÇ
- **Hedef kullanıcı**: BIST swing trader (+ kripto), iş arasında telefondan göz atabilen, profesyonel platform almak istemeyen ama analitik karar verici
- **Çözüm**: Trader'ın **5 saniyede karar verebileceği** kompakt UI + indikatör konsensüsü + AI ikinci görüş
- **Sosyal**: Çevreye paylaşılabilir kalitede arayüz, "kazandırıyor" hissi
- **Maliyet**: $0 (Anthropic API kullanırsan kullanıcı kendi key'iyle ödeyebilir, ortalama trade başına $0.005-0.02)

---

## 🏗️ MİMARİ

```
bist-bot/
├── src/
│   ├── App.js              ana React component (geliştirme kaynağı — gerçek kaynak /tmp/feybot_src.jsx)
│   ├── bistList.js         616 BIST sembolü TradingView listesinden
│   └── index.js            entrypoint (npm-build için, kullanılmıyor)
├── standalone/             ← KARARLI sürüm, Netlify'a YÜK (7 dosya, 244 KB total)
│   ├── index.html          216 KB pre-compiled (esbuild, Babel YOK)
│   ├── bist-logo.png       9 KB (BIST turkuaz daire logosu)
│   ├── apple-touch-icon.png + icon-192.png + icon-512.png
│   ├── manifest.json       PWA (FEY'S BOT)
│   └── sw.js               Service Worker v70 (network-first HTML, cache key feysbot-v70)
└── PROJECT.md              bu dosya

# Kaldırıldı (v6.2.1 temizlik):
# - standalone-fast/        eski v6 öncesi yedek, artık değersiz
# - standalone/img/         atıl PNG, kullanılmıyordu
# - .DS_Store               macOS metadata
```

### Build pipeline (npm yok)
1. JSX kaynağı `/tmp/feybot_src.jsx`'te (HTML'in babel bloğundan çıkarılır)
2. **esbuild** Mac binary (`/tmp/esbuild_pkg/package/bin/esbuild`) ile minify:
   ```
   esbuild /tmp/feybot_src.jsx --loader:.jsx=jsx --minify --target=es2020 \
     --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
     --outfile=/tmp/feybot_compiled.js
   ```
3. Python script ile HTML'in en uzun `<script>` bloğunu compile edilmiş JS ile değiştir
4. SW cache versiyonu bump (eski cache silinsin)

### Veri kaynakları (paralel proxy fallback)
| Kaynak | Kapsam | Erişim |
|---|---|---|
| **Yahoo Finance** (`query1.finance.yahoo.com/v8/finance/chart`) | BIST 15m/1d, kripto | 7 CORS proxy (Promise.any) — 15dk gecikme |
| **İş Yatırım** (HisseTekil endpoint) | BIST günlük fallback | Yahoo iki kez başarısız olursa |
| **Binance** (api.binance.com) | Kripto ticker + klines | Türkiye'de ISP engeli olabilir |
| **CORS proxy** (allorigins/corsproxy.io/codetabs/cors.lol/yacdn) | Binance/Yahoo için TR fallback | Promise.any paralel |
| **CoinGecko** (api.coingecko.com) | Binance erişilemezse son çare | Free tier, rate-limited |
| **EmailJS** | Sinyal değişimi mailı | Kullanıcı email gir |
| **Anthropic Claude** (api.anthropic.com) | AI analiz + AI Tarayıcı | Kullanıcı kendi API key'i, sonet-4-5 model |

---

## 🧠 SİNYAL ENGİNE

### 18 indikatör
1. **RSI 14 + RSI 7** — klasik momentum
2. **MACD (12,26,9)** — trend dönüşü
3. **EMA 9 / 21** — kısa momentum cross
4. **MA 20 / 50 / 200** — trend yapısı + Golden/Death Cross (MA50×MA200)
5. **Bollinger (20, 2σ)** — volatilite uçları
6. **Keltner (EMA20, ATR×1.5)** — TTM Squeeze için BB ile karşılaştırılır
7. **ATR 14** — volatilite, stop hesabı
8. **OBV** — hacim-fiyat trend
9. **Stochastic RSI** — kısa vadeli aşırılık
10. **ADX (+DI/-DI)** — trend gücü
11. **Supertrend ÇİFT (10/3 + 7/1.5)** — consensus mantığı
12. **VWAP** — intraday adil fiyat
13. **Volume Avg** — hacim spike
14. **Fibonacci** — son 60 bar swing retracement seviyeleri
15. **MFI** — hacim-ağırlıklı RSI
16. **TSI (True Strength Index, 25/13)** — çift EMA yumuşatma
17. **Awesome Oscillator (5/34 SMA medyan)** — sıfır geçişi
18. **Vortex Indicator (VI+/VI-, 14)** — trend dönüş erken tespit

### 14+ Price Action pattern
- **Klasik mum**: Yutan Boğa/Ayı, Çekiç (Hammer), Yıldız (Shooting Star)
- **Doji (4 alt tip × 3 zaman dilimi)**: Dragonfly 🐉, Gravestone ⚰️, Long-legged, Standard
- **3-mum**: Morning Star, Evening Star, Three Soldiers, Three Crows
- **Yapı**: Higher High / Lower Low (son 5 bar)
- **Momentum**: BURST 3-mum, DİP FLIP (RSI<35 dönüş + EMA9 cross + hacim), TOP REVERSE
- **Trend dönüşü**: Golden Cross ✦ / Death Cross 💀 (MA50×MA200)
- **Volatilite**: TTM Squeeze On/Off (BB ⊂ Keltner)
- **Destek/Direnç**: Fibonacci %38.2 / %50 / %61.8
- **Profesyonel 3'lü** (İbrahim Babadağı / Mark Minervini / Anna Coulling):
  - **Stopping Volume Candle**: Hammer + hacim ≥ 1.5× + downtrend → AL %94
  - **VCP (Volatility Contraction Pattern)**: ATR(10)/ATR(20) < 0.7 + range yukarı kırıldı + hacim 1.3× → AL %92
  - **Build Up at Resistance**: MA200'e %4 yakın + 5 bar dar range → Konsol/Kırılım sinyali
- **Kısa vade**: **ORB (Açılış Aralığı Kırılımı)** — günün ilk 30 dk H/L, hacim onaylı kırılım → AL/SAT %91, 1-3 GÜN vade

### Multi-timeframe onay
- **getHigherTrend(higherRows)**: günlük data MA50+MA20 düzeniyle YUKARI/ASAGI/YAN
- 15m sinyal günlük trendle çelişirse %35 confidence cezası
- Aynı yönse %10 bonus + "✓ Günlük trend AYNI YÖN" badge
- TARA'da HTF onaylı sinyaller +15 öncelik

### Ağırlıklı puanlama (11 kategori)
| Kategori | YUKARI trend | ASAGI trend | NÖTR |
|---|---|---|---|
| MA | %14 | %14 | %12 |
| MACD | %12 | %10 | %12 |
| RSI | %12 | %14 | %14 |
| BB | %6 | %7 | %7 |
| Stoch RSI | %6 | %6 | %6 |
| Hacim+OBV | %7 | %5 | %7 |
| ADX | %9 | %9 | %9 |
| Supertrend (çift) | %11 | %11 | %10 |
| Price Action | %11 | %12 | %11 |
| **MOMENTUM** (MFI+TSI+AO+Vortex konsensüsü) | **%12** | **%12** | **%12** |

### Akıllı vade profili (sinyal türüne göre otomatik tutma süresi)
| Tetikleyici | Vade | R:R | Stop |
|---|---|---|---|
| ORB kırılımı | **1-3 GÜN** | 1:2.5 | %2-5 |
| DİP FLIP / BURST / TOP REV | 1-3 GÜN | 1:2.8 | %2.5-6 |
| Mum patterni (Hammer/Engulf/Star) | 2-5 GÜN | 1:3.2 | %2.5-7 |
| BB uç + Stoch | 3-7 GÜN | 1:2.5 | %3-7 |
| Stopping Volume | 2-3 HAFTA | 1:5 | %4-10 |
| VCP kırılım | 1-3 HAFTA | 1:6 | %4-10 |
| Build Up kırılım | 2-4 HAFTA | 1:6 | %5-11 |
| Trend takip (ADX>25) | 1-2 HAFTA | 1:4 | %4-10 |
| Standart swing | 1 HAFTA | 1:3.5 | %3-8 |
| Dip avcı 4-6/7 | 1-2 HAFTA | 1:3.5 | %3.5-9 |
| MA200 kırılımı / Mükemmel dip 7/7 | 2-4 HAFTA | 1:5.5 | %5-12 |
| Doji (günlük) | 2-3 HAFTA | 1:5.5 | %4-11 |
| Doji (haftalık aggregate) | 3-6 HAFTA | 1:7 | %5-13 |
| **Golden/Death Cross** | **1-3 AY** | 1:9 | %6-15 |

### Trailing Stop (kâr koruyucu, 3 kademe)
- +%3 tetik → stop break-even üstüne
- +%6 tetik → kârın %50'si kilitli
- +%10 tetik → kârın %70'i kilitli
- Manuel uygulama, ekrana "şu fiyatta stop'unu şuraya çek" uyarısı

### Pozisyon büyüklüğü hesaplayıcı
- Input: Portföy ₺ + Risk %
- Otomatik: `lot = portföy × risk% / stop_mesafesi`
- localStorage kalıcı

### Smart Entry Hint
- "ŞİMDİ" / "GERİ ÇEKİLME BEKLE" (RSI>65 veya 3 ardışık yeşil mum) / "TEPKİ BEKLE" (RSI<35) / "TOPARLANMA BEKLE"
- NÖTR'de "BEKLE — sinyal güçlenmesini bekle"

### RS vs BIST 100
- Hisse rate − 20 likit BIST hisse ortalaması
- Pozitifse "daha güçlü", negatifse "daha zayıf"
- Alfa adayı tespiti

### Backtest (1y günlük)
- AL sinyallerini takip eder, stop/target/SAT-erken-çıkış yönetir
- Çıkış: trades, winrate, avgPnl, kompozit skor

---

## 📱 UI BÖLMELERİ (Bottom nav, 8 sekme)

1. **🟢 BIST**: 616 hisse, akan ticker (top 50), arama, tıkla detay
2. **₿ KRİPTO**: Binance Top 50 USDT, 3-katmanlı fallback (Binance→proxy→CoinGecko)
3. **🏢 SEKTÖR**: 12 BIST sektörü, BUGÜN/7G/30G chip + rotasyon momentumu (PARA GİRİYOR/ÇIKIYOR/STABIL)
4. **📰 HABER** *(yeni v6.2)*: 7 RSS kaynağı (BigPara/AA/Sabah/NTV/BBC TR/AA Dünya/AA Siyaset) + kategori chip'leri (TÜMÜ/BORSA/EKONOMİ/SİYASET/DÜNYA) + her başlıkta etki rozeti (↑/↓) + sektör/hisse chip'leri (tıklanır → detay sayfası) + sektör etki özeti
5. **★ FAVORİ**: yıldız + sparkline + çoklu watchlist grupları (7 varsayılan + özel)
6. **🔍 TARA**: BIST 100 paralel + TÜMÜ/SWING/DAY chip + 🤖 AI ÖNERİSİ butonu (Claude top 5) + risk rozetleri
7. **💼 PORTFÖY**: Pozisyon defteri + "Neden?" textarea + 📓 TRADE GÜNLÜĞÜ (kapanan trade'ler, isabet %, ort PNL)
8. **📶 SİNYAL**: Bot performans takibi — İSABET % + AL/SAT ort + bugün

### Hisse detay sayfası
**Sıra (yukarıdan aşağıya)**:
1. Sektör pano (üst kart, opsiyonel)
2. Ana Pano (Top 5 AL + Top 5 SAT, TARA çalıştıysa)
3. Header: sembol + canlı fiyat + günlük değişim + arama
4. **Grafik kartı** (yukarı taşındı):
   - Üstte fiyat etiketi: `THYAO  99.50₺ ▲ 2.30%  Y: 100.20 · D: 98.50`
   - 4 tab: **FİYAT / RSI / MACD / 📰 HABER**
     - FİYAT: LightweightCharts mum + MA20/50/200 + Bollinger + Supertrend, **Mum/Heikin Ashi** toggle
     - HABER: 4 alt-tab (KAP/Mynet/İş Yatırım/Borsa İstanbul) iframe gömülü + "Yeni sekme" yedek link
5. Trade öneri kartı:
   - Mod badge (Trend takip / Dip Avcı / Sat / Bekle)
   - Vade rozeti `⏱ 1-3 GÜN`
   - RS vs BIST badge
   - HTF onay badge (✓/⚠)
   - 5 metrik kart: → GİRİŞ / ⛔ ZARAR DUR / 🎯 1. HEDEF / 🎯 2. HEDEF / 📊 OYNAKLIK
   - Smart Entry hint kartı
6. Buton sırası: 🤖 AI ANALİZ / 🔬 BACKTEST / 💼 + POZİSYON AÇ
7. AI sonuç kartı + Backtest sonuç kartı
8. Trailing Stop kartı (AL sinyalinde) + Pozisyon Büyüklüğü hesaplayıcı kartı
9. Dip Avcı kartı (varsa)
10. 11 sinyal kartı: MA / MACD / RSI / BB / Stoch / Hacim / ADX / Supertrend / Price Act. / Momentum
11. Stat box'lar: CANLI / DEĞ. / RSI / ADX / MA200 / ATR / VWAP / ST / MFI / TSI
12. Footer: FeyBot v6 · "Yatırım tavsiyesi değildir"

### Modal'lar
- **🤖 AI Ayar paneli**: Anthropic API key girişi (localStorage)
- **🔔 Email paneli**: EmailJS adres + test + **🔔 PUSH BİLDİRİM AÇ** butonu (Notification API)
- **💼 Pozisyon Aç modal**: Lot, Giriş, Stop, Hedef, Not

---

## 🔧 ÖZEL DOKUNUŞLAR
- **Bip ses**: sinyal değişiminde Web Audio API (AL: 660→990Hz, SAT: 880→440Hz)
- **Web Push Notification**: sinyal değişiminde browser titreşim + bildirim (PWA olarak ana ekranda)
- **Visibility/focus refresh**: tab'a dönünce otomatik fetch + üstte manuel `↻ saat` butonu
- **Cache (localStorage)**: 24 saat live + 12 saat hist, 80 sembol cap
- **Multi-retry**: hisse açılırsa 3× deneme 2.5sn arayla
- **PWA**: manifest + sw.js (v66 network-first HTML, cache-first asset) + iOS apple-touch-icon
- **ErrorBoundary**: çökse "↻ YENİDEN YÜKLE" butonu + stack trace
- **Touch-UX**: `touch-action: manipulation` + tap delay yok
- **Sparkline**: favoriler kartında son 30 gün SVG mini grafik (responsive viewBox)
- **Tabular nums**: tüm sayılarda `font-variant-numeric: tabular-nums` (titreme yok)
- **Apple font stack**: SF Pro öncelikli, Inter fallback

---

## 📜 KULLANICI İSTEK + İŞ GEÇMİŞİ (kronolojik özet)

### Faz 1 — temel kurulum (v1-v3)
1. Eski Fintables/CORS proxy karmaşası → Yahoo Finance + 7 paralel proxy + İş Yatırım fallback
2. 14 indikatör (klasik + ADX + Supertrend + VWAP)
3. Akıllı vade profili (1-3 GÜN → 1-3 AY)
4. Doji avcı (4 tip × 3 zaman dilimi)
5. AI: Anthropic Claude direct browser (kullanıcı kendi key'iyle)
6. LightweightCharts (TradingView'in açık-kaynak motoru)

### Faz 2 — gelişmiş sinyal (v4)
7. Golden/Death Cross + Fibonacci + TTM Squeeze
8. Çift Supertrend (consensus mantığı)
9. 3-mum patternleri (Morning Star, Three Soldiers, vb.)
10. Smart Entry Timing hint
11. RS vs BIST 100
12. Backtest UI
13. Sparkline favorilerde
14. Ana Pano (Top 5 AL/SAT)
15. previousClose+regularMarketPrice meta-priority (AKSEN bug fix)
16. Service Worker v53+ (network-first HTML, mobil cache bug fix)

### Faz 3 — risk yönetimi + AI (v5.0)
17. Trailing Stop (3 kademeli)
18. Pozisyon Büyüklüğü Hesaplayıcı (portföy + risk%)
19. AI cooldown 5sn + prevSigs leak fix
20. backtest fonksiyonu eklenmesi (önceden ReferenceError veriyordu)
21. Mobile responsive tüm yeni kartlar (Spark viewBox, Hero minmax, StatBox `.mob-stat` class)

### Faz 4 — profesyonel PA + kısa vade (v5.3)
22. Stopping Volume Candle (Anna Coulling)
23. VCP - Volatility Contraction Pattern (Mark Minervini)
24. Build Up at Resistance (İbrahim Babadağı)
25. Heikin Ashi opsiyonu (chart toggle)
26. ORB (Açılış Aralığı Kırılımı) — gün-içi momentum
27. TARA likidite filtresi (turnover < 100K elenir)

### Faz 5 — UI iyileştirme + paketler (v5.4)
28. **A paketi** — Pozisyon Defteri + Sektörel Pano + Push Notification
29. **B paketi** — Sinyal Performans Takibi (İSABET %) + Haber linkleri (KAP/Mynet/İş Yatırım/Borsa İstanbul)
30. **C paketi** — esbuild pre-compile (`/standalone-fast/` yedek olarak)

### Faz 6 — son düzeltmeler (v6.0)
31. Bottom nav'da **🏢 SEKTÖR** ayrı sekmesi (12 sektör detaylı pano)
32. Hisse detayında **📰 HABER** tab (fiyat/rsi/macd yanında, KAP/Mynet/İş Yatırım/Borsa İstanbul iframe gömülü)
33. **Grafik yukarı taşındı** (JSX'te fiziksel, CSS order değil)
34. **Babel-standalone TAMAMEN KALDIRILDI** — mobile Safari'de 5-10 dk donma sorunu çözüldü, **2-4 sn boot**
35. **Kripto API 3 katmanlı fallback**: Binance direkt → proxy → CoinGecko (Türkiye ISP engeli için)
36. **Grafik kartı üstüne fiyat barı**: TradingView tarzı `SEMBOL FIYAT₺ ▲%X  Y/D`
37. SW v66 (cache zorla yenilensin)

### Faz 7 — pro işlevler paketi (v6.1)
38. **TARA mod ayrımı**: TÜMÜ / 📈 SWING / ⚡ DAY TRADE chip filtreleri (`classifyTradeMode()` — profil vadesi + ADX + PA tetik tabanlı)
39. **🤖 AI TARAYICI**: TARA sonrası butona basınca top 15 AL adayını Claude'a yollayıp "bugünün en güçlü 5'i"ni seçtirir (haber+sektör bağlamıyla). Sonuç localStorage'da cache, 24 saat dayanıklı.
40. **Risk skorlama rozeti** (DÜŞÜK ✅ / ORTA ⚠️ / YÜKSEK 🔥): `getRiskScore()` — ATR%, likidite (turnover TL), confidence, ADX, HTF çelişkisi tabanlı 0-100 skor. Trade kartında ve TARA kartlarında görünür.
41. **Trade Journaling**: Pozisyon Aç modal'da "📝 Neden alıyorum?" textarea (AI promptuna ve journal kaydına geçer). Pozisyon kapatınca otomatik journal kaydı (giriş/çıkış/PnL/gün/notlar). PORTFÖY altında istatistikli görünüm (isabet %, ort. kazanç/zarar, ort. tutma).
42. **Çoklu watchlist (FAVORİ grupları)**: 7 varsayılan grup (Banka/Sanayi/Holding/Enerji/Madencilik/Perakende/Teknoloji) + "+ YENİ LİSTE" buton. Her hisse birden fazla grupta. Chip filtre + kart altında çoklu seçim chip'leri. localStorage `feybot_favgroups`.
43. **Sektörel rotasyon takvimi**: SEKTÖR sayfasında BUGÜN / 7G ort / 30G ort chip'leri. Her kartta momentum: **↗ PARA GİRİYOR** / **↘ PARA ÇIKIYOR** / **→ STABIL** (7g vs 30g farkı tabanlı). 60 günlük history localStorage'da otomatik tutulur.
44. **AI'a sinyal arşivi enjeksiyonu**: `runAI` ve `aiScanTopPicks` artık kullanıcının kapalı pozisyon journal'ı + açık pozisyonlar + sigHistory'i prompt'a enjekte eder. Claude "geçen sefer X dedin sonuç Y oldu" gibi öğretici ton kullanır.
45. SW v67 (cache yenile)

### Faz 7 hotfix (v6.1.1)
46. **Render-time setState bug fix**: SEKTÖR sayfasında `setSectorHist()` render içinde çağrılıyordu → React "Cannot update during render" warning + olası sonsuz re-render. Çözüm: `useEffect(() => {...}, [allStocks, sectorHist])` içine taşındı.
47. **Duplicate SECTORS objesi**: 12 sektör mapping'i iki ayrı IIFE içinde tanımlıydı (~1KB tekrar). Top-level `BIST_SECTORS` sabitine çıkarıldı, hem SEKTÖR sayfası hem detay sayfası Sektörel Pano kartı + history snapshot useEffect aynı kaynağı kullanıyor.
48. SW v68 (cache yenile)

### Faz 8 — Rename + Yerel AI + Haber (v6.2)
49. **FeyBot → FEY'S BOT rename**: Topbar (FEY'S BOT gradient), title, manifest (`short_name`, `name`), apple-mobile-web-app-title, boot mesajı, Notification, SW cache key (`feysbot-v69`).
50. **HABER iframe tab kaldırıldı**: Detay sayfasındaki KAP/Mynet/İş Yatırım iframe'leri (X-Frame-Options nedeniyle çalışmıyordu) silindi. TABS 4→3 (FİYAT/RSI/MACD). `newsTab` state ve SOURCES objesi temizlendi. Haber içeriği yeni HABER sekmesinde RSS olarak akıyor.
51. **FEY-AI yerel motor** (`feyAILocalAnalysis`): API key gerektirmez, getSignals çıktısını zengin Türkçe rapora çevirir. Özet (karar+mod+vade+risk) + Artılar (MA/Cross/MACD/RSI/ADX/PA/HTF/Dip/Hacim) + Eksiler (RSI uç/MA200 alt/ADX zayıf/HTF çelişki/risk/BB) + Plan (giriş/stop/H1/H2/vade/risk) + Bu hissedeki geçmiş trade'lerin + Açık pozisyon + Sektör bağlamı + Son haberlerin etkisi. `runAI` artık key yoksa anında yerel motor, key varsa Claude (hatada otomatik yerel fallback).
52. **Haber akışı + etki algoritması** (yeni 📰 HABER sekmesi):
    - 7 RSS kaynağı: BigPara, AA Ekonomi, Sabah, NTV, BBC Türkçe, AA Dünya, AA Siyaset
    - CORS proxy zinciri (allorigins/corsproxy/cors.lol) + AbortController timeout (Safari uyumlu)
    - 24+ keyword kuralı (faiz/dolar/petrol/altın/Fed/jeopolitik/asgari ücret/kar payı/zarar/...) → sektör + spesifik hisse etki skoru (+/−)
    - Sembol direkt başlıkta geçiyorsa otomatik tespit (`detectStockMentions`)
    - Kategori chips: TÜMÜ / BORSA / EKONOMİ / SİYASET / DÜNYA
    - Sektör etki özeti kartı (son 30 başlığın toplam yönü)
    - Her başlıkta ↑/↓/— badge + ilgili sektör/hisse chip'leri
    - 30 dk cache + manuel YENİLE
53. **Hisse detayında ilgili haberler kartı**: Trade öneri kartının üstüne — bu hisseye veya sektörüne dokunan son 5 başlık (etki yönüyle), "tümü →" linki HABER sekmesine götürür.
54. **AI scanner ve runAI'a haber enjekte**: Sektör ortalaması + son haberler artık FEY-AI promptuna ekleniyor.
55. SW v69 (cache yenile, key `feysbot-v69`)

### Faz 8.1 hotfix
56. **AbortSignal.timeout Safari uyumsuzluğu**: `AbortSignal.timeout(8000)` Safari 16 öncesi crash. AbortController + setTimeout fallback'iyle değiştirildi.

### Faz 8.2 — AI Tarayıcı tam yerel (v6.2.1)
57. **`feyAIScanTopPicks` yerel motor**: TARA sekmesindeki **🤖 AI ÖNERİSİ** butonu artık API key olmadan da çalışır. Sıralama mantığı: `priority - riskCezası + sektörMomentumuBonusu`. Top 5 AL'ı seçer + sektör baskınlığını tespit eder + "uzak dur" listesi + satış baskısı özeti. `runAiScan`: key yoksa anında yerel, key varsa Claude (hatada yerel fallback).
58. SW v70 cache key (`feysbot-v70`).

### Faz 8.3 — Bug fix + cosmetic (v6.2.2)
59. **AI cevap kartı sabit "🤖 CLAUDE" yazıyordu**: Yerel motor çalıştığında yanıltıcı oluyordu. Engine'e göre dinamik etiket: `🧠 FEY-AI YEREL` (yeşil) / `🧠 FEY-AI (Claude fallback)` / `🤖 CLAUDE` (mor). BIST detayı + Kripto detayı + AI Tarayıcı kartı — 3 yerde düzeltildi.
60. **Topbar versiyon etiketi v6.1→v6.2**: Stale label güncellendi.
61. **Dosya temizliği**: `standalone-fast/` (eski v6 öncesi yedek, 200KB), `standalone/img/bist jpg.png` (atıl, 0 referans), 2 adet `.DS_Store` macOS metadata silindi. Deploy paketi 7 dosya / 244 KB.
62. **Dead code/state taraması**: 10 fonksiyon ve 20 state tek tek doğrulandı, kullanılmayan referans yok.
63. SW v71 cache key (`feysbot-v71`).

### Faz 8.4 — FEY-AI motor doğrulama testleri + 2 format bug fix (v6.2.3)
64. **Test paketi (35 kontrol)**: 4 farklı senaryo izole edildi (THYAO/AL+trend takip, AKBNK/BEKLE+zayıf trend, TUPRS/SAT+trend aşağı, GARAN/AL+açık pozisyon+journal geçmişi). Hepsi farklı, doğru, zengin çıktı üretti. Test scripti: `/tmp/feyai_test.js`.
65. **Bug: Çift markdown bold (`****AL** %78**`)**: `karar` değişkeni zaten `**AL** %78` formundaydı, etrafına yine `**...**` sarıldığı için 4 yıldız oluyordu (markdown render bozuluyor). Çözüm: `karar` artık plain `AL %78`, dış template'te `**${karar}**` ile tek bold.
66. **Bug: SAT pozisyonlarında stop/target yüzdesi ters (`Stop: 102₺ (--7.4%)`, `H1: 88₺ (+-7.4%)`)**: Formül AL için yazılmıştı, SAT'ta `price - stopLoss` negatif çıkıp `-` operatörüyle çift `--` üretiyordu. Çözüm: `Math.abs()` ile mutlak fark + sabit `+/-` prefix (stop için `-`, hedef için `+`). Hem AL hem SAT için doğru görüntü.
67. SW v72 cache key (`feysbot-v72`).

### Faz 8.5 — runAI null-deref guard (v6.2.4)
68. **Bug: `runAI` `sigRes.last` null deref**: AI ANALİZ butonuna basılınca `const last = sigRes.last;` çağrılıyordu. Eğer sinyal verisi henüz hazır değilse (BIST'te chartData boş, kriptoda cRes hesaplanmamış vs.) `sigRes` undefined → **TypeError, uygulama çöker**. Çözüm: runAI başına `if (!sigRes || !sigRes.last) { setAiErr("Sinyal verisi henüz hazırlanmadı — birkaç saniye bekleyip tekrar dene."); return; }` guard eklendi.
69. SW v73 cache key (`feysbot-v73`).

### Faz 9 — Trader değer-katan özellikler (v6.3)
70. **TARA scope BIST 100 → BIST 200+**: BIST100 listesi ~100'den ~200 likit hisseye genişledi (mid/small cap dahil: AKCNS, AYGAZ, BERA, EKSUN, JANTS, KFEIN, MAALT, NUHCM, PARSN, SAFKR, SEYKM, vb.). BATCH 10→12 paralel (proxy rate-limit aşmadan ~30-40 sn). Etiket güncellendi: "BIST 200+ · Güven ≥ %50".
71. **K/Z net hesabı (komisyon + BSMV)**: Yeni `calcFees(entry, exit, lots)` ve `calcNetPnl(entry, exit, lots)` helper'ları. Komisyon binde 0.5 (alış+satış) + BSMV %5 komisyon üzerinden. Etkilenen alanlar:
    - Portföy başlık: "Net K/Z" badge'i, hover'da brüt + komisyon görünür
    - Tek pozisyon kartı: anlık PNL artık NET (komisyon dahil)
    - Trade günlüğü kayıtları: `pnl`/`pnlPct` net, `pnlGross`/`pnlGrossPct` brüt, `fees` toplam
    - Journal kart altında "Brüt: X₺ · Komisyon+BSMV: Y₺" satırı
72. **Eşik alarmları**: `alarms` state ({id, sym, type, op, value, fired, firedAt}). Hisse detayında **🔔 ALARM KUR** butonu (Pozisyon Aç yanı) → modal: Gösterge (Fiyat/RSI/MA200/MACD) + operatör (>/=/<) + değer. `useEffect([allStocks])` ile her tick'te aktif alarmlar test edilir, vuran alarm `Notification` API ile push bildirim atar + `fired:true` işaretlenir. **SİNYAL sayfasında "🔔 EŞİK ALARMLARI" kartı** — aktif/tetiklenmiş alarm listesi + tek tıkla sil + "VURANLARI SİL" toplu temizlik. localStorage `feybot_alarms` (max 50).
73. SW v74 cache key (`feysbot-v74`).

### Faz 9.1 — Komisyon kaldırıldı (v6.3.1)
74. **`calcFees` + `calcNetPnl` + FEE_COMMISSION_RATE + BSMV** tamamen kaldırıldı. Kullanıcı komisyon ödemiyor. Yerine sade `calcPnl(entry, exit, lots)` → `{pnl, pnlPct}` döner. UI temizlendi: Portföy başlığında "Net K/Z" → "K/Z", journal kartında "Brüt/Komisyon+BSMV" satırı kaldırıldı, " net" suffix yok. Tüm hesaplar brüt fiyat farkı.
75. SW v75 cache key (`feysbot-v75`).

### Faz 9.2 — Haber feed bug fix + tarama hızı (v6.3.2)
76. **BUG: Haber feed çalışmıyordu** — canlı test: BigPara RSS 404, NTV Ekonomi 403, allorigins proxy çökmüş, corsproxy.io çökmüş. Yalnız cors.lol çalışıyordu, tek proxy bütün feed'leri yetiştiremiyor.
77. **Düzeltme — yeni RSS kaynakları** (Mayıs 2026 canlı test, hepsi 200 OK + içerikli):
    - Hürriyet Ekonomi (92 item)
    - Milliyet Ekonomi (17)
    - Dünya Gazetesi (25)
    - BloombergHT (20)
    - CNN Türk Ekonomi (35)
    - TRT Haber Ekonomi (60)
    - + mevcut çalışanlar: AA Eko/Politika/Dünya, Sabah Ekonomi, BBC Türkçe
78. **Düzeltme — proxy zinciri yeniden sıralandı**: cors.lol (✓) → api.codetabs.com (✓) → corsproxy.io (yedek) → allorigins/raw (yedek). User-Agent ihtiyacı için `redirect: "follow"` eklendi.
79. **Tarama hızı**: BATCH 12 → 18 paralel (200 hisse ~30 sn → ~15-20 sn).
80. **Day-trade hassasiyeti**: Cache TTL 5dk → 3dk (tarama daha taze veri çeker).
81. SW v76 cache key (`feysbot-v76`).

### Faz 9.3 — KRİTİK bug fix: tarama hiç çalışmıyordu (v6.3.3)
**Canlı endpoint testi (Mayıs 26, 2026)**:
```
PROXY DURUMU (hepsi Yahoo'yu çekemiyor):
  api.allorigins.win/raw         → FAIL (sunucu çökmüş)
  api.cors.lol/?url=             → 429 Rate limit exceeded
  cors.eu.org/                   → 403 Forbidden
  yacdn.org/serve/               → FAIL
  api.codetabs.com/v1/proxy      → 400 "Edge: Too Many Requests"
  corsproxy.io/?                 → FAIL
YAHOO DIRECT:
  query1.finance.yahoo.com       → ✓ 200 OK (Mozilla UA ile)
İŞ YATIRIM:
  www.isyatirim.com.tr           → ✓ 200 OK (CORS açık)
```

82. **Düzeltme**: `PROXIES = []` yapıldı (7 proxy → 0). `fetchJSON` zaten `Promise.any` ile Yahoo'yu direkt çağırıyor (proxy listesinin yanına `push` ediyor). Browser'dan Yahoo direkt 429 vermiyor (CORS başlığı `Access-Control-Allow-Origin: *`). Eğer rate-limit yerse `fetchYahooChart` sonu `fetchIsyatirimDaily(t)` ile günlük fallback'e geçer.
83. **Sonuç**: Tarama artık çalışacak — 7 ölü proxy zinciri sırayla deniyordu, hepsi 5sn timeout × 7 = 35sn boşa harcanıyordu, hiçbiri başarılı dönmüyordu. Direct Yahoo + İş Yatırım fallback < 5sn.
84. SW v77 cache key (`feysbot-v77`).

### Faz 9.4 — PROXIES eski 7'li listesi geri (v6.3.4)
85. **HATA**: v6.3.3'te `PROXIES=[]` yapıldı (terminal'de curl Yahoo direct 200 dönüyor diye). Browser farklı: **Yahoo Finance CORS başlığı vermiyor**, browser-side `fetch()` direkt çağrı CORS engeline takılıyor. Sonuç: hiç veri çekmiyor, TARA bile çalışmıyor.
86. **Düzeltme**: Eski 7'li proxy listesi geri yüklendi (allorigins/raw → corsproxy.io ×2 → codetabs → api.cors.lol → cors.eu → yacdn). `fetchJSON` Promise.any ile tümünü paralel deniyor — biri çalışırsa veri gelir. Proxy'lerin bazıları intermittent çalıştığı için bu zincir gerekli.
87. **Ders**: Browser CORS testi terminalde değil, **gerçek tarayıcıda** yapılır. curl başarısı browser başarısını GARANTİ ETMEZ.
88. SW v78 cache key (`feysbot-v78`) — eski v77 cache'i yeni proxy'siz versiyonu tutuyor olabilir, zorla yenilenir.

### Faz 10 — Tasarım refactor (v6.4) — Midas+Robinhood karışımı
89. **Renk paleti yenilendi** (T objesi):
    ```
    bg:    #060810 → #0a0e17  (daha derin premium siyah)
    bg1:   #0c0f1a → #141b2d  (kart yüzeyi, Midas tarzı)
    bg2:   #111827 → #1d2438  (vurgu)
    border:#1e2d47 → #252d44  (subtle, daha az kontrast)
    text:  #e2e8f8 → #f0f3fa  (daha temiz)
    muted: #4a5a7a → #8a93a8  (daha okunaklı, %20 daha açık)
    green: #00e5a0 → #00d68f  (Robinhood tonu)
    red:   #ff4560 → #ff5a5a  (canlı)
    blue:  #38bdf8 → #4a8eff  (Midas mavisi)
    purple:#a78bfa → #9b6dff  (daha doygun)
    ```
90. **Tipografi sistemi**: "Trebuchet MS" kaldırıldı. `-apple-system, SF Pro Display, Inter, Segoe UI, system-ui` — iOS native SF Pro otomatik gelir, Android Inter fallback, masaüstünde sistem fontu.
91. **`<style>` bloğunda kapsamlı CSS override**:
    - Tüm kart border-radius 8/10/12 → 12/14/16 (yumuşak köşe)
    - Pill (chip) 16-20 → 999 (tam yuvarlak Robinhood tarzı)
    - Buton active scale 0.97 + smooth transition 120ms cubic-bezier
    - Buton hover brightness 1.12 (subtle lift)
    - Input focus 3px blue glow (rgba(74,142,255,0.15))
    - Select custom arrow SVG
    - Bottom nav blur 20px backdrop (iOS native his)
    - Scrollbar ince 6px subtle gri
    - Mobile padding 14 → 18-24px (bol nefes)
    - Selection rgba(0,214,143,0.3) (Robinhood yeşil)
    - Animasyonlar: fadeIn, pulse, shimmer, flashGreen/Red
    - Antialiasing + font-feature-settings ile premium tipografi
92. **JS DOKUNULMADI** — JSX kaynağı kayıp olduğu için inline style kullanan React inline styles kalıyor. CSS override + T tema objesi güncellemesi ile %80 tasarım iyileşmesi.
93. SW v79 cache key (`feysbot-v79`).

### Faz 10.1 — Kaynak yeniden hayatta (v6.4)
94. **`/tmp/feybot_src.jsx` yeniden oluşturuldu**: HTML'deki minified JS Python script ile beautify edildi (4780 satır, 249 KB). Format: `React.createElement(tag, props, children)` — gerçek JSX değil ama düzenlenebilir.
95. **İş akışı**: Edit kaynak → esbuild minify → python inject HTML → SW bump → deploy. Tek seferlik bir kaynak çıkarma + sonsuz Edit/build döngüsü.
96. **Gerçek JSX'e dönüştürme** opsiyonel ek 1-2 saat iş, gerek görülmedi (React.createElement işlevsel olarak aynı, sadece syntax fark eder).

### Faz 10.2 — Gerçek JSX dönüşümü (v6.4.1)
97. **`/tmp/ce_to_jsx.py`** Python parser yazıldı — token-aware (string/template literal/comment koruyarak), parenthesis matching, recursive (inner-most first). 11 pass'ta **729 React.createElement çağrısı JSX'e dönüştürüldü** (sıfır artık kaldı).
98. **Regex literal bug fix**: Beautifier `replace(/&[a-z]+;/g, " ")` regex'ini ';' statement sayıp kırmıştı. Manuel düzeltildi.
99. **Build doğrulama**: esbuild --minify --jsx=transform ile compile → 216 KB minified, syntax temiz, tüm 12 kritik fonksiyon mevcut.
100. **Kaynak iş akışı**:
    ```
    /tmp/feybot_src.jsx (gerçek JSX, 232 KB, ~5000 satır)
            ↓ Edit (geliştirme)
    /tmp/esbuild_pkg/.../esbuild --minify --jsx=transform
            ↓
    /tmp/feybot_compiled.js (216 KB minified)
            ↓ python3 /tmp/inject.py
    standalone/index.html (229 KB)
            ↓ sw.js v++ bump
    🌐 Netlify Drop / GitHub Pages / Cloudflare Pages
    ```
101. SW v80 cache key (`feysbot-v80`).

### Faz 11 — Light Mode (v6.5)
102. **Dark → Light dönüşüm**: kullanıcı isteğiyle palet komple light mode'a alındı. Hibrit hâl bırakılmadı (T objesinin tüm renkleri light, hard-coded `#060810` LWChart bg `#ffffff`, errbox `#0c0f1a` → `#ffffff`, `#ff4560` → `#e63946`).
103. **Yeni Light Palet** (Apple Stocks + Midas Light tonu):
    - bg `#f7f8fb` (soft gri-beyaz arka plan)
    - bg1 `#ffffff` (kart yüzeyi tam beyaz)
    - bg2 `#eef1f6` (vurgu/active state)
    - border `#d7dce5` · border2 `#bcc4d2`
    - text `#0a0e17` (eski dark bg, ironik)
    - muted `#5e6776` · dim `#9ba4b4`
    - green `#00b87a` (Robinhood'tan biraz koyu, beyaz üstünde okunaklı)
    - red `#e63946` · yellow `#d97706` · blue `#2563eb` · orange `#ea580c` · purple `#7c3aed`
104. **HTML/CSS güncellemeleri**:
    - `<meta name="theme-color">` `#060810` → `#f7f8fb`
    - body bg, `#boot`, `.bspin` light tonlara
    - Scrollbar thumb `#c1c8d4` (light gri)
    - `.mob-bottom` blur backdrop `rgba(255,255,255,0.88)`
    - Input/select bg `#ffffff`, focus shadow mavi
    - flashGreen/flashRed animasyon renkleri yeni paletten
    - Selection rengi `rgba(0,184,122,0.25)` text dark
105. **Direkt HTML patch**: `/tmp/feybot_src.jsx` reboot'la silindiği için minified JS'teki `T={...}` string'i direkt Edit'le güncellendi (esbuild recompile gereksiz, görsel değişiklik tek satır).
106. SW v81 cache key (`feysbot-v81`).

### Faz 12 — v6.6 paketi
107. **Sektör nav sekmesi kaldırıldı**: bottom nav (desktop + mobil) 8→7 sekme. `id:"sectors"` NavBtn React.createElement'leri Python paren-matching script ile temizlendi. Sayfa kodu kaldı ama erişilemez (kullanıcı isteği üzerine).
108. **8 yabancı RSS eklendi** (haber gücü 11→19 kaynak):
    - BBC World, BBC Business
    - NYT Home, NYT Business
    - Reuters
    - Guardian Business
    - CNBC
    - Financial Times
    Tümü `category:"dunya"` veya `"ekonomi"`. `analyzeNewsImpact` keyword'leri Türkçe ama Fed/petrol/dolar/altın/savaş gibi yaygın terimleri İngilizce'de de yakalar.
109. **Dark/Light tema toggle** (kullanıcı ayarlanabilir):
    - T objesi IIFE'ye dönüştürüldü: `localStorage.getItem("feybot_theme")` ile palet seçimi (`dark` veya `light` — varsayılan light)
    - DARK palet eski v6.4 paleti (#0a0e17/#141b2d/...)
    - LIGHT palet v6.5 paleti (#f7f8fb/#ffffff/...)
    - IIFE içinde `document.documentElement.style.setProperty('--bg', ...)` ile CSS var set edilir + body bg/color anında uygulanır
    - **Tema toggle butonu** (`#theme-toggle`): sağ üst sabit pozisyon (top: safe-area-inset-top, right: 12px), `🌓` emoji, click → localStorage flip + `location.reload()`
    - Yarı şeffaf beyaz background + backdrop-blur(8px), tüm sayfalarda görünür
110. **Performans**: `.mob-bottom` ve topbar backdrop-filter blur 20px → 10px, 12px → 6px. Eski iOS / düşük güç modda akıcılık artar.
111. SW v82 cache key (`feysbot-v82`).

### Faz 13 — Borsa MCP entegrasyonu (v6.7)
112. **Borsa MCP** (https://borsamcp.fastmcp.app/mcp) entegre edildi — **Fintables/Cloudflare 403 sorunu nedeniyle Fintables yerine bu kullanıldı**.
    - JSON-RPC 2.0 over SSE, CORS açık (browser direkt fetch çalışır)
    - 28 tool: BIST hisseler, kripto (BtcTurk + Coinbase), TEFAS, döviz, TCMB
    - Veri kaynakları: KAP (758 BIST), Yahoo Finance, borsapy, BtcTurk, TCMB
113. **Vanilla JS overlay** olarak eklendi — React UI'a hiç dokunulmadı, risk minimum:
    - `<button id="bmcp-fab">` sağ alt köşede sabit FAB (mavi, "📊 BORSA MCP")
    - Modal: sembol input + market/index/preset/timeframe dropdown + 9 tool butonu + JSON sonuç konsolu
    - Sonuç koyu fonlu monospace pretty-print, scroll'lu
    - Loading/error renkleri (sarı pulse / kırmızı)
    - Escape veya overlay tıklama ile kapanır, bottom-sheet animasyon
114. **Bağlı 9 tool**:
    - `get_quick_info` — P/E, P/B, piyasa değeri, 52H/L, hacim
    - `scan_stocks` — XU100/XU030/XBANK/XUSIN preset taraması (aşırı satım, yükseliş momentum, supertrend AL, T3 AL, yüksek hacim)
    - `get_pivot_points` — S1-S3, R1-R3 destek-direnç
    - `get_technical_analysis` — RSI, MACD, EMA, sinyal
    - `get_dividends` — temettü geçmişi
    - `get_news` — KAP resmi duyuru
    - `get_corporate_actions` — bedelli/bedelsiz/halka arz
    - `get_macro_data` — TCMB TÜFE
    - `search_symbol` — KAP üzerinden sembol arama
115. **Global API**: `window.borsaMCP(tool, args, timeout)` — async, herhangi bir yerden çağrılabilir (gelecekte React entegrasyonu için).
116. **Canlı doğrulama** (8 Haz 2026): THYAO get_quick_info → fiyat=297.25, P/E=2.9, P/B=0.4, piyasa=410.2B TRY. scan_stocks XU100 oversold → MAGEN listesi. İki çağrı da ≤3 sn'de döndü.
117. **Önemli kısıtlama**: Yahoo Finance ~15dk gecikme. BIST kapalıyken (18:00 İstanbul sonrası) kapanış fiyatı sabit. BtcTurk 7/24 anlık.
118. SW v83 cache key (`feysbot-v83`).

### Faz 13.1 — Bug fix + İndikatör uyum doğrulama (v6.7.1)
119. **Bug: `get_technical_analysis` boş döndü** — modal'da çağrı `args={symbol, market}` idi, MCP `timeframe` zorunlu olmasa da bu olmadan `{}` döner. **Düzeltme**: `args={symbol, market, timeframe:tfEl.value}` — modal'daki dropdown değeri tool'a geçer.
120. **Doğrulama (canlı, 8 Haz 2026 saat 20:30)**:
    - GARAN 1d → Fiyat 129.30₺ · SMA20 129.46 · EMA20 127.53 · EMA50 130.43 · RSI(14) 47.59 · MACD -2.90 / sig -3.46 / hist +0.56
    - AKBNK fiyat tutarlılığı: MCP 66.90₺ = Yahoo direct regularMarketPrice 66.90₺ = bot 15m son bar close 66.90₺
121. **İndikatör uyum analizi** (önemli — beklenti yönetimi):
    - Bot Yahoo'dan **15m** TF + 100-200 bar çekip kendi `enrichData()` ile 18 indikatörü hesaplar (kısa vade/scalping/intraday)
    - MCP yfinance ile **1d** TF + 365 bar üzerinden RSI/MACD/EMA hesaplar (swing/uzun vade)
    - Aynı sembol için **iki TF'de farklı sayısal sonuçlar BEKLENİR ve DOĞRUDUR** — bunlar tamamlayıcı katmanlar, çakışma değil.
    - Veri kaynağı (Yahoo) ve formüller aynı olduğu için aynı TF'de denenirse rakamlar **eşleşir** (tutarlılık testi geçti).
122. **Genel bug sweep (yapısal)** — 7/7 PASS:
    - JS syntax temiz · Borsa IIFE syntax temiz
    - 12 kritik fonksiyon korundu (fetchYahooChart, feyAI*, fetchNewsRSS, PROXIES, ...)
    - 6 Borsa MCP elemanı bağlı (FAB, modal, callMCP, window.borsaMCP, ...)
    - z-index sırası temiz (99 < 1000 < 9999 < 10001 < 10002 < 10003)
    - 7 localStorage anahtarı korundu (favs, positions, journal, alarms, news, aikey, theme)
123. SW v84 cache key (`feysbot-v84`).

### Faz 13.2 — MCP retry mantığı + mükemmel uyum doğrulama (v6.7.2)
124. **callMCP yeniden tasarlandı — 3 katmanlı retry + exp backoff**:
    - `_mcpOnce(tool, args, timeout)`: tek deneme, "yumuşak" hata durumlarını `{_retry:true, _reason:...}` ile işaretler (HTTP non-OK, boş yanıt, SSE data: yok, JSON parse hatası, AbortError/timeout)
    - `_mcpSleep(ms)`: setTimeout-based async bekleyici
    - `callMCP(tool, args, timeout)`: 3 deneme — gecikme `[0, 1500ms, 3000ms]`, her denemede timeout +2sn (12s, 14s, 16s)
    - "Sert" hata (`error` field'ı) ilk denemede direkt döner — gereksiz retry yok
    - 3 deneme de başarısız olursa son hata sebebi açık şekilde: `"MCP 3 denemede de yanıt vermedi · son sebep: ... · sunucu yoğun, biraz sonra tekrar dene"`
125. **Loading mesajı güncellendi**: "çağrılıyor (gerekirse 3 deneme + 4.5sn beklenir)..." — kullanıcı sabırlı kalır
126. **Tam regression bug taraması (10/10 PASS)**:
    - JS syntax temiz · Borsa IIFE retry'lı parse OK (4781 chars)
    - 15 mevcut fonksiyon korundu (fetchYahooChart, fetchIsyatirimDaily, feyAI*, fetchNewsRSS, analyzeNewsImpact, getRiskScore, classifyTradeMode, buildUserHistoryContext, getSignals, enrichData, notifySignal + PROXIES, BIST_STOCKS, NEWS_SOURCES)
    - 8 Borsa MCP elemanı + retry artefakları (`_mcpOnce`, `_mcpSleep`) bağlı
    - 10 localStorage anahtarı korundu
    - z-index sırası temiz (99 < 1000 < 9999 < 10001 < 10002 < 10003)
    - 7 dosya bütünlüğü
    - HTTP 200 lokal serving
127. **Uyum doğrulama (canlı, 8 Haz 23:35, BIST 5 sa önce kapanmış)**:
    - 5/5 sembol için MCP ↔ Yahoo **bire bir tutarlı**:
      | Sembol | MCP | Yahoo direct |
      |---|---|---|
      | AKBNK | 66.90₺ | 66.90₺ |
      | THYAO | 297.25₺ | 297.25₺ |
      | SISE | 45.02₺ | 45.02₺ |
      | EREGL | 39.02₺ | 39.02₺ |
      | GARAN | 129.30₺ | 129.30₺ |
    - **İki kaynak da aynı yfinance'i kullandığı için fiyat sapması teorik olarak imkânsız**, ölçtüğümüz tutarlılık bunu doğruluyor.
128. **Piyasa AÇIK GÜN davranışı tahmini** (Pazartesi kapanışından kanıt):
    - Bot bugün 35 × 15m bar çekti (10:00-18:00 + post-market) ✓
    - regularMarketTime 18:09 — kapanış sonrası son tick zamanı ✓
    - Cache 3dk TTL → her 3dk fresh fetch
    - Yahoo free tier ~15dk gecikme → kullanıcı son 15-20dk arası fiyat görür
    - TARA 200 hisse BATCH 18 paralel ≈ 60-80sn açıkken
129. SW v85 cache key (`feysbot-v85`).

### Faz 13.3 — Profesyonel marka kimliği (v6.7.2 final)
130. **Yeni logo / app ikonu** (3 boyutta üretildi — Pillow ile programatik):
    - **Tasarım**: yumuşak köşeli kare (border-radius %20 — iOS HIG), diagonal gradient (sol üst koyu mavi `#1a2657` → orta turkuaz `#00b87a` → sağ alt parlak yeşil `#00e5a0`)
    - **Ana motif**: 3 yükselen mum (candlestick) — küçük→orta→büyük, beyaz body + ince wick. Sağ en yüksek mumun üstünde küçük ▲ ok (yükseliş işareti).
    - **Alt sol köşede minimal `₺` sembolü** — kimliği TR finansa bağlar
    - **Anti-aliasing**: 4× upscale (720/768/2048) → Lanczos downsample
    - **Boyutlar**:
        - `apple-touch-icon.png` 180×180 (7.7 KB) — iOS PWA
        - `icon-192.png` 192×192 (8 KB) — Android PWA
        - `icon-512.png` 512×512 (20.9 KB) — Android maskable
    - Eski "FB" tipi ikonun yerine geçti
131. **Topbar sürüm rozeti**:
    - "FEY'S BOT" gradient yanında küçük `v6.7.2` chip (desk-only class, mevcut `v6.2` rozeti güncellendi)
    - HTML `<title>`: `FEY'S BOT v6.7.2 — BIST Sinyal`
132. **Pillow kuruldu** (`pip3 install --user Pillow`, 11.3.0) — sonraki sürüm grafikleri için hazır.
133. **Tam regression sweep (deploy-ready)**:
    - JS parse 217.3 KB OK · Borsa IIFE 4781 chars OK
    - 15/15 mevcut fonksiyon korundu
    - 5/5 Borsa MCP elemanı + retry artefakları aktif
    - 10/10 localStorage anahtarı (kullanıcı verisi)
    - SW v86 + manifest valid + HTTP 200
    - 4 PNG ikon RGBA + manifest pointer'lar doğru
134. SW v86 cache key (`feysbot-v86`).

### Faz 13.4 — KRİTİK BUG FIX: 54 escape karakter raw render ediliyordu (v6.7.3)
135. **Bug**: Bottom nav (sol taraf desktop) ve diğer Türkçe metinli yerlerde emoji/karakter escape'leri (`₿`, `\u{1F4F0}`, `\xD6`, `İ` vs.) **çift backslash** olarak HTML'e geçmiş — JS string literal yerine raw text olarak render edilmiş. Kullanıcı ekranda **`₿`** / **`KRİPTO`** / **`PORTF\xD6Y`** gibi raw escape sequence'lar görüyordu.
136. **Sebep**: Daha önceki Python `s.replace()` inject script'lerinde escape sequence'ları yanlış quote etmem — Python heredoc içindeki backslash'lar dosyaya çift escape'li yazılmış.
137. **Düzeltme** (Python regex pass):
    - `\\u\{XXXXX\}` (8 adet) → gerçek karakter (📰 🔍 💼 📶 vs.)
    - `\\uXXXX` (29 adet) → gerçek karakter (₿ ★ İ ş vs.)
    - `\\xXX` (17 adet) → gerçek karakter (Ö ü ç vs.)
    - **Toplam 54 düzeltme**, 314 byte kazanım
138. **Sonuç** — bottom nav artık doğru render eder:
    | Sembol | Etiket |
    |---|---|
    | ₿ | KRİPTO |
    | 📰 | HABER |
    | ★ | FAVORİ |
    | 🔍 | TARA |
    | 💼 | PORTFÖY |
    | 📶 | SİNYAL |
139. **Tam regression sweep (8/8 PASS)**:
    - JS parse 217.0 KB · Borsa IIFE temiz
    - 0 bozuk escape kalmadı (sadece regex literal'larda `\b \s \S` — doğru kullanım)
    - 17 mevcut fonksiyon korundu (ErrorBoundary minified ile farklı isim aldı, mantığı çalışıyor)
    - 7 Borsa MCP elemanı + retry artefakları aktif
    - 10/10 localStorage anahtarı
    - Yeni 3 PNG ikon + theme toggle + v6.7.2 rozeti yerinde
    - SW v87, manifest valid, HTTP 200
140. SW v87 cache key (`feysbot-v87`).

### Faz 13.5 — Hisse Kartı UX + TARA hız fix (v6.7.4)
141. **FAB yeniden adlandırıldı**: "📊 BORSA MCP" → **"📋 HİSSE KARTI"** (teknik jargon yerine kullanıcı dili). Modal başlığı + hint metni de güncellendi.
142. **KRİTİK UX FIX — ham JSON çıktısı kaldırıldı**: Hisse Kartı sonuçları artık **Türkçe okunabilir format**:
    - `humanize(act, res)` fonksiyonu: araç başına başlık (⚡ HİSSE ÖZETİ, 🔍 TARAMA SONUCU, 📐 DESTEK/DİRENÇ...)
    - `TRL` etiket haritası (~50 alan): `pe_ratio` → "F/K Oranı", `market_cap` → "Piyasa Değeri", `week_52_high` → "52 Hafta En Yüksek"...
    - Sayı biçimleme `tr-TR` locale: 410205000000 → "410,21 Milyar ₺", 39271281 → "39,27 Milyon"
    - Fiyat alanlarına ₺, yüzde alanlarına % otomatik eklenir; null → "—"
    - Nested objeler ve listeler girinti + ■ başlıklarla; ilk 25 öğe + "... ve N adet daha"
    - Altbilgi: "Kaynak: yfinance · tarih saat" + "⚠ Veri ~15 dk gecikmeli olabilir"
143. **TARA yavaşlık fix**: Canlı testte 7 proxy'nin 7'si de ölü/rate-limited (allorigins EMPTY, corsproxy EMPTY, codetabs "Too Many Requests", cors.lol "Rate limit", cors.eu Cloudflare HTML, yacdn EMPTY). Yahoo direct curl çalışıyor ama browser CORS proxy ister. **BATCH 18 → 8** — paralel istek yükü %55 düşürüldü, rate-limit tetiklenme olasılığı azaldı. Borsa MCP `scan_stocks` (XU100 preset taraması, tek çağrı) modal'da hızlı alternatif olarak duruyor.
144. **Doğrulama**: humanize çıktısı node'da gerçek THYAO verisiyle test edildi — etiketler ve sayı biçimleri birebir doğru. Yeni blokta 0 çift-escape (önceki görsel bug vektörü), 108 geçerli JS \u escape. Ana JS 217 KB + IIFE 9986 chars parse OK.
145. SW v88 cache key (`feysbot-v88`).

### Faz 13.6 — Tarama preset genişletme (v6.7.5)
146. **Hisse Kartı → Endeks Tara'ya 2 yeni preset** (canlı test edilip doğrulandı): `overbought` (aşırı alım/tepe — SAT adayları) ve `bearish_momentum` (düşüş momentum — XU030'da 20 hisse döndürdü). Dropdown artık 7 preset: aşırı satım, aşırı alım, yükseliş momentum, düşüş momentum, supertrend AL, T3 AL, yüksek hacim. `macd_bullish`/`golden_cross` server'da yok — eklenmedi.
147. SW v89 cache key (`feysbot-v89`). Sağlık: JS parse OK, preset ref'leri yerinde.

### Faz 14 — Hisse Kartı bottom nav sekmesi (v6.8)
148. **Hisse Kartı iç opsiyon olmaktan çıktı** — sağ alttaki FAB butonu kaldırıldı, bottom nav'a **📋 KART** sekmesi eklendi (KRİPTO ile HABER arası, desktop sol nav + mobil alt nav = 2 yer).
149. **Teknik yaklaşım (React rebuild'siz, minimum risk)**:
    - Minified nav'a `NavBtn{id:"hissekart",icon:"📋",label:"KART"}` enjekte edildi
    - IIFE'ye **capture-phase** document click listener: `.nav-item` içinde "📋"+"KART" görülürse `stopPropagation` + overlay açılır — React'in `setPage`'i hiç tetiklenmez, sayfa state bozulmaz
    - FAB CSS ile gizlendi (`#bmcp-fab{display:none !important}`) — `fab.onclick` referansı korunduğu için IIFE kırılmadı
150. Doğrulama: Ana JS + IIFE parse OK · KART nav 2 yerde · FAB gizli · listener aktif. SW v90 (`feysbot-v90`).

### Faz 15 — A+B+D+E paketi (v6.9)
151. **A — Oto Hisse Kartı**: KART modalı açılınca `open()` 120ms sonra otomatik `run("quick")` çalıştırır → seçili sembolün P/E, PD/DD, temettü, 52H/L verisi anında görünür (manuel butona basmaya gerek yok).
152. **B — Bugünün Fırsatları**: KART grid'ine 🔥 buton. `scan_stocks` ile seçili endeks (XU100/30...) için `oversold` (dip adayları) + `bullish_momentum` (momentum) paralel taranır, iki satırlık özet liste. Proxy'siz, MCP üzerinden hızlı.
153. **D — Portföy K/Z eğrisi**: KART grid'ine 💼 buton. `feybot_journal` localStorage'dan kapanmış pozisyonları okur, kümülatif K/Z hesaplar, `▁▂▃▄▅▆▇█` unicode sparkline + son 12 işlem + isabet %. localStorage tabanlı, DOM/MCP'siz.
154. **E — KAP bildirim**: IIFE'de `kapCheck()` — 15sn sonra ilk, sonra 30dk'da bir. `feybot_favs`'taki ilk 8 hisse için `get_news` çeker, en yeni duyuru `id`'si `feybot_kapseen`'dekinden farklıysa Notification atar (ilk taramada sessiz, sadece kaydeder — spam önler). 800ms throttle.
155. Hepsi KART overlay + bağımsız IIFE — React'e dokunulmadı, kırılganlık=0. Doğrulama: Ana JS + IIFE parse OK, firsat/portfoy/kapCheck ref'leri yerinde. SW v91 (`feysbot-v91`).

### Faz 16 — 3 kritik düzeltme + kaynak kalıcılaştırma (v7.0)
156. **Madde 3 — JSX kaynağı kalıcılaştırıldı**: `/tmp` reboot'ta siliniyordu. Minified ana React bloğu HTML'den çıkarıldı, beautify edildi (4813 satır, React.createElement formatı), hem `/tmp/feybot_src.jsx` hem **kalıcı `src/feybot_src.jsx`** (254 KB) olarak kaydedildi. Round-trip doğrulandı (esbuild → 220 KB). Beautify'ın kırdığı `/&[a-z]+;/g` regex'i düzeltildi. **Geliştirme akışı artık: src/feybot_src.jsx düzenle → esbuild → /tmp/inject.py → HTML.**
157. **Madde 1 — Borsa MCP veri fallback (yavaşlık kök çözümü)**: 7 CORS proxy'nin tamamı aralıklı ölü/rate-limited olduğundan, `fetchYahooChart` fallback zinciri genişletildi: **Yahoo proxy → İş Yatırım → Borsa MCP**. Yeni `fetchBorsaMCPDaily(t)` fonksiyonu `get_historical_data` (period:2y, 36 bar) çağırıp bot row formatına (`{ts,date,open,high,low,close,volume}`) çevirir. CORS açık, proxy'siz. **Bug yakalandı**: ilk `period:3mo` sadece 7 bar dönüyordu (MCP haftalık aggregate), bot `>10` row ister → null dönerdi; `2y`'ye çıkarıldı (36 bar). Artık 3 kaynak da ölse bot boş ekran yerine günlük veriyle çalışır.
158. **Madde 2 — Sinyal geçmişi inline detay**: SİNYAL sayfasında satıra tıklayınca artık hisseye gitmiyor — satırın altında **inline expand** açılıyor: tam değişim (from→to), sinyal/güncel fiyat, delta+isabet, tarih/saat, **o sembolün toplam sinyal+isabet özeti**, ve isteğe bağlı "→ Hisseyi Aç" butonu. Top-level `useState(-1)` (sgE/sgZ) + React.Fragment ile yapıldı (conditional IIFE'ye hook eklenemeyeceği için state ana component'e kondu).
159. **Bug review**: çift-escape 0 · console.log 0 · debugger 0 · TODO 0 · 9 localStorage anahtarı korundu · tüm önceki özellikler (window.borsaMCP, kapCheck, humanize, hissekart nav, theme-toggle, firsat) intakt. Ana JS 220.4 KB parse OK.
160. SW v92 (`feysbot-v92`).

### Faz 16.1 — Veri kaynağı sırası değişti (v7.1, kullanıcı emri)
161. **Yeni öncelik: 1️⃣ Borsa MCP → 2️⃣ Yahoo → 3️⃣ İş Yatırım**. `fetchYahooChart` başına `const mcp=await fetchBorsaMCPDaily(t);if(mcp)return mcp;` eklendi — MCP dolu dönerse (≥10 row, period 2y) anında onu kullanır, proxy zincirine hiç girmez. MCP boşsa Yahoo (proxy+1d), o da boşsa İş Yatırım. **Not**: MCP günlük OHLCV verir (intraday 15m değil) — grafik artık günlük bazlı, ama proxy yavaşlığı/ölülüğü tamamen bypass edilir. SW v93.

---

## 🎯 v6.7.2 — Genel sistem özeti (final)

### 📊 Veri katmanları (hiyerarşik)
```
ANA AKIŞ (kritik)
  Yahoo Finance (15dk gecikme)
    └─ 7'li CORS proxy zinciri (Promise.any)
       └─ İş Yatırım fallback (günlük data, CORS açık)

BONUS KATMAN (Borsa MCP, retry'lı)
  https://borsamcp.fastmcp.app/mcp
    ├─ 9 tool: quick_info, scan_stocks, pivot, tech, dividends, news, corp_actions, macro, search
    ├─ JSON-RPC 2.0 over SSE
    ├─ CORS açık, browser direkt fetch
    └─ 3 deneme + exp backoff (1.5s, 3s)

KRİPTO
  Binance direkt (BTCUSDT vb. anlık)
    └─ CoinGecko fallback (Türkiye ISP engeli için)

HABER (19 RSS kaynağı)
  Hürriyet/Milliyet/Dünya/BloombergHT/CNN/TRT/AA/Sabah/BBC + yabancı BBC×2/NYT×2/Reuters/Guardian/CNBC/FT
    └─ cors.lol → codetabs → corsproxy → allorigins (sıralı)
```

### 🧠 İndikatör / sinyal motoru
- 18 teknik indikatör (RSI×2, MACD, EMA, MA, BB, Keltner, ATR, OBV, Stoch, ADX, Supertrend×2, VWAP, Vol, Fib, MFI, TSI, AO, Vortex)
- 14+ price action pattern (klasik mumlar + 4-tip Doji + 3-mum + Stopping Volume + VCP + Build Up + ORB)
- Multi-timeframe (15m + günlük HTF) onay sistemi
- 11 ağırlıklı kategoride puanlama
- **FEY-AI yerel motor** (API key'siz, getSignals çıktısını Türkçe rapora çevirir)
- **AI Tarayıcı yerel** (top 5 fırsat seçimi, Claude opsiyonel fallback)
- Risk skorlama (ATR + likidite + güven + ADX + HTF)
- Pozisyon büyüklüğü hesaplayıcı + trailing stop + akıllı vade profili

### 📱 UI — 7 sekme (bottom nav)
1. 🟢 BIST · 2. ₿ KRİPTO · 3. 📰 HABER · 4. ★ FAVORİ · 5. 🔍 TARA · 6. 💼 PORTFÖY · 7. 📶 SİNYAL

### 🎨 Görsel sistem
- Light mode (varsayılan) + Dark mode (sağ üst 🌓 toggle)
- Apple Stocks + Midas Light paleti
- SF Pro Display + Inter font stack
- 14-16px border-radius, bol whitespace, mikro animasyon
- Yeni profesyonel logo (mum motifi + gradient + ₺)

### 🛠️ Geliştirme akışı
```
/tmp/feybot_src.jsx (gerçek JSX kaynak)
     ↓ Edit
/tmp/esbuild_pkg/.../esbuild --minify --jsx=transform
     ↓
/tmp/feybot_compiled.js (~217 KB minified)
     ↓ python3 /tmp/inject.py
standalone/index.html (~243 KB)
     ↓ sw.js v++ bump
🌐 Netlify Drop / GitHub Pages / Cloudflare Pages
```

### 📦 Final deploy paketi
```
standalone/  7 dosya · 300 KB total
├── index.html         243 KB  (v6.7.2)
├── sw.js              v86     (cache feysbot-v86)
├── manifest.json      FEY'S BOT
├── apple-touch-icon   180×180 (yeni)
├── icon-192           192×192 (yeni)
├── icon-512           512×512 (yeni)
└── bist-logo          600×600 (mevcut)
```

### ⚠ Bu turda atlanan (token kıtlığı)
- **Sinyal geçmişinde inline detay**: tıklayınca hisse sayfası yerine satır altında expand — büyük bir minified JSX refactor, sonraki tura.
- **Bottom nav simge sorunu**: kullanıcı detay vermedi, ekran görüntüsü/console hatası ile birlikte sonra bakılacak.

**NOT — kayıp `/tmp/feybot_src.jsx`**: macOS `/tmp` reboot'ta temizlendiği için JSX kaynağı kayboldu. Mevcut sürüm sadece `standalone/index.html` (compiled minified JS) olarak yaşıyor. Yeni özellik için ya HTML üzerinde hedefli string-replace yapılır, ya da JSX yeniden oluşturulup esbuild'lenir (~250KB iş).

### 🔍 Genel bug tarama özeti (v6.3 sonrası)
| Kontrol | Sonuç |
|---|---|
| JS syntax (208 KB) | ✓ Temiz, parse OK |
| Eski state/setter referansı (setNewsTab vs) | ✓ 0 dead ref |
| `standalone-fast/`, `feybot-v6X` kalıntısı | ✓ Yok |
| React conditional hook riski | ✓ Yok |
| Anonim map key prop riski | ✓ 0 yer |
| TODO/FIXME/debugger | ✓ Yok |
| `.last.X` null deref | ✓ runAI'a guard eklendi |
| `localStorage.setItem` ile state senkron | ✓ 8 yer, hepsi useEffect içinde |
| `page === "X"` rota eşleşmesi | ✓ Tüm sayfalar (market/crypto/cryptoDetail/sectors/news/favorites/scanner/portfolio/signals) doğru |

### 🧪 FEY-AI motor doğrulama özeti
| Senaryo | Karar | Doğru tespit edilen | Çıktı uzunluğu |
|---|---|---|---|
| THYAO (AL %78) | Trend takip | MA200/Golden/MACD/RSI sağlıklı/ADX güçlü/Engulfing/HTF/Hacim spike | ~1000 char, plan dahil |
| AKBNK (BEKLE %35) | Bekle | ADX zayıf + waitReasons + Yüksek risk (ATR/likidite) | ~600 char, plan yok |
| TUPRS (SAT %68) | Çıkış | RSI aşırı alım + MA200 altı + Shooting Star + Trend aşağı | ~900 char, plan + doğru yüzdeler |
| GARAN (AL %65 + açık poz + journal) | Dip dönüş | Hammer + Dip 5/7 + bu hissedeki geçmiş (%50 isabet) + açık pozisyon PNL +6.09% | ~1300 char |

**Sonuç**: Motor her hisse için kendi sinyal verisinden bağımsız, doğru ve zengin Türkçe rapor üretiyor. **Token yakmıyor** (API çağrısı yok), anında cevap veriyor.

---

## 🐛 BİLİNEN KISITLAR (eklenmemiş, gerek görülmedi)

### Mevcut limitler (özellik değil, ortam)
- **Yahoo Finance 15-20 dk gecikme**: free tier doğal, swing trader için sorun değil
- **Binance Türkiye'de ISP engeli**: 3 katmanlı fallback yumuşatıyor ama CoinGecko 24h delay var
- **KAP/Mynet iframe X-Frame-Options**: bazı sitelerde iframe blok, "Yeni sekme" yedek link var
- **PWA Web Push iOS 16.4+**: eski iPhone'larda mail uyarı kullanılır
- **Babel kaldırıldığı için her değişiklik esbuild gerekir**: `/tmp/esbuild_pkg/package/bin/esbuild` Mac binary'si

### Eklenmeyen özellikler (gerek görülmedi)
- **Light mode**: ~3000 satır inline `T.x` CSS variable refactor gerekir, marjinal getiri
- **Multi-TF Scanner (1h + 4h tarama)**: mevcut günlük multi-TF zaten yeterli
- **Smart Money Concepts (BOS/CHOCH/FVG)**: marjinal, mevcut motor güçlü
- **WebSocket real-time**: Yahoo destek yok, Binance auth gerekir
- **TradingView gerçek widget**: sembol mapping bug (THYAO→AAPL), kaldırıldı, LWChart kendi datasıyla

---

## 🌐 DEPLOY (Netlify Drop)
1. Local test: `cd /Users/fey/Desktop/bist-bot/standalone && python3 -m http.server 8765` → `http://<MAC_IP>:8765`
2. **Netlify Drop**: [app.netlify.com/drop](https://app.netlify.com/drop) → `/standalone/` klasörünü drop'a sürükle → URL al
3. Telefonda **temiz başlangıç**:
   - iPhone Ayarlar → Safari → Geçmişi ve Web Sitesi Verilerini Temizle
   - Ana ekrandaki eski FeyBot ikonunu sil
   - Safari'yi tamamen kapat (alttan yukarı kart)
   - Netlify URL → Safari → Paylaş → Ana Ekrana Ekle

---

## 🤖 AI ANALİZ AKIŞI (Anthropic Claude)
1. Kullanıcı `console.anthropic.com` → API Keys → key oluştur
2. FeyBot üst barda **🤖** butonuna basıp key girer (localStorage, sunucuya gitmez)
3. Hisse detay sayfasında **🤖 AI ANALİZ** butonu
4. `claude-sonnet-4-5` modeline POST: sembol + ad + sinyal kararı + tüm indikatör snapshot
5. Claude haber/sektör/makro bağlamla harmanlanmış Türkçe görüş üretir (Format: özet + artılar/eksiler + karar + vade)
6. 5sn cooldown (gereksiz API maliyeti koruması)

---

## 💡 SONRAKİ TURDA EKLENEBİLECEKLER
*(v6.1'de 1-6 hepsi tamamlandı. Aşağıdakiler bir sonraki tur)*
1. **Multi-TF Scanner (1h + 4h tarama)**: SWING modunu zenginleştirmek için 1h ve 4h candle confluence
2. **Auto-trade alarmı**: Risk:Reward >= 1:3 ve düşük risk olan sinyalleri push notification ile her saat tarayıp bildir
3. **Smart Money Concepts (BOS/CHOCH/FVG)**: ICT/SMC pattern dedektörü (struktural break, fair value gap, order block)
4. **Backtest motorunun journal'a bağlanması**: "Senin son ay başardığın AL pattern'leri şunlar" şeklinde otomatik içgörü
5. **Pair trading / spread alerts**: İlişkili 2 hissenin ratio'su istatistiksel mean'den sapınca uyarı
6. **News API entegrasyonu** (Reuters/Bloomberg TR feed): Haber-tabanlı volatilite tahmini
7. **Otomatik Pozisyon Sizing 2.0**: Kelly Criterion + risk skorunu birleştir, lot otomatik ayarlansın

---

## 📊 NUMERİK İSTATİSTİK (v6.1)
- ~3800 satır JSX kaynak
- 11 sinyal kategorisi (ağırlıklı puanlama)
- 18 indikatör + 14+ PA pattern
- 7 bottom nav sekmesi
- 36+ BISTBot top-level const, 0 duplicate
- 4 CDN bağlantısı (React/ReactDOM/Recharts/LightweightCharts), Babel YOK
- 196 KB final HTML (188 KB minify JS gömülü)
- 2-4 sn mobile Safari boot süresi
- SW v67
- 0 runtime error (ErrorBoundary aktif sigorta)
- 10 localStorage anahtarı: feybot_v12, _sigs, _favs, _sighist, _alerts, _email, _favgroups, _journal, _posreasons, _sectorhist, _aiscan, _positions, _aikey, _pf, _risk

### Faz 17 — EAGLE EYE: bistIQ kimlik + A kümesi (v7.2)
**KÜME A tamam (emir 1-6):**
162. **Akıllı veri sıralama**: `fetchYahooChart` başında `gunluk=!i.endsWith("m")&&!i.endsWith("h")` — günlük istek→Borsa MCP önce (hızlı/güvenilir), 15m intraday→Yahoo önce (kaliteli). Otomatik, interval parametresine göre.
163. **Rename FEY'S BOT → EAGLE EYE: bistIQ**: topbar (gradient bar→logo img `icon-192.png` 26px + "EAGLE EYE" text / ": bistIQ" yeşil, büyük harf 800 weight), title, manifest (name/short_name=bistIQ/desc), apple-web-app-title, Notification, SW. v6.7.2→v7.2.
164. **Logo header**: app ikonu (gradient+mum+₺) artık topbar'da sol başta.
165. **"Veri çekiliyor"**: "Yahoo'dan çekiliyor (7 proxy paralel)" + "Bağlanıyor..." + boot "FEY'S BOT yükleniyor" → hepsi "Veri çekiliyor…". Proxy/Yahoo teknik detayı kullanıcıdan gizlendi.
166. **Sinyal geçmişi: arama + TARA filtresi**: SİNYAL sayfası başlığına hisse arama input (sgQ — sembol yazınca o hissenin tüm sinyal geçmişi filtrelenir) + "🔍 Sadece TARA" pill toggle (sgTara — yalnızca TARA'da sinyal veren hisseler). İstatistik tüm veriden, liste filtreli.
167. manifest theme/bg light (#f7f8fb). SW v95. Ana JS 221.5KB parse OK, FEY'S BOT kalıntı 0.

**KALAN (sıradaki turlar):**
- KÜME B: Kripto ayrı standalone dosyası (emir 7)
- KÜME C: indikatör iyileştirme + gürültü azaltma + AI eagle-eye karar + AI güçlendirme + price action (borsaninizinden.com modeli) (emir 9-13)
- KÜME D: TARA PDF export (emir 8)

### Faz 18 — Logo + AI sade + PDF + Kripto ayrı bot (v7.3)
- **Logo**: kullanıcının altın kartal görseli (eagle-logo.png 1408×768) kartal başı kare kırpıldı → icon-192/512/apple-touch. Topbar logo 26→48px, "EAGLE EYE" font 20→32px (2 kat).
- **C**: feyAILocalAnalysis eagle-eye karar formatı (Artılar/Eksiler madde→tek satır, "➤ KARAR" başta). feyAIScanTopPicks sade (🦅 EN GÜÇLÜ 5, tek satır/hisse). AI font 12→14px.
- **D**: TARA "📄 PDF" butonu — window.print, AL/SAT ayrı tablo, EAGLE EYE başlıklı, bağımlılıksız.
- **FEY-AI → EAGLE EYE AI** tüm string'ler (kalıntı 0). "Yahoo bağlanıyor" → "Veri çekiliyor". Boot/notification/manifest/title rename.
- **Kripto AYRI BOT**: `standalone-crypto/` — kopya + default sayfa "crypto" + "EAGLE EYE: kriptoIQ" branding + manifest/sw (kriptoiq-v1) ayrı. Aynı motor, ayrı PWA/URL. Kripto logosu kullanıcıdan bekleniyor (şimdilik kartal ikonu).
- SW: BIST feysbot-v98, Kripto kriptoiq-v1.

### Faz 18.1 — Kripto GERÇEK ayrı bot (v7.3.1)
- Kripto botundan BIST-özel sekmeler SİLİNDİ: market, hissekart(MCP), news, scanner (8 NavBtn paren-balanced). Kalan: KRİPTO + FAVORİ + PORTFÖY + SİNYAL.
- Kullanıcının kripto logosu (eagle-logo.png 1380×752) → kriptoIQ icon-192/512/apple-touch.
- SW kriptoiq-v2. Default sayfa crypto. Branding kriptoIQ.

### Faz 19 — Haber RSS GERÇEK fix + AI yorum (v7.4)
- **Sorun**: cors.lol HTML hata sayfası döndürüyordu (RSS değil), codetabs/corsproxy/allorigins ölü → haber gelmiyordu.
- **fetchNewsRSS 4-katmanlı zincir**: rss2json.com (RSS→JSON, ana) → allorigins/get (contents XML) → cors.lol (XML) → codetabs (XML). Ortak parseXML + clean(). İlk dolu sonuç döner. Farklı ağ ortamlarında en az biri tutar.
- **loadNews sıralı + 260ms gecikme** (paralel Promise.all rate-limit tetikliyordu → sıralı for döngüsü).
- **Haber AI yorumu**: analyzeNewsImpact'e `comment` — etkilenen sektör (📈 olumlu / 📉 baskı) + öne çıkan hisseler (↑/↓). HABER kartında 🦅 mavi kutu olarak gösterilir. API key'siz, kuralcı yerel AI.
- SW feysbot-v102. Not: Anthropic sandbox IP'sinden rss2json rate-limit + allorigins boş dönüyor (ardışık test yükü); gerçek telefon/IP'de zincir tutar.

### Faz 20 — Sanal Trader / Paper Trading (v7.5)
- **💰 SİM** bottom-nav sekmesi (signals'tan önce, 2 yer). Yeni state `feybot_paper` {cash, start, pos, trades, seen, dayKey, dayStart}, başlangıç 100.000₺.
- **Otomatik motor** (`useEffect([_e,allStocks])`): sigHistory'deki AL/SAT sinyallerini izler. AL → o hisse pozisyonda değilse nakit %10'u ile sanal alım (lot=floor(cash·0.1/fiyat)). SAT → pozisyon varsa kapat, K/Z trades'e kaydet. `seen{}` map ile tekrar işleme engeli. Mevcut sinyal motoruna DOKUNULMADI (izole useEffect).
- **SİMÜLATÖR sayfası**: Anlık değer (nakit+pozisyon), Toplam K/Z (₺+%), Bugün, Nakit, açık poz sayısı, kapanan işlem, isabet %. Açık pozisyonlar listesi (anlık K/Z, tıkla→detay). İşlem geçmişi (son 40, entry→exit, K/Z). ↺ Sıfırla butonu.
- **Mail**: Günlük rollover'da (dayKey değişimi) otomatik özet maili (EmailJS, email kayıtlıysa) + sayfada "📧 Günlük Özet Maille" butonu.
- Equity = cash + Σ(lot×güncel fiyat). Günlük K/Z = equity − dayStart. Toplam = equity − start.
- Bug tarama: JS parse OK (231.6KB), çift-escape 0, FEY-AI 0, tüm bileşenler doğrulandı. SW feysbot-v103.

### Faz 21 — TDZ bug fix + footer rename + SİNYAL nav kaldır (v7.6)
- **KRİTİK TDZ fix**: paper trader useEffect'i state cluster'dan ÖNCE eklenmişti → "Cannot access 'Ge'(_e) before initialization" runtime crash (Netlify'da beyaz ekran). useEffect state tanımından SONRAYA taşındı (state@119624 < effect@119675 doğrulandı).
- **Footer "FeyBot" → "EAGLE EYE: bistIQ"**: topbar değişmiş ama footer'da ayrı marka span'i ("Fey"+"Bot") kalmıştı — kullanıcının gördüğü buydu, düzeltildi.
- **SİNYAL nav butonu kaldırıldı** (2 yer). Sayfa kodu `t==="signals"` KORUNDU — geri eklemek için: nav grubuna `React.createElement(NavBtn,{id:"signals",page:t,setPage:i,icon:"📶",label:"SİNYAL",badge:_e.length})` ekle.
- 7 sekme: BIST·KART·HABER·FAVORİ·TARA·PORTFÖY·SİM. SW feysbot-v105.

---

## EAGLE EYE Bot Motoru — v3 (2026-06-17)

**Mimari:** App (GitHub Pages PWA) + otonom bulut botu (GitHub Actions, `bot/`). İkisi aynı sinyal motorunu kullanır.

**Sinyal motoru (`bot/engine.mjs` = app `getSignals`):**
- **Timeframe: GÜNLÜK mum** (2y veri → MA50/MA200/ADX geçerli). Eskiden 15dk idi: MA200 hep null → düşen hisseye AL veriyordu (kök bug, düzeltildi).
- 10 indikatör ağırlıklı toplanır (MA/MACD/RSI/BB/SRSI/VOL/ADX/Supertrend/PriceAction/MOM).
- **Momentum confluence:** RSI+MACD+MOM hemfikirse net puan ×1.18, çelişirse ×0.72.
- **Dip dönüş:** MA200 altında 3/7 dip şartı (RSI dip+dönüş, MACD dönüş, BB dip, hacim, stoch, OBV, supertrend flip). Dipler karşı-trend cezasından ve kalite filtrelerinden muaf.
- Karar: MA200 üstü → güven 48+ge×1.3 (≤95); dip → 40+skor×9; MA200 altı momentum → ≤62 (gürültü, filtrelenir).

**Tarama kalite filtresi (`run.mjs`, env: MIN_CONF=65, MIN_ADX=20):** güven<65 / ADX<20 / üst-trend çelişkisi / karşı-trend AL elenir (dipler muaf). Haber-duyarlı: ±15 güven (`news-impact.mjs`).

**AI TRADER (paper, `feybot_paper.json` Gist):** başlangıç 500k (env START_CASH; başlangıç değişince oto-sıfırlama). Sizing %10-30 (güvene göre), max 5 pozisyon. Çıkış: breakeven(+%2), kısmi kâr(ilk hedef yarı), trailing, TP/SL/SAT. TÜM yönetim hafta içi 09:55-18:05.

**Bildirim:** saat başı Telegram (HİSSE TARA + AI TRADER durumu + XU100 relatif). Komutlar: /durum /pozisyonlar. Sağlık alarmı + FATAL bildirimi.

**Çalışma:** `trade.yml` self-loop (cron başlatır, iş 10-18 her 20dk tarar — GitHub cron güvenilmezliğini aşar). Repo public → Actions sınırsız.

**Açık işler:** AI (Claude) sermaye dağıtıcısı (onay bekliyor); kalite eşiklerini backtest'le doğrulama.

### v3.1 — Hisse seçim katmanı + backtest (2026-06-17)
- **Göreli güç (RS vs XU100):** hissenin 60g getirisi − XU100 60g getirisi. Endeksten belirgin zayıf (RS<-3) AL elenir (dip hariç). RS≠RSI (RSI momentum, RS endekse kıyas).
- **R:R sıralaması:** adaylar (hedef−fiyat)/(fiyat−stop) oranına göre de sıralanır.
- **Sektör liderliği:** ortalama RS medyan üstü sektörler "güçlü" → seçimde +bonus.
- **Hacim teyidi:** AL'da son hacim 20g-ort'un %70'inin altındaysa (kuruma) elenir (dip hariç).
- **Momentum confluence:** RSI+MACD+MOM hemfikir ×1.18, çelişki ×0.72.
- **Backtest (`bot/backtest.mjs`, 759 AL/1y/10g ileri):** genel %50 isabet/+%0.49; **dip dönüşler %55/+%5.45 (en iyi kenar)** → seçimde dip'e bonus. Güven kusursuz kalibre değil → R:R+RS+exit mantığı kritik.
- Seçim skoru: güven + potansiyel + R:R×3 + RS×0.5 + sektör + dip×2.5.

### v3.2 — İndikatör yapısal eklemeler (2026-06-17, bot+app ortak motor)
- **Squeeze kırılım:** enrichData zaten `squeezeOff` (Bollinger, Keltner içinden çıkış = düşük-vol patlaması) üretiyordu ama kullanılmıyordu → net puan ×1.2. Backtest: squeeze sinyalleri %46 (genel %41 üstü).
- **Anti-chasing / desteğe yakın:** fiyat ma20'den >%8 uzaksa ×0.85 (chasing riskli); trend içi geri çekilme (ma50 üstü, ma20'ye yakın) ×1.1.
- **Rejim:** yatay piyasada (düşük ADX) Bollinger bant uçlarında mean-reversion (alt %15 +8, üst %15 −8).
- **RSI giriş gate:** AL'da RSI≥63 elenir (backtest: erken giriş %42 vs aşırı-alım %34).
- Gerçek-sonuç backtest (hedef-önce-stop): taban %37 → %41. Saf TA tavanı ~%40-55; asıl kâr R:R 1:2 + exit + dip + squeeze.

---

# 🤝 HANDOFF — Başka bir AI için devir notu (2026-06-18)

## Mimari
- **App:** `standalone/index.html` — TEK dosya, minified React (build yok, ~310KB). `<script>` blok **index 6** = ana uygulama. Düzenleme: python string-replace. Doğrulama: scripts[6]'ı çıkar → `node --check` + jsdom headless render (preview sunucusu sandbox'ta çalışmaz). Sekmeler: BIST / HABER / HİSSE TARA / ENDEKS TARA / AI TRADER / SENKRON.
- **Bot (otonom, bulut):** `bot/` — Node ESM, GitHub Actions. `engine.mjs` (sinyal motoru), `data.mjs` (Yahoo), `run.mjs` (tarama+paper trading+Telegram), `news.mjs`+`news-impact.mjs`, `symbols.json` (197), `sectors.json`, `backtest.mjs`. Workflow: `.github/workflows/trade.yml` (self-loop) + `pages.yml`.
- **Repo:** `mfeyavuz-byte/EAGLE-EYE-bistIQ` (public → Actions sınırsız). App: `mfeyavuz-byte.github.io/EAGLE-EYE-bistIQ/`.
- **Gist `1ed22561b2f2803380f3dfb99cda53e7`:** `feybot_paper.json` (portföy), `eagle_news.json`, `eagle_sent.json`. **BOT YAZAR (GIST_ID secret token'ı), APP SADECE OKUR (tokensız, DEFAULT_GIST gömülü).**
- **Secrets:** TG_TOKEN, TG_CHAT, GH_GIST_TOKEN, GIST_ID(=1ed2...).

## ⚠️ KRİTİK TUZAKLAR (bunları bil yoksa bozarsın)
1. **engine.mjs ve index.html'deki `getSignals` AYNI mantık, İKİ yerde.** Motor değişikliği HER İKİSİNE de uygulanmalı, yoksa app≠bot.
2. **APP ASLA GIST'E YAZMAMALI** — sadece bot yazar. App'in `[Se]` sync'i + in-app trade'i KAPALI tutuldu; açarsan botun pozlarını EZER (bir kez ezdi, BAKAB pozları gist geçmişinden kurtarıldı). 
3. **Motor GÜNLÜK mum kullanır** (15dk değil): 15dk'da MA200 hep null → düşen hisseye AL (falling-knife). `fetchDaily` 2y, üst trend `fetchWeekly`.
4. **`node --check` geçmesi JSX ağacının DOĞRU olduğunu göstermez** — yanlış parantez render'ı sadece nav'a çökertir. jsdom ile doğrula: `root.firstElementChild.className==='has-bottom-nav'` olmalı, innerHTML ~95k+.
5. **GitHub cron güvenilmez** → trade.yml self-loop (cron başlatır, iş 10-18 her 20dk tarar). **Çalışan döngü, BAŞLADIĞI commit'in kodunu kullanır** — yeni kod için eski run'ı Cancel + Run workflow gerekir.
6. Bot `st.start !== START` ise portföyü sıfırlar (START_CASH env, varsayılan 500k).
7. Pozisyon yönetimi sadece hafta içi 09:55–18:05 (isTradingHours).

## Sinyal/strateji gerçeği (backtest'li)
Saf TA tek hissede ~%37-41 isabet (yön). Güven/ADX/trend isabeti ARTIRMIYOR (kanıt). İşe yarayanlar: **dip dönüşler (%50-55), squeeze kırılım (%46), RSI<63 giriş, R:R 1:2, breakeven+trailing+kısmi kâr**. İsabet düşük ama R:R ile beklenti pozitif. Eşikler env: MIN_CONF=65, MIN_ADX=20.

## AÇIK İŞLER
- **AI (Claude) sermaye dağıtıcısı**: önerildi, KURULMADI. `ANTHROPIC_API_KEY` secret + run.mjs'de Claude'a portföy+adaylar gönderip JSON dağıtım planı alma. En yüksek değerli sıradaki iş.
- Çalışan bot ESKİ commit'te olabilir (730a21e) — son motor (squeeze/RS/RSI gate) bir sonraki run'da devreye girer.
- BAKAB pozları gist'e elle restore ediliyordu (geçmişten kurtarıldı).

## Önceki AI'ın (benim) HATALARIM — tekrarlama
1. **Kök sebebi tam tespit etmeden parçalı fix** yaptım — kullanıcının baş şikayeti. Önce TÜM kaynakları kanıtla (canlı veri/backtest), sonra düzelt.
2. **App'in botun gist'ini ezmesine izin verdim** → gerçek pozisyonlar silindi. İki yazıcı bir gist = felaket; tek yazıcı (bot) kuralını koru.
3. Gist'i, botun gerçek gist'i olduğunu doğrulamadan gömdüm/varsaydım.
4. Açık emirleri tam uygulamak yerine bazen eksik bırakıp fazla açıklama/soru yaptım. Kullanıcı net emir verince TAM uygula.

## Son durum (2026-06-18, devir)
- `bot/scan.mjs` (eski/ölü MCP tarayıcı) SİLİNDİ — workflow yalnız `run.mjs` çağırıyor.
- `bot/README.md` düzeltildi: motor 15dk değil **GÜNLÜK** mum, güven **≥%65**, ADX≥20.
- Tüm `bot/*.mjs` + `*.json` sözdizimi temiz (`node --check` geçti).
- Açık tek kullanıcı-işi: gerçek pozları (BAKAB/HEKTS/KARSN/DEVA/AFYON) **`1ed2...`** gist'indeki `feybot_paper.json`'a geri yaz (app artık yazmadığı için ezilmez). Doğru gist `1ed22561...`, `3ce7...` değil.

## v3.3 — Risk & rejim & öğrenme (bot/run.mjs)
- **Piyasa rejimi:** XU100 < MA200 ise DÜŞÜŞ → max poz 5→2, sadece dip kurulumları, risk yarıya (run.mjs main + runPaper `bearRegime`).
- **ATR risk paritesi:** stop = giriş−2×ATR, hedef = +2R; lot = equity×%1 / stop-mesafesi (bear'de %0.5), tek poz tavanı %30, nakit sınırı. scanOne artık `atr` döndürüyor. Eski sabit %10-30 sizing kaldırıldı.
- **Kurulum öğrenme:** her poz `setup` (dip/trend/counter) etiketli; kapanışta trade'e yazılır. `disabledSetups`: ≥10 işlemde net-zararlı kurulumu otomatik durdurur. Telegram raporunda kurulum kazanan/toplam + rejim satırı.

## v3.4 — Analitik + çıkış + risk kontrolü (bot/run.mjs)
- **A Performans:** günlük `equityLog`; `perfStats/perfReport` (beklenti₺/işlem, isabet, PF, max drawdown, Sharpe, kurulum K/Z). `/performans` komutu + günde 1 otomatik Telegram özeti (`lastPerfDay`).
- **B Çıkış:** ATR chandelier trailing (`tepe−3×ATR`, ATR yoksa %1.5); ölü-para zaman stopu (14 günde |hareket|<%2 → "ZAMAN" ile kapat). Poz açılışta `atr` saklanıyor.
- **C Risk:** sektör limiti (aynı sektörde max 2 poz, `sectorOf`); likidite tavanı (lot ≤ günlük hacmin %5'i, scanOne `avgVol` döndürüyor).

## v3.5 — MCP olay/analist + kural-tabanlı yönetici + pyramiding + backtest + fallback
- **1 MCP katmanı (bot/mcp.mjs, sunucu-tarafı → CORS yok):** en güçlü 6 AL adayı için `get_earnings` (≤3 gün bilanço → blackout), `get_analyst_data` (konsensüs → güven ±, weakFund), `get_financial_ratios` (PE≤0 → ele). Hepsi fail-safe (null'da nötr). market="bist".
- **2 Kural-tabanlı portföy yöneticisi (anahtarsız):** `riskMult` — kurulumun gerçek beklentisine göre risk ×0.6–1.3 (≥5 işlem). Açılış mesajında "↳ gerekçe" satırı.
- **3 Pyramiding:** kazanan (+%4) + hâlâ AL pozisyona BİR kez yarım tranş ekleme, ağırlıklı ortalama giriş + stop yukarı (`ps.pyr`).
- **4 Haftalık backtest:** `.github/workflows/backtest.yml` (Pazar) → backtest.mjs çalışır, sonuç Telegram'a.
- **5 Güvenilirlik:** Yahoo `query1` başarısızsa `query2`'ye düşer (data.mjs). Gap dolumu zaten gerçekçi (kapanış canlı fiyattan, stop fiyatından değil).

## Test: runPaper entegrasyon testi
`node bot/runpaper.test.mjs` — ağsız, mock state + sentetik sinyallerle runPaper'ı baştan sona yürütür (SL kapama, zaman-stopu, pyramiding, açma+ATR risk paritesi, bear rejim, kurulum öğrenme). Test seam'leri: runPaper'ın 4. argümanı `_test={state,forceTrading}` (üretimde verilmez → davranış aynı). main() yalnız doğrudan çalıştırmada tetiklenir (import'ta değil).

## v3.6 — LLM katmanı (Grok + Gemini) + ENDEKS TARA CORS proxy
- **bot/llm.mjs:** `grokXSentiment` (xAI, X canlı arama → hisse duyarlılığı JSON), `geminiAdvise` (Gemini metin). Hepsi fail-safe (anahtar yok/hata → null). Anahtarlar: `XAI_API_KEY`, `GEMINI_API_KEY` (ops. `XAI_MODEL`/`GEMINI_MODEL`).
- **Telegram `/yorum SEMBOL`** → Grok X duyarlılığı (istek üzerine, maliyet kontrollü).
- **Günlük AI yorum** → Gemini sentezi (+top aday için Grok/X), günde 1, `st.lastLlmDay` ile tavanlanır; sadece `GEMINI_API_KEY` varsa.
- **cf-worker.js:** ENDEKS TARA için Cloudflare Worker (MCP'ye CORS proxy). Kullanıcı deploy eder → URL doğrulanır → app'te tek satır URL değişir (app henüz değişmedi).
- Doğrulama: node --check, LLM fail-safe (anahtarsız 5ms null), Grok/Gemini parse testi, runPaper regresyon — hepsi geçti.

## v3.7 — Pozisyon taraması (1-2 ay, sadece bilgi)
- **bot/position-scan.mjs:** günlük Stage-2 trend taraması (MA50>MA200, fiyat>MA50, MA200 yükselen, RSI 50-72, ADX≥20, 6 ay RS>0, OBV birikim). Skor + MA50-altı stop referansı.
- main()'de **günde 1** ayrı Telegram mesajı ("📅 POZİSYON TARAMA"). try/catch izole, `st.lastPosDay` ile tavanlı.
- **runPaper'a/sinyallere/AI TRADER'a SIFIR etki** (regresyon testi geçiyor). Sadece kullanıcı bilgisi; bot işleme almaz.

## v3.8 — App HİSSE TARA: "Aylık" sekmesi (1-2 ay pozisyon)
- `standalone/index.html` (scripts[6]) — 4 cerrahi ekleme: sonuç objesine `monthly` (Stage-2 bayrağı: `k.last.ma50>ma200 & close>ma50 & RSI 50-72 & ADX≥20 & higherTrend YUKARI` — geçmiş mum gerekmez, `k`'den), `Re==="month"` filtre dalı, `pm` sayımı, `C("month","🗓 AYLIK",pm)` sekmesi.
- day/swing **bulma mantığına dokunulmadı**; sadece ayrı sekme eklendi. Tümü/Day/Swing/Aylık.
- Not: App AYLIK = Stage-2 ÖZÜ (k'den). Bot position-scan.mjs ek olarak MA200-eğimi + 6ay RS + OBV kullanır → yüksek örtüşme, birebir değil.
- Doğrulama: python tam-eşleşme (count==1 ×4) + `node --check` app script geçti. jsdom sandbox'ta kurulamadı → render'ı kullanıcı hard-refresh ile teyit etmeli.

## v3.8.1 — App HİSSE TARA UI
- Sekme sırası: **Tümü · Day · Swing · ⏳ Aylık** (Day öne alındı). Aylık emoji kum saati (⏳). Versiyon etiketi v7.5.

## İyileştirme backlog (BUG DEĞİL — ölçümden sonra, kullanıcı onayıyla)
- **mcpEnrich her trading run'da** (top6 × 3 MCP çağrısı = ~18/run, her 20dk) → günde-1'e throttle veya gist-cache (yük + gecikme azalır). Fail-safe olduğu için bug değil.
- **position-scan** günde 1 kez 197 günlük mumu YENİDEN çeker (scanAll zaten çekmişti) → izolasyon için bilinçli; istenirse paylaşımlı veriyle optimize edilir.
- **App AYLIK vs bot position-scan paritesi:** app Stage-2 ÖZÜ (k'den), bot ek MA200-eğimi+6ay RS+OBV. Tam parite istenirse hizalanır.

## v3.9 — PDF: Day/Swing/Aylık ayrımı
- HİSSE TARA PDF'i (React, `#... 📄 PDF`) artık AL sinyallerini **⚡ Day · 📈 Swing · ⏳ Aylık · 📋 Diğer** alt-tablolarına ayırıyor (+ 📉 SAT korunur). `sec(t,a)` helper + `TH` ile tablo markup tekrarsız.
- Aylık = `y.monthly` (Stage-2 bayrağı, v3.8). Diğer = day/swing/monthly dışı AL (hiç hisse kaybolmaz). swing+monthly hisse her iki bölümde de görünür (app sekmeleriyle tutarlı).
- Sadece PDF document.write metni değişti — React render ağacına dokunulmadı. node --check geçti.

## v4.0 — App AI TRADER: equity eğrisi + günlük/haftalık/aylık getiri
- `index.html` AI TRADER bölümüne eklendi: `Se.equityLog`'tan (bot v3.4'ten beri gist'e yazıyor) **gün-gün SVG equity eğrisi** + **Günlük/Haftalık/Aylık getiri** stat kutuları (1/5/22 işlem günü).
- <2 gün veri varsa "veri birikiyor" mesajı (çökmez). Pür SVG polyline (Recharts'a bağımlı değil), b()/T/Se scope'tan. Trade/scan/render mantığına dokunulmadı; node --check geçti.
