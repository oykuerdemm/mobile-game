# Match-3 Prototip — Plan

## Vizyon
Mobil (dikey ekran) için oynanabilir, akıcı bir match-3 oyunu. Amaç iki katmanlı:
1. **Portfolyo:** Oyun şirketlerinde product rolü için; hipotez kurma, metrik takibi ve iterasyonu gösteren bir proje.
2. **Ürün:** Oyun oturursa App Store'a çıkarılabilecek bir temel.

İlk aşama düz bir match-3. Kişiselleştirme (oyuncunun kendi seçtiği semboller, burç sembolleri, koleksiyon meta'sı) çekirdek oturduktan sonra eklenecek.

## Kurallar
- Tüm görseller, isimler ve semboller **özgün** olacak. Başka oyunların (Royal Match, Royal Kingdom vb.) asset'leri, logoları, karakterleri veya isimleri kullanılmaz.
- Her zaman tarayıcıdan, telefonda oynanabilir bir sürüm yayında olacak.

## Teknik
- **Stack:** Vite + TypeScript + Phaser 3
- **Hedef ekran:** Dikey, 9:16, telefon tarayıcısı (dokunma ve kaydırma ile oynanır)
- **Mimari:** Oyun mantığı (tahta, eşleşme, düşme, özel taşlar) Phaser'dan bağımsız saf TypeScript modüllerinde. Phaser sadece çizim, animasyon ve input için.
- **Test:** Oyun mantığı Vitest ile test edilir.
- **Yayın:** GitHub Actions ile her push'ta GitHub Pages'e deploy.
- **Level verisi:** JSON dosyaları (`src/levels/`).

## Backlog
Sırayla yapılır. Her oturum bir sonraki işaretlenmemiş maddeyi alır.

### M0 — Kurulum
- [x] Vite + TypeScript + Phaser projesi, Vitest kurulumu
- [x] GitHub Actions ile GitHub Pages deploy
- [x] Dikey ekran, ölçeklenen canvas, boş oyun sahnesi

### M1 — Çekirdek tahta
- [x] 8x8 tahta, 5 farklı taş rengi/şekli (renk körlüğü için şekiller de farklı)
- [x] Başlangıçta hazır eşleşme olmayan tahta üretimi
- [x] Komşu taşları kaydırarak/dokunarak yer değiştirme
- [x] 3+ eşleşme tespiti (yatay ve dikey), geçersiz hamlede taşların geri dönmesi
- [x] Eşleşen taşların silinmesi, yerçekimi, yeni taşların yukarıdan dolması
- [x] Zincirleme (cascade) eşleşmeler
- [x] Hamle kalmadığında tahtanın karıştırılması
- [x] Temel animasyonlar (swap, silinme, düşme)

### M2 — Level yapısı
- [x] Hamle limiti ve hedef (ör. 20 kırmızı taş topla)
- [x] Üst barda hedef ve kalan hamle göstergesi
- [x] Kazanma / kaybetme ekranları, tekrar dene
- [x] JSON'dan level yükleme, 10 level
- [x] Basit level seçim ekranı ve ilerlemenin kaydedilmesi (localStorage)

### M3 — Özel taşlar
- [ ] 4'lü eşleşme: satır veya sütunu temizleyen taş
- [ ] L/T eşleşmesi: çevresini patlatan taş
- [ ] 5'li eşleşme: seçilen renkteki tüm taşları temizleyen taş
- [ ] Özel taşların birbiriyle kombinasyonları

### M4 — Engeller
- [ ] Yanında eşleşme yapılınca kırılan kutu (1 ve 2 katmanlı)
- [ ] Engel içeren hedefli level'lar

### M5 — His (juice)
- [ ] Partiküller, ekran sarsıntısı, zincirleme combo efektleri
- [ ] Ses efektleri ve aç/kapa
- [ ] Kazanırken kalan hamlelerin özel taşa dönüşmesi

### M6 — Analytics
- [ ] Event loglama katmanı: `level_start`, `level_complete`, `level_fail`, `moves_used`, `quit_mid_level`, `session_start`
- [ ] Event'lerin bir analitik servisine gönderilmesi (karar verilecek)
- [ ] Basit funnel: hangi level'da oyuncular bırakıyor

### M7 — Kişiselleştirme (ana hipotez)
- [ ] Hipotez ve metrikler bu aşamadan önce birlikte netleştirilecek
- [ ] Taş/obje sembollerinin oyuncu tarafından seçilmesi
- [ ] Burç sembolleri seti
- [ ] Sembollerin kazanılması / açılması (koleksiyon)

## Öneriler
Oturumlar sırasında akla gelen ama backlog'da olmayan fikirler buraya yazılır. Onaylanmadan uygulanmaz.

## Playtest notları
Oynadıktan sonra notlarını buraya yaz. Bir sonraki oturum bunları okur ve gerekirse backlog'a ekler.


### 2026-11-04
- Animasyonlar biraz yavaş, hafifçe hızlandırılmalı (swap, silinme, düşme)
- Taş boyutu telefonda iyi
- Hata fark etmedim
- Zincirleme eşleşmeler normal hissettiriyor

### 2026-11-04 (M2)
- Level'lar çok kolay, hamle sayısı fazla
- Yeni gelen taşlar çok sık hemen eşleşiyor, bir hamlede bir iki satır siliniyor
- Menü düzeni iyi