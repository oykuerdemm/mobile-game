# Changelog

## 2026-11-04 — M3: Özel taşlar

Yapıldı (backlog sırasına göre 4 madde, 4 ayrı commit):
- **4'lü eşleşme → satır/sütun temizleyici**: `src/game/logic/specials.ts`'de `analyzeMatchShapes()` bir hamlenin oluşturduğu koşuları (run) inceliyor; düz 4'lü bir koşu, swap pozisyonunda (cascade'lerde koşunun ortasında) bir `RowClear`/`ColClear` özel taşı doğuruyor. Bu pozisyon normal silinmeden hariç tutulup "yükseltiliyor".
- **L/T eşleşmesi → bomba**: Yatay ve dikey bir koşunun (ikisi de 3+) tek bir hücrede kesiştiği durumlar tespit edilip o kesişim noktasında bir `Bomb` doğuyor (3x3 alan temizler, düz 4'lü kuraldan önceliklidir).
- **5'li eşleşme → renk temizleyici**: 5+ uzunluğundaki bir koşu, kendi rengindeki (ve sadece L/T'ye dahil olmayan) durumda bir `ColorClear` doğuruyor; aktive olunca tahtadaki o renkteki TÜM taşları temizliyor.
- **Özel taşların kombinasyonu**: İki özel taşı doğrudan birbirine sürüklemek, normal bir eşleşme oluşturmasa bile her zaman geçerli bir hamle sayılıyor; ikisi birden aktive olup etkilerinin birleşimini (ve varsa zincirleme başka özel taşları) tetikliyor.

Mimari: özel taşlar, renk tahtasının (`Grid`) ÜSTÜNE binen paralel bir `SpecialBoard` olarak tutuluyor — böylece M1/M2'de yazılan eşleşme/yerçekimi/doldurma mantığı hiç değişmedi. `expandWithSpecials()` bir eşleşen/kombine edilen hücre kümesinden başlayıp BFS ile zincirleme aktivasyonu uyguluyor (bir özel taşın patlaması başka birini açığa çıkarıp onu da patlatabilir). Özel taşlar için prosedürel görseller eklendi (yuvarlatılmış çubuk, halkalı daire, 8 köşeli parıltı — hepsi taşın kendi renginde, beyaz kontur ile). Tahta karıştırılınca (hamle kalmadığında) tüm özel taşlar sıfırlanıyor.

Oyun mantığı tamamen saf TypeScript (`src/game/logic/specials.ts`), Vitest ile 19 yeni test.

Nasıl test edilir:
- `npm run dev`, bir level oyna. 4'lü bir eşleşme oluşturduğunda beyaz konturlu bir "çubuk" taş belirmeli; o taş sonradan başka bir eşleşmeye dahil olduğunda tüm satırı/sütunu temizlemeli. L/T şeklinde eşleşme halkalı bir "bomba" taşı, 5'li eşleşme parıltılı bir taş doğurmalı. İki özel taşı yan yana sürükleyip birbirine değiştirmek büyük bir temizlemeye yol açmalı.
- `npm test` (64 test) ve `npm run build` hatasız geçmeli.

Bilinen sorunlar / yapılamayanlar:
- Her 4 özellik de tarayıcıda gerçek oynanışla VE (nadir senaryoları güvenilir tetiklemek için) geçici bir debug hook üzerinden manuel olarak doğrulandı; debug hook commit'lenmeden önce kaldırıldı.
- Özel taş kombinasyon kuralları basitleştirildi: her kombinasyon, iki özel taşın kendi etkilerinin birleşimi (union) olarak uygulanıyor — klasik match-3 oyunlarındaki her çift için özel/bambaşka bir efekt (ör. iki renk-temizleyici → tüm tahtayı temizle) yok, prototip kapsamında yeterli görüldü.

## 2026-11-04 — Playtest düzeltmeleri (menü, anında eşleşme, zorluk eğrisi)

Playtest notlarına (PLAN.md) göre 3 düzeltme, 3 ayrı commit:
- **Menü butonu**: Level oynanırken (bitmeden) üstte her zaman görünen bir "Menü" butonu eklendi, level seçimine dönmeyi sağlıyor.
- **Yeni gelen taşların anında eşleşmesi azaltıldı**: `refill()` artık opsiyonel bir `avoidMatchChance` (0-1) parametresi alıyor — bu olasılıkla yeni taş, komşularıyla (üst/alt/sol/sağ, ayrıca iki komşu arasında "sandviç" olma durumu dahil) anında eşleşme tamamlamayacak bir tipten seçiliyor; aksi halde tamamen rastgele. `src/game/logic/difficulty.ts`'deki `DEFAULT_DIFFICULTY.refillAvoidMatchChance = 0.7` ile kontrol ediliyor — zorluk ileride tek bir sayı değiştirilerek ayarlanabilir. Varsayılan değer 0 (eski tam rastgele davranış), `GameScene` gerçek değeri açıkça geçiyor.
- **Hamle sayıları ve hedefler yeniden dengelendi**: Eski level tasarımı (hedef 15-30 arası, hamle 15-25 arası) matematiksel olarak tutarsızdı — son levellar pratikte kazanılamazdı (ör. level 10'da 15 hamlede 30 taş toplamak gerekiyordu, gerçekçi toplama hızı ~1 taş/hamle). Gerçek tahta mantığına karşı atılan rastgele-ama-geçerli-hamle simülasyonuyla (geçici, commit'lenmemiş bir test dosyasıyla) kalibre edildi: her level artık sabit 12 taş hedefliyor (renk level'dan level'a dönüşümlü), hamle limiti 21'den 13'e kadar düşüyor (21,20,19,18,18,17,16,15,14,13). Rastgele oynanışla simüle edilen kazanma oranı level 1'de %98 (ortalama 8.9 hamle fazlalıkla), level 10'da %65 (ortalama 1.1 hamle fazlalıkla) — gerçek bir oyuncu hedef rengi gözeteceği için bu oranların üzerinde kalır.

Nasıl test edilir:
- `npm run dev`, Level 1'i aç: üstte "Menü" butonu görünmeli, tıklanınca level seçimine dönmeli. "0/12" ve "Hamle: 21" görünmeli.
- `npm test` (45 test) ve `npm run build` hatasız geçmeli.

Bilinen sorunlar / yapılamayanlar:
- Zorluk eğrisi rastgele-hamle simülasyonuyla kalibre edildi, gerçek bir insan oyuncunun 10 level'ı baştan sona oynaması ile doğrulanmadı (zaman kısıtı). Oynarken çok kolay/zor hissederse PLAN.md'ye not düşülüp `DEFAULT_DIFFICULTY` veya level JSON'ları buna göre ayarlanabilir.

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

## 2026-11-04 — Animasyon hızı ayarı

Playtest geri bildirimi: swap/silme/düşme/karıştırma animasyonları yavaş hissettiriyordu. `GameScene` içindeki tüm süre sabitleri ~%20 kısaltıldı (örn. swap 140ms→112ms, düşme taban süresi 90ms→72ms). Davranış aynı, sadece daha hızlı. `npm test` ve `npm run build` ile doğrulandı, tarayıcıda bir swap+eşleşme denendi.

## 2026-11-04 — M2: Level yapısı

Yapıldı (backlog sırasına göre 5 madde, 5 ayrı commit):
- **Hamle limiti + hedef**: `src/game/logic/level.ts`'de `LevelConfig`/`SessionState`/`createSession`/`applyMove` — saf TypeScript, Vitest ile test edildi. Bir level'ın hamle limiti ve tek renkli bir toplama hedefi (`{type, count}`) var; her geçerli swap bir hamle harcıyor ve temizlenen hedef-renkli taşları sayıyor.
- **Üst HUD**: Canvas'ın üstünde 200px'lik bir bant: solda hedef taşının ikonu + "toplanan/hedef", sağda "Hamle: N". Tahta bu bandın altında ortalanıyor.
- **Kazanma/kaybetme ekranı**: Session durumu `playing` olmaktan çıkınca yarı saydam bir overlay ve "Kazandın!"/"Kaybettin" yazısıyla "Tekrar Dene" butonu çıkıyor (sahneyi aynı level ile yeniden başlatıyor).
- **JSON'dan 10 level**: `src/levels/level-01.json` .. `level-10.json`, her biri `{id, moveLimit, goal}`. `src/game/logic/levels.ts` bunları yükleyip `LevelConfig[]`'e çeviriyor (Vitest ile test edildi). `GameScene` artık sahne verisinden gelen `levelId`'ye göre gerçek level'ı oynuyor.
- **Level seçim ekranı + ilerleme kaydı**: Yeni `LevelSelectScene` (artık başlangıç sahnesi) 10 level'ı 5x2 bir ızgarada listeliyor; oyuncunun ilerisindeki level'lar kilitli/soluk görünüyor. `src/game/logic/progress.ts`'deki `loadUnlockedLevel`/`markLevelCompleted` localStorage'a yazıp okuyor (test edilebilir olsun diye enjekte edilebilir bir storage arayüzü üzerinden, Vitest ile test edildi). Kazanma ekranına "Sonraki Level" ve "Level Seçimi" butonları eklendi; kazanınca bir sonraki level otomatik açılıyor.

Nasıl test edilir:
- `npm run dev`, `http://localhost:5173/mobile-game/` adresini aç. Başlangıçta sadece Level 1 açık olmalı. Level 1'i oyna: üstte hedef taş ikonu + sayaç ve kalan hamle görünmeli, bunlar her geçerli swap'ten sonra güncellenmeli.
- Level'ı kazanınca "Kazandın!" ve "Sonraki Level"/"Tekrar Dene"/"Level Seçimi" butonları çıkmalı; "Sonraki Level" doğru level verisini yüklemeli; level seçimine dönünce bir sonraki level artık açık görünmeli (tarayıcıyı kapatıp açsan bile, localStorage'da kalıcı).
- Hamle biterken hedefe ulaşılmazsa "Kaybettin" ekranı çıkmalı (sadece "Tekrar Dene" ve "Level Seçimi", "Sonraki Level" yok).
- `npm test` (42 test) ve `npm run build` hatasız geçmeli.

Bilinen sorunlar / yapılamayanlar:
- Level oynanırken (bitmeden) level seçimine dönecek bir buton yok — bkz. PLAN.md Öneriler.
- Manuel tarayıcı testinde gerçek bir kazanmayı tetiklemek için, taşların canvas'taki tam piksel konumunu tahmin etmek yerine geçici bir debug hook (`window.__scene`) ile sahnenin gerçek tahta durumuna bakıp geçerli bir hamle hesaplandı; bu hook commit'lenmeden önce kaldırıldı. Gerçek bir telefonda parmakla oynanarak ek bir tur test edilmedi.
