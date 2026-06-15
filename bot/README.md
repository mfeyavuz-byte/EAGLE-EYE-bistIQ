# 🦅 EAGLE EYE — Otonom Motor Botu

GitHub Actions üzerinde **kendi kendine** çalışır. PC/telefon kapalı olabilir.
Uygulamanın **kendi motorunu** (getSignals, 19 indikatör) buluta taşır.

## Ne yapar
1. **197 BIST hissesini** uygulamadaki AYNI motorla tarar → **AL/SAT sinyalleri** → Telegram
   (HİSSE TARA'nın aynısı — 15m mum + günlük üst-trend, güven ≥ %50)
2. **AI TRADER** sanal portföyünü yönetir → pozisyon **açar/kapatır** (TP / Zarar Durdur / Trailing / SAT sinyali) → Telegram
3. Hafta içi 10:00 / 12:00 / 14:00 / 16:00 / 18:00 (İstanbul) otomatik çalışır

Dosyalar:
- `engine.mjs` — uygulamadan birebir çıkarılmış motor (saf JS)
- `data.mjs` — Yahoo Finance veri (15m + günlük, doğrudan)
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
