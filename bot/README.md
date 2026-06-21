# 🦅 EAGLE EYE — Otonom Motor Botu

GitHub Actions üzerinde **kendi kendine** çalışır. PC/telefon kapalı olabilir.
Uygulamanın **kendi motorunu** (getSignals, 19 indikatör) buluta taşır.

## Ne yapar
1. **197 BIST hissesini** uygulamadaki AYNI motorla tarar → **AL/SAT sinyalleri** → Telegram
   (HİSSE TARA'nın aynısı — GÜNLÜK mum + haftalık üst-trend, güven ≥ %65, ADX ≥ 20)
2. **AI TRADER** sanal portföyünü yönetir → pozisyon **açar/kapatır** (TP / Zarar Durdur / Trailing / SAT sinyali) → Telegram
3. Hafta içi 10:00 / 12:00 / 14:00 / 16:00 / 18:00 (İstanbul) otomatik çalışır

Dosyalar:
- `engine.mjs` — uygulamadan birebir çıkarılmış motor (saf JS)
- `data.mjs` — Yahoo Finance veri (günlük sinyal 2y + haftalık üst-trend, doğrudan)
- `run.mjs` — tarama + paper trading + Telegram
- `symbols.json` / `sectors.json` — BIST hisse listesi + sektör eşlemesi

## Kurulum

### 1. Telegram (zaten yaptıysan atla)
- **@BotFather** → `/newbot` → token al
- **@userinfobot** → chat ID al
- Kendi botuna `/start` bas

### 2. Gist (AI TRADER için ZORUNLU)
Sanal portföy ve sinyal hafızası burada saklanır. Olmadan AI TRADER çalışmaz (her run sıfırlanır).
1. **Personal Access Token (gist izinli):** github.com → Settings → Developer settings → Personal access tokens → **Tokens (classic)** → Generate new → sadece **`gist`** kutusunu işaretle → oluştur → kopyala.
2. **Boş bir gist:** gist.github.com → dosya adı `feybot_paper.json`, içerik `{}` → **Create secret gist** → URL'deki ID'yi kopyala (`gist.github.com/kullanıcı/SUNU_KOPYALA`).

### 3. Secrets ekle
Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Zorunlu | Değer |
|---|---|---|
| `TG_TOKEN` | ✅ | BotFather token |
| `TG_CHAT` | ✅ | userinfobot chat ID |
| `GH_GIST_TOKEN` | ✅ (AI TRADER için) | gist izinli PAT |
| `GIST_ID` | ✅ (AI TRADER için) | boş gist'in ID'si |

### 4. Test
Actions → **EAGLE EYE — Otonom Motor Botu** → Run workflow → ~15 sn → Telegram'a sinyaller + (varsa) işlem bildirimi düşer.

## Yerel test
```bash
TG_TOKEN=xxx TG_CHAT=yyy GH_GIST_TOKEN=zzz GIST_ID=www node bot/run.mjs
```

> ⚠ Yatırım tavsiyesi değildir. Veriler ~15dk gecikmeli olabilir. Sanal portföy gerçek para değildir.

---

## 🆕 Yeni özellikler (motor botu v2)

- **Haber-duyarlı sinyaller**: RSS haberlerinin hisse/sektör etkisi ölçülür (`news-impact.mjs`); pozitif haber AL güvenini artırır, negatif azaltır (±15 puan). Mesajda `📰+` / `📰-` etiketi.
- **Akıllı çıkış**: +%2'de stop girişe çekilir (**breakeven** — kâr garanti); ilk hedefte **yarısı satılır**, kalan trailing'e bırakılır.
- **Sizing**: güvene göre %10–%30, en fazla 5 pozisyon, en güçlü + en yüksek potansiyelli AL'lar seçilir.
- **Telegram komutları**: bota `/durum` veya `/pozisyonlar` yaz → anlık portföy + açık pozisyonlar + K/Z cevabı (her run getUpdates ile, ~20dk içinde).
- **Sağlık alarmı**: tarama 0 sinyal verirse rapora uyarı; bot çökerse Telegram'a "⚠ HATA".

## ⏱ Çalışma garantisi (dış cron — opsiyonel ama önerilir)
GitHub'ın kendi cron'u tetikleri atlayabilir. Self-loop bunu büyük ölçüde çözer ama %100 garanti için ücretsiz **cron-job.org**:
1. github.com → Settings → Developer settings → **Fine-grained token** → repo `EAGLE-EYE-bistIQ` → **Actions: Read and write** izni → oluştur.
2. **cron-job.org** (ücretsiz üyelik) → Create cronjob:
   - URL: `https://api.github.com/repos/mfeyavuz-byte/EAGLE-EYE-bistIQ/actions/workflows/trade.yml/dispatches`
   - Method: **POST**
   - Headers: `Authorization: Bearer <token>` · `Accept: application/vnd.github+json`
   - Body: `{"ref":"main"}`
   - Schedule: hafta içi 10:00 İstanbul (loop gerisini halleder)
3. Bu, GitHub'a güvenmeden botu garanti başlatır.

## Başlangıç sermayesi
Varsayılan **500.000₺**. Değiştirmek için workflow env'e `START_CASH: "1000000"` ekle. Sıfırlamak için Gist'teki `feybot_paper.json`'u `{}` yap.

## 🤖 LLM katmanı (opsiyonel — Grok + Gemini)
Anahtar yoksa sessizce atlanır; bot anahtarsız tam çalışır. Eklemek için Secrets:

| Secret | Ne için |
|---|---|
| `GEMINI_API_KEY` | Günlük AI yorum (Gemini sentezi). aistudio.google.com → ücretsiz key |
| `XAI_API_KEY` | `/yorum SEMBOL` → Grok'un X/Twitter gönderilerine göre duyarlılık yorumu. console.x.ai |
| `XAI_MODEL` / `GEMINI_MODEL` | (ops.) model override; varsayılan `grok-4` / `gemini-2.0-flash` |

- **`/yorum ASELS`** → Grok, X'te son gönderileri canlı tarayıp duyarlılık + kısa yorum döndürür (istek üzerine; maliyet sadece sorunca).
- **Günlük AI yorum** → Gemini, portföy + adaylar + rejim + (Grok/X duyarlılığı) sentezini günde 1 Telegram'a yazar.
