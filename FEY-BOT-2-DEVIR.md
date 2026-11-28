# FEY-BOT-2 DEVİR DOSYASI (2026-11-28, akşam güncellendi)

> ⚠ **GÜNCEL DURUM (2026-11-28 akşam):** §3'teki derleme akışı GEÇERSİZ — `src/feybot_src.jsx` 2026-06-15'ten beri güncellenmedi; oradan derlemek uygulamadaki sonraki tüm işleri (Hisse Kartı penceresi, gist okuma, Kasım düzeltmeleri) SİLER. Uygulama düzenlemeleri doğrudan `standalone/index.html` üzerinde, küçük ve doğrulanmış değişikliklerle yapılır (node --check + jsdom render). §4 ve §5 aşağıda güncellendi. Bot tarafındaki son durum için `PROJECT.md`'nin sonundaki 2026-11-28 notlarına bak.

Yeni oturumda ilk iş bu dosyayı oku, sonra `PROJECT.md`'yi ve hafızadaki `session-state-2026-11-22.md` notunu oku.

---

## 0. KOPYALANABİLİR AÇILIŞ MESAJI

```
fey-bot-2 oturumu. Proje: /Users/fey/Desktop/bist-bot
Önce FEY-BOT-2-DEVIR.md, PROJECT.md ve hafıza notlarını oku. Sonra kısa bir özet ver ve bekleyen işten devam et.
Kurallar: Türkçe konuş. Az token harca. Dediğimin dışına çıkma, kendi kafana göre karar verme.
Emirlerimi önce numaralandırıp say, sonra hepsini harfiyen uygula.
Hatasız çalış: her derlemeden sonra parse ve render doğrulaması yap.
Her işten sonra PROJECT.md'yi güncelle ve sw.js CACHE değerini artır.
standalone-yedek-v7.3 klasörüne asla dokunma.
Başka uygulamaların verilerine erişim izni isteme.
Push'u ben yaparım: commit'i hazırla, komutu ver.
```

---

## 1. ÇALIŞMA KURALLARI (kesin)

1. **Dil:** Her şey Türkçe: cevaplar, özetler, araç açıklamaları, commit mesajları.
2. **Talimat sadakati:** Talimatı harfiyen uygula, yorum katma.
   - "Ayır" denince ayır. Kripto botunda yalnız kripto kalsın, BIST botunda kripto olmasın.
   - Sıralama verildiyse o sırayla uygula (örnek: veri kaynağı 1 MCP, 2 Yahoo, 3 İş Yatırım).
   - Fikir istenirse fikir ver, uygulamaya geçme. Onay gelince uygula.
3. **Emir sayma:** Uzun mesajlarda emirleri önce numaralı listele, sonra hepsini yap. Hiçbirini atlama.
4. **Token:** Az harca. Büyük dosyayı baştan sona okuma, grep ve offset kullan. Uzun rapor yazma.
5. **Kanıt:** Boş söz verme. Yapamadığın işi açıkça söyle (örnek: "gerçek cihazda test edemedim").
6. **Yasaklar:**
   - `standalone-yedek-v7.3/` klasörüne asla dokunma, o dokunulmaz yedek.
   - Başka uygulama ya da bilgisayar verisine erişim izni (computer-use vb.) asla isteme. Kullanıcı bu konuda çok net.
   - Kullanıcının e-posta adresini dış servislere ya da dosyalara yazma.
   - Komisyon hesabı ekleme. Kullanıcı komisyon ödemiyor.
7. **Push:** Bu makinede git push yetkisi yok. Commit'i hazırla, `git push` komutunu kullanıcıya ver.
8. **Kullanıcı profili:** Sabırsız. Hata görünce sert tepki verir. Bu yüzden ilk seferde doğru yap.

---

## 2. PROJE HARİTASI

| Klasör | Ne |
|---|---|
| `standalone/` | **EAGLE EYE: bistIQ**: aktif BIST PWA. Dosyalar: index.html, bot.html (bot sinyalleri sayfası, vade sekmeli), sw.js (`feysbot-v111`), manifest, ikonlar |
| `src/feybot_src.jsx` | ⚠ ESKİ kaynak (2026-06-15). Derleme için KULLANMA — index.html çok ileride |
| `standalone-crypto/` | **kriptoIQ**: ayrı kripto botu. 4 sekme, sw `kriptoiq-v2` |
| `standalone-yedek-v7.3/` | 🔒 DOKUNULMAZ YEDEK |
| `bot/` | GitHub Actions bulut botu (Telegram, AI TRADER, backtest/sim). Ayrıntı PROJECT.md'de |
| `PROJECT.md` | Ana doküman: fazlar, "📦 OTURUM PAKETİ", açık işler |

**Repo:** mfeyavuz-byte/EAGLE-EYE-bistIQ (public, GitHub Pages; önceden Netlify).

---

## 3. UYGULAMA DERLEME AKIŞI (standalone)

```bash
cp src/feybot_src.jsx /tmp/feybot_src.jsx
/tmp/esbuild_pkg/package/bin/esbuild /tmp/feybot_src.jsx --loader:.jsx=jsx --minify --target=es2020 --jsx=transform --jsx-factory=React.createElement --jsx-fragment=React.Fragment --outfile=/tmp/feybot_compiled.js
python3 /tmp/inject.py
```

- **Eksik araçlar:** `/tmp` silinmişse esbuild'i yeniden indir: `https://registry.npmjs.org/@esbuild/darwin-arm64/-/darwin-arm64-0.21.4.tgz`. `inject.py` de silinmişse yeniden yaz. Bu betik index.html'deki en uzun inline `<script>` bloğunu derlenmiş JS ile değiştirir.
- **Doğrulama:**
  - En uzun script'i `node -e "new Function(m)"` ile parse et.
  - jsdom ile headless render yap. `#root` dolu olmalı (innerHTML yaklaşık 95k).
  - Preview sunucusu sandbox'ta EPERM verir, kullanma.
- **SW sürümü:** Her değişiklikte `sw.js` CACHE sürümünü artır.

**Bilinen tuzaklar:**
- **Python replace:** `s.replace` çift backslash bozabilir. Nav'da `₿` gibi ham metin görünür. Brace veya paren dengeli değiştirme kullan.
- **TDZ hatası:** useEffect, deps'teki state'in TANIMINDAN SONRA gelmeli. Aksi halde "Cannot access 'Ge' before initialization" hatası çıkar ve beyaz ekran olur.
- **Minify:** Değişken adlarını değiştirir ve Türkçe karakterleri `\uXXXX` yapar. grep yaparken bunu hesaba kat.
- **Erken kapanan kök:** Kök `createElement` erken kapanırsa sadece nav render olur ve hata vermez. Bu durumu jsdom ile kontrol et.
- **Yeni özellik eklerken:** Derin ağaca cerrahi ekleme yerine ayrı bileşen yazıp temiz bir sınırda render etmek daha güvenli.

**State adları (kaynakta):**
- `t`/`i`: page / setPage
- `e`: setSel
- `Y`/`ie`: scanResults
- `_e`/`Qt`: sigHistory
- `pap`: paper
- `T`: tema paleti

---

## 4. UYGULAMANIN ŞU ANKİ HALİ (v7.6)

- **Kimlik:**
  - Ad: **EAGLE EYE: bistIQ** (büyük harf). Eski "FeyBot/FEY-AI" adlarının hepsi kaldırıldı.
  - AI'ın adı "EAGLE EYE AI".
  - Logo kullanıcının kartal logosu. Header'da 48px logo ve 32px "EAGLE EYE" yazısı var.
- **Tema:** Açık tema varsayılan. Dark/light butonu topbar'da. Sıra: saat ↻ → 🌙/☀️ → 🤖 AI → 🔔.
- **Bottom nav (5 sekme, 2026-11-28):** BIST · HİSSE TARA · ENDEKS TARA · AI TRADER · SENKRON. Sol altta "🤖 Bot sinyalleri" → bot.html.
  - SİNYAL nav'ı kaldırıldı ama kodda duruyor.
  - Geri eklemek için: `React.createElement(NavBtn,{id:"signals",page:t,setPage:i,icon:"📶",label:"SİNYAL",badge:_e.length})`
- **Veri:** Akıllı sıralama kullanılıyor.
  - Günlük veri: 1 Borsa MCP (period 2y), 2 Yahoo (proxy), 3 İş Yatırım.
  - Gün içi (m/h): Yahoo önce.
- **Haber:**
  - 4 katmanlı çekme: rss2json → allorigins → cors.lol → codetabs.
  - Yükleme sıralı, 260 ms aralıkla.
  - `analyzeNewsImpact` AI yorumu üretir.
- **SİM (Paper trader):** K/Z hesaplar, EmailJS ile mail atar. Komisyon yok.
- **TARA:** Butonlar: ▶ TARA, 🤖 AI ÖNERİSİ, 📄 PDF (AL/SAT tabloları).
- **KART:**
  - Vanilla overlay (`#bmcp-overlay`, `window.borsaMCP`).
  - Butonlar: quick/scan/pivot/tech/div/news/corp/macro/search/firsat/portfoy.
- **MCP:**
  - Uygulama hâlâ eski adresi kullanıyor: `borsamcp.fastmcp.app/mcp`. Bu bilerek yapıldı: yeni sunucuda CORS yok.
  - Bulut botu yeni sunucuyu kullanıyor: `borsa.surucu.dev/mcp`.

---

## 5. BEKLEYEN İŞ

**KART taşıma — TAMAMLANDI (2026-11-28, commit 20d5a7d):** KART nav sekmesi zaten yoktu; hisse detayına "📋 KART" düğmesi (`window.bmcpOpen`); ENDEKS TARA'da numaralı düğmeler (1 Aşırı Satım · 2 Yükseliş Momentumu · 3 Düşüş Momentumu · 4 Trend AL · 5 T3 AL · 6 Yüksek Hacim · 7 Aşırı Alım · 🔥 Bugünün Fırsatları) + 📄 PDF. sw v110→v111.

**Sonraki (sıra bekliyor):**
- İndikatör gürültüsünü azalt.
- Price action ekle (borsaninizinden.com modeli).

**Bulut botu açık işleri:** PROJECT.md §9 ve hafızadaki `session-state-2026-11-22.md`.
- Push durumu.
- Gist token.
- Ölçüm tabanı.
- Pazartesi 10:00 raporunun kontrolü.

---

## 6. ANAHTARLAR / UÇLAR

- **EmailJS:** service_c4ytizq / template_v35f6eq / 78D7vQHmRuhtjqUtF. Bunlar kodda yazılı.
- **Secret'lar (GitHub):** TG_TOKEN, TG_CHAT, GH_GIST_TOKEN, GIST_ID, XAI, GEMINI.
- **MCP preset'leri:** oversold, overbought, bullish_momentum, bearish_momentum, supertrend_bullish, t3_bullish, high_volume.
- **MCP endeksleri:** XU100, XU030, XBANK, XUSIN.
