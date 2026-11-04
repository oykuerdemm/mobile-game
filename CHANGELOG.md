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

Doğrulama (güncelleme):
- GitHub Pages ayarlarında "Source: GitHub Actions" seçilip ilk deploy tetiklendi; `https://oykuerdemm.github.io/mobile-game/` canlı (HTTP 200).
- Claude in Chrome ile görsel kontrol yapıldı: hem geniş ekranda hem telefon boyutunda (390x844) canvas dikey oranını koruyarak ortalanıp ölçekleniyor, "Match-3 Prototip" yazısı ortada görünüyor.

Bilinen sorunlar / yapılamayanlar:
- Gerçek bir fiziksel telefonda dokunma/kaydırma testi henüz yapılmadı (tarayıcı simülasyonuyla doğrulandı). M1'de dokunma ile taş kaydırma eklenince tekrar kontrol edilmeli.

## 2026-11-04 — M1: Çekirdek tahta

Yapıldı (backlog sırasına göre 8 madde, 8 ayrı commit):
- **8x8 tahta + 5 taş tipi**: `src/game/logic/types.ts`'de `TileType` (Red/Blue/Green/Yellow/Purple). Her tip hem renk hem şekille ayırt ediliyor (daire/kare/üçgen/elmas/yıldız — `src/game/render/textures.ts`'de prosedürel olarak Phaser Graphics ile çiziliyor, dışarıdan asset yok).
- **Eşleşmesiz başlangıç tahtası**: `generateBoard()` hücreleri satır-sütun sırayla doldururken sol/üst komşularla 3'lü oluşturacak tipi eliyor. 200 seed üzerinden "hiç eşleşme yok" testiyle doğrulandı.
- **Kaydırarak yer değiştirme**: `GameScene` her taşı interaktif sprite yapıyor, sürükleme yönünü (yukarı/aşağı/sağ/sol) algılayıp komşu hücreyle swap tetikliyor.
- **Eşleşme tespiti + geçersiz hamlede geri dönme**: `findMatches()` (yatay+dikey 3+ koşu tarayıcı) ve `isValidSwap()`. Geçersiz swap `Back.easeOut` ile zıplayarak geri dönüyor.
- **Silme + yerçekimi + yeniden doldurma**: `clearMatches()`, `applyGravity()`, `refill()`. Sahnede taşlar küçülüp siliniyor, kalanlar sütun içinde düşüyor, üstten yeni taşlar geliyor.
- **Zincirleme eşleşmeler**: `resolveCascade()` eşleşme kalmayana kadar clear/gravity/refill'i tekrarlıyor. Testte, bir eşleşmenin temizlenmesinin başka bir sütunda yeni bir eşleşmeyi ortaya çıkardığı senaryo kurgulanıp doğrulandı.
- **Hamle kalmadığında karıştırma**: `hasAvailableMove()` + `shuffleBoard()` (aynı taş çoklu kümesini, eşleşmesiz ve en az bir hamle garantili olacak şekilde yeniden dağıtıyor, 200 denemede bulamazsa `generateBoard()`'a düşüyor). Oyun içinde "Hamle kalmadı, karıştırılıyor..." mesajıyla gösteriliyor.
- **Animasyon kalitesi**: swap/geri-dönüş/silme için farklı easing'ler (Back.easeOut geri dönüşte "ret" hissi versin diye), düşme süresi artık düşülen mesafeyle orantılı (sabit süre yerine).
- Yol boyunca bulunan bir hata da düzeltildi: taş sprite'larının pointerdown handler'ı oluşturulduğu andaki row/col'u closure'da sabit tutuyordu; taş swap/gravity ile hareket ettikçe bu bayatlıyordu. Artık `sprite.getData()` ile anlık pozisyon okunuyor.

Oyun mantığı (`src/game/logic/board.ts`) tamamen Phaser'dan bağımsız, saf TypeScript; Vitest ile 27 test (`npm test`).

Nasıl test edilir:
- `npm run dev`, `http://localhost:5173/mobile-game/` adresini aç (veya canlı: `https://oykuerdemm.github.io/mobile-game/`).
- Bir taşı komşusuna doğru sürükle: eşleşme oluşturuyorsa taşlar yerinde kalıp eşleşenler silinmeli, düşüp yeni taşlarla dolmalı; oluşturmuyorsa taşlar zıplayarak eski yerine dönmeli.
- `npm test` (27 test) ve `npm run build` hatasız geçmeli.

Bilinen sorunlar / yapılamayanlar:
- "Hamle kalmadı" karıştırma akışı birim testleriyle doğrulandı ama 8x8 tahtada organik oyunla bu durumu elle tetiklemek pratik değildi; uçtan uca görsel doğrulama yapılmadı.
- Gerçek fiziksel telefonda dokunma testi hâlâ yapılmadı (Claude in Chrome ile masaüstü tarayıcı simülasyonu kullanıldı).
- Henüz skor, hamle limiti, hedef yok — bunlar M2'de geliyor.
