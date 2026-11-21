// ÇALIŞMA KAPISI — GitHub'ın zamanlanmış (cron) tetikleri saatlerce gecikebiliyor
// (2026-11 ölçümü: 8–10 saat; 09:45'e kurulu tetikler 18:45–23:00'te geliyordu → bot sabah hiç çalışmıyordu).
// Bu yüzden tetiğin geldiği saate güvenilmez: her koşu İstanbul saatine bakıp kendisi karar verir.
// Çıktı: "skip" = seans dışı, hiçbir şey yapma · N = N saniye bekle, sonra taramaya başla (0 = hemen).
// Kullanım: node bot/gate.mjs [epochSaniye]   (verilmezse şimdi)
import { pathToFileURL } from "node:url";

export const OPEN = 600, CLOSE = 1080, MAX_WAIT = 300;   // dakika: 10:00 açılış · 18:00 kapanış · açılışı en çok 5 sa bekle

export function gate(d = new Date()) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Istanbul", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
  const v = t => p.find(x => x.type === t).value;
  if (v("weekday") === "Sat" || v("weekday") === "Sun") return "skip";
  const m = (+v("hour") % 24) * 60 + +v("minute");
  if (m >= OPEN && m < CLOSE) return 0;                                                  // seans: hemen tara
  if (m < OPEN && OPEN - m <= MAX_WAIT) return (OPEN - m) * 60 - d.getUTCSeconds();       // açılış öncesi: 10:00'ı bekle
  return "skip";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv[2];
  console.log(String(gate(a ? new Date(+a * 1000) : new Date())));
}
