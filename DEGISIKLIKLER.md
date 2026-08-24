# Bu sürümde yapılan düzeltmeler

- JWT doğrulaması ve backend admin yetkilendirmesi korunup sıkılaştırıldı.
- MySQL tek connection yerine connection pool kullanıyor.
- Sipariş transaction'ı pool'dan alınan özel connection üzerinde çalışıyor.
- `order_items.unit_price` ile sipariş anındaki ürün fiyatı saklanıyor.
- Geçmiş siparişlerde güncel menü fiyatı yerine eski sipariş fiyatı gösteriliyor.
- `orders.payment_method` ile Kapıda Nakit / Kapıda Kredi Kartı tercihi kaydediliyor.
- Admin ve kullanıcı sipariş ekranında ödeme yöntemi gösteriliyor.
- Admin paneline **Yemekleri Yönet** sekmesi ve fiyat güncelleme özelliği eklendi.
- Admin `orders.map is not a function` crash'i array kontrolüyle engellendi.
- Kullanıcı sipariş ekranında da API cevabı ve `items` array kontrolü eklendi.
- Sepet modalından checkout'a geçerken giriş kontrolü atlanamıyor.
- Ana sayfadaki Kayıt Ol butonu kayıt modunu doğrudan açıyor.
- Bozuk Hesabım / Geçmiş Siparişlerim ikonları düzeltildi.
- Aynı teslimat adresi tekrar girildiğinde gereksiz duplicate kayıt açılması azaltıldı.
- Profil e-posta değişiminde başka kullanıcıya ait e-posta için 409 kontrolü eklendi.
- Demo olmayan SSL/çerez/ödeme sağlayıcısı/5 dakika iptal gibi iddialar kaldırıldı; politika metinleri demo uygulamasına uygun hale getirildi.
- Görsel yükleme klasörü yoksa otomatik oluşturuluyor.
- `schema.sql` güncellendi.
- Mevcut veritabanı için tekrar çalıştırılabilir `database/migrate-existing.sql` eklendi.
- Eksik root `.env.example` eklendi.
- README güncellendi.

## Mevcut yerel veritabanı için

Bu sürümü ilk kez çalıştırmadan önce MySQL Workbench'te bir kez:

```text
database/migrate-existing.sql
```

çalıştır.
