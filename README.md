# Gurmia — Full-Stack Food Ordering Application

Gurmia, React, Node.js, Express ve MySQL kullanılarak geliştirilmiş full-stack bir yemek sipariş uygulamasıdır.

Uygulama; kullanıcı kimlik doğrulama, ürün listeleme ve filtreleme, sepet yönetimi, sipariş oluşturma, sipariş geçmişi ve rol bazlı admin paneli gibi temel bir yemek sipariş sisteminin uçtan uca akışlarını içerir.

> Gurmia bir portföy/demo projesidir. Gerçek ödeme entegrasyonu içermez; kart numarası veya CVV bilgisi toplamaz ya da saklamaz.

---

## Özellikler

### Kullanıcı

- Kullanıcı kayıt ve giriş sistemi
- JWT tabanlı kimlik doğrulama
- `bcrypt` ile şifre hashleme
- Profil bilgilerini görüntüleme ve güncelleme
- Şifre değiştirme
- E-posta güncellemesinde duplicate hesap kontrolü
- Ürün arama ve kategori filtreleme
- Sepete ürün ekleme ve adet yönetimi
- Teslimat adresi oluşturma
- Aynı adres tekrar girildiğinde mevcut adresi kullanma
- Sipariş oluşturma
- Geçmiş siparişleri görüntüleme
- Sipariş anındaki ürün fiyatlarını koruma
- Kapıda nakit / kapıda kredi kartı ödeme tercihi

### Admin

- Backend tarafında rol bazlı admin yetkilendirmesi
- Tüm siparişleri görüntüleme
- Sipariş durumunu güncelleme
- Yeni yemek ekleme
- Ürün görseli yükleme
- Mevcut ürün fiyatını güncelleme
- Görsel yüklemede dosya türü ve 5 MB boyut kontrolü

---

## Teknolojiler

### Frontend

- React 18
- React Router
- Fetch API
- CSS
- LocalStorage

### Backend

- Node.js
- Express 5
- MySQL
- mysql2
- JSON Web Token (JWT)
- bcrypt
- Multer
- CORS
- dotenv

---

## Mimari ve Güvenlik

Projede yalnızca frontend doğrulamasına güvenilmez. Yetkilendirme ve kritik kontroller backend tarafında gerçekleştirilir.

- Kullanıcı kimliği request body yerine doğrulanmış JWT üzerinden alınır.
- Admin yetkisi backend middleware ile kontrol edilir.
- Şifreler veritabanında düz metin olarak tutulmaz.
- Veritabanı şifresi ve JWT secret kaynak kod içerisinde bulunmaz.
- `.env` dosyası Git tarafından takip edilmez.
- Sipariş toplamı frontend tarafından gönderilen değere güvenilmeden backend üzerinde yeniden hesaplanır.
- Sipariş anındaki ürün fiyatı `order_items.unit_price` alanına kaydedilir.
- MySQL connection pool kullanılır.
- Sipariş oluşturma işlemleri transaction içerisinde gerçekleştirilir.
- Her transaction için pool üzerinden ayrı bir connection alınır ve işlem sonunda release edilir.
- Demo ödeme akışı kart numarası veya CVV bilgisi toplamaz.

---

## Fiyat Geçmişi Mantığı

Gurmia'da ürünün güncel fiyatı ile geçmiş siparişteki fiyat birbirinden ayrılmıştır.

Örneğin bir ürün **200 TL** iken sipariş verilirse:

```text
foods.price = Güncel menü fiyatı
order_items.unit_price = Sipariş anındaki fiyat

---
## Proje Yapısı

food-ordering/
│
├── config/
│   ├── db.js
│   └── env.js
│
├── controllers/
│   ├── addressController.js
│   ├── orderController.js
│   └── userController.js
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrate-existing.sql
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── addressRoutes.js
│   ├── adminRoutes.js
│   ├── kategorilerRoutes.js
│   ├── orderRoutes.js
│   ├── userRoutes.js
│   └── yemeklerRoutes.js
│
├── yemek-siparis-frontend/
│   ├── public/
│   └── src/
│       ├── pages/
│       ├── App.js
│       └── api.js
│
├── app.js
├── package.json
└── README.md

