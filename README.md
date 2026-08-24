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

## Proje Yapısı

```text
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
```

---

## Kurulum

### 1. Projeyi klonla

```bash
git clone https://github.com/esmayric/food-ordering.git
cd food-ordering
```

### 2. Backend bağımlılıklarını yükle

```bash
npm install
```

### 3. Backend ortam değişkenlerini oluştur

Ana dizindeki `.env.example` dosyasını `.env` adıyla kopyala.

```env
PORT=5000
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=yemekdb

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
```

JWT secret oluşturmak için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Veritabanı

### Sıfırdan Kurulum

MySQL Workbench üzerinde sırasıyla aşağıdaki dosyaları çalıştır:

```text
database/schema.sql
database/seed.sql
```

### Mevcut `yemekdb` Veritabanını Kullanıyorsan

Bu sürüm sipariş fiyat geçmişi ve ödeme tercihi için ek alanlar kullanır.

Bir kez:

```text
database/migrate-existing.sql
```

dosyasını çalıştır.

> Eski siparişlerde sipariş anındaki fiyat geçmişte kaydedilmediği için migration sırasında mevcut ürün fiyatı `unit_price` alanına aktarılır. Migration sonrasında oluşturulan siparişlerde gerçek sipariş anındaki fiyat saklanır.

---

## Backend'i Çalıştırma

```bash
npm start
```

Backend varsayılan olarak:

```text
http://localhost:5000
```

adresinde çalışır.

---

## Frontend'i Çalıştırma

Yeni bir terminal aç:

```bash
cd yemek-siparis-frontend
npm install
npm start
```

Frontend varsayılan olarak:

```text
http://localhost:3000
```

adresinde çalışır.

Farklı bir backend adresi kullanmak için `yemek-siparis-frontend/.env.example` dosyasını `.env` olarak kopyalayıp aşağıdaki değeri güncelleyebilirsin:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

## API Endpoints

### Public

```http
POST /api/users/register
POST /api/users/login

GET /api/kategoriler
GET /api/yemekler
```

### Authentication Required

```http
GET  /api/users/me
PUT  /api/users/me
PUT  /api/users/me/password

POST /api/addresses

POST /api/orders
GET  /api/orders/my
```

### Admin Required

```http
GET  /api/admin/orders
PUT  /api/admin/orders/:orderId/status

POST /api/yemekler
POST /api/yemekler/upload
PUT  /api/yemekler/:id
```

---

## Admin Kullanıcısı Oluşturma

Önce uygulama üzerinden normal bir kullanıcı hesabı oluştur.

Daha sonra geliştirme veritabanında:

```sql
UPDATE users
SET is_admin = 1
WHERE email = 'admin@example.com';
```

Çıkış yapıp yeniden giriş yapıldığında oluşturulan yeni JWT admin rolünü içerir ve Admin Panel erişimi aktif olur.

---

## Sipariş Durumları

Admin paneli üzerinden siparişler aşağıdaki durumlar arasında güncellenebilir:

```text
Hazırlanıyor
Yolda
Teslim Edildi
İptal
```

---

## Demo Ödeme Sistemi

Projede ödeme akışı yalnızca sipariş sürecini simüle etmek amacıyla hazırlanmıştır.

Desteklenen ödeme tercihleri:

- Kapıda Nakit
- Kapıda Kredi Kartı

Uygulama:

- Kart numarası istemez.
- CVV istemez.
- Gerçek ödeme işlemi gerçekleştirmez.
- Kart bilgisi saklamaz.

---

## Roadmap

Projeye ileride eklenebilecek geliştirmeler:

- [ ] Otomatik testler
- [ ] HttpOnly cookie tabanlı authentication
- [ ] Refresh token sistemi
- [ ] Rate limiting
- [ ] Şifre sıfırlama
- [ ] Kayıtlı adresleri listeleme ve seçme
- [ ] Docker / Docker Compose
- [ ] Frontend component yapısının daha küçük parçalara ayrılması
- [ ] Responsive tasarım iyileştirmeleri
- [ ] Production deployment

---

## Proje Amacı

Bu proje; full-stack web geliştirme sürecinde frontend, backend, REST API, authentication, authorization, ilişkisel veritabanı yönetimi ve transaction gibi kavramları tek bir uygulama üzerinde göstermek amacıyla geliştirilmiştir.

