# Changelog

## 2026-11-04 — M0: Kurulum

Yapıldı:
- Vite + TypeScript + Phaser 3 projesi kuruldu (manuel scaffold; `npm create vite` dizin boş olmadığı için interaktif onay istiyordu).
- Vitest kuruldu (`npm test`). Henüz oyun mantığı olmadığı için test dosyası yok; `passWithNoTests: true` ile build kırmıyor. M1'de gerçek testler eklenecek.
- GitHub Actions workflow'u (`.github/workflows/deploy.yml`): `main`'e her push'ta build+test çalışır, `dist/` GitHub Pages'e deploy edilir.
- `index.html` + `src/main.ts`: Phaser `Scale.FIT` + `CENTER_BOTH` ile 720x1280 (9:16 dikey) canvas, pencereye göre ölçekleniyor. `BootScene` boş bir sahne, ortada "Match-3 Prototip" yazısı gösteriyor.
- `vite.config.ts` içinde `base: '/mobile-game/'` ayarlandı (repo adıyla eşleşen GitHub Pages proje sitesi yolu).

Nasıl test edilir:
- `npm install && npm run dev`, tarayıcıda `http://localhost:5173/mobile-game/` adresini aç. Ortada başlık yazısını görmelisin, pencere boyutunu değiştirince canvas dikey oranını koruyarak ölçeklenmeli.
- `npm run build` ve `npm test` hatasız geçmeli.

Bilinen sorunlar / yapılamayanlar:
- Bu oturumda tarayıcı otomasyon aracı (Claude in Chrome) bağlı değildi, dolayısıyla dokunma/kaydırma ve gerçek telefon/tarayıcı görsel testi yapılamadı. Sadece `npm run build`, `npm test` ve curl ile dev server yanıtı doğrulandı. Bir sonraki oturumda veya kullanıcı tarafından telefon/tarayıcıda görsel+dokunma testi yapılmalı.
- GitHub Pages ilk deploy'dan önce repo ayarlarında manuel bir adım gerekiyor (bkz. aşağıdaki not).
