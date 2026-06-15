# 🦅 EAGLE EYE — Otonom Sinyal Botu

GitHub Actions üzerinde **kendi kendine** çalışır. PC/telefon açık olmasına gerek yok.
Uygulamanın kullandığı **aynı MCP tarayıcısını** çağırır, sinyalleri **Telegram'a** iter.

## Nasıl çalışır
- `.github/workflows/trade.yml` → hafta içi 3 kez (açılış / öğle / kapanışa yakın) tetiklenir.
- `bot/scan.mjs` → `XU100` için `bullish_momentum` + `oversold` taraması yapar, en güçlü 8 hisseyi Telegram'a yollar.
- Gist hafızası (opsiyonel) → aynı gün aynı sinyali tekrar göndermez (spam yok).

## Kurulum (5 dakika)

### 1. Telegram botu
1. Telegram'da **@BotFather** → `/newbot` → token al (`123456:ABC...`).
2. **@userinfobot**'a yaz → **chat ID**'ni al (`123456789`).

### 2. GitHub'a yükle
```bash
cd bist-bot
git init && git add . && git commit -m "EAGLE EYE bot"
gh repo create eagle-bist-bot --private --source=. --push
```

### 3. Secrets ekle
Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Zorunlu | Değer |
|---|---|---|
| `TG_TOKEN` | ✅ | BotFather token'ı |
| `TG_CHAT` | ✅ | userinfobot chat ID |
| `GH_GIST_TOKEN` | opsiyonel | `gist` izinli Personal Access Token (spam önleme için) |
| `GIST_ID` | opsiyonel | Boş bir secret gist'in ID'si |

### 4. Test et
Repo → **Actions → EAGLE EYE → Run workflow** → birkaç saniye sonra Telegram'a mesaj düşmeli.

## Yerel test
```bash
TG_TOKEN=xxx TG_CHAT=yyy node bot/scan.mjs
```

## Ayarlanabilir env
- `INDEX` — `XU100` (varsayılan), `XU030`, `XBANK`, `XUSIN`
- `PRESETS` — virgülle: `bullish_momentum,oversold,supertrend_bullish`
- `TF` — `1d` (varsayılan)
- `TOP_N` — kaç hisse listelensin (varsayılan 8)

> ⚠ Yatırım tavsiyesi değildir. Veriler ~15dk gecikmeli olabilir.
