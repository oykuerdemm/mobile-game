# Claude Code talimatları

Bu repo bir mobil match-3 prototipi. Ürün kararları proje sahibine ait; senin işin backlog'u sırayla, temiz ve test edilmiş şekilde uygulamak.

## Her oturumun başında
1. `PLAN.md` dosyasını oku: vizyon, teknik kararlar ve backlog orada.
2. `PLAN.md` içindeki **Playtest notları** bölümüne bak. Yeni not varsa önce bunları değerlendir: küçük düzeltmeyse hemen yap, büyük bir değişiklikse backlog'a madde olarak ekle.
3. `CHANGELOG.md` dosyasının son girişini oku ki nerede kaldığını bil.

## Çalışma şekli
- Backlog'daki **ilk işaretlenmemiş maddeyi** al. Bir oturumda bir madde (çok küçükse en fazla birkaç madde) yap.
- Backlog dışında feature ekleme. Fikrin varsa `PLAN.md` içindeki **Öneriler** bölümüne yaz.
- Oyun mantığını Phaser'dan bağımsız saf TypeScript olarak yaz ve Vitest ile test et.
- Kod, değişken isimleri ve commit mesajları İngilizce olsun.
- Görseller özgün olacak: basit şekiller, kendi çizdiğin SVG'ler veya prosedürel grafikler. Başka oyunların asset'lerini veya isimlerini kullanma.
- Her şey telefonda dikey ekranda düzgün çalışmalı; dokunma ve kaydırma ile test et.

## Oturumu bitirmeden önce
1. `npm run build` ve `npm test` başarılı olmalı. Başarısızsa düzelt; düzeltemiyorsan maddeyi işaretleme ve nedenini changelog'a yaz.
2. Bitirdiğin maddeyi `PLAN.md` içinde `[x]` olarak işaretle.
3. `CHANGELOG.md` dosyasına tarihli kısa bir giriş ekle: ne yapıldı, nasıl test edilir (oyunda neye bakmalı), bilinen sorunlar.
4. Anlamlı bir commit mesajıyla commit'le ve push'la. Push sonrası GitHub Pages linki otomatik güncellenir.
