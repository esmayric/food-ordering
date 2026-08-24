# Gurmia — Full-Stack Yemek Sipariş Uygulaması

React, Node.js, Express ve MySQL ile geliştirilmiş portföy amaçlı full-stack yemek sipariş uygulaması.

## Özellikler

- Kullanıcı kayıt / giriş sistemi
- `bcrypt` ile şifre hashleme
- JWT ile kimlik doğrulama
- Backend tarafında rol bazlı admin yetkilendirmesi
- Profil görüntüleme, profil güncelleme ve şifre değiştirme
- E-posta güncellerken duplicate hesap kontrolü
- Kategori ve yemek listeleme
- Arama ve kategori filtreleme
- Sepet ve adet yönetimi
- Giriş yapılmadan checkout ekranına geçişi engelleme
- Teslimat adresi oluşturma; aynı adres tekrar girilirse mevcut kaydı kullanma
- Sipariş toplamını backend tarafında güncel ürün fiyatlarından yeniden hesaplama
- Sipariş anındaki ürün fiyatını `order_items.unit_price` alanında saklama
- Geçmiş siparişlerde güncel fiyat yerine sipariş anındaki fiyatı gösterme
- Ödeme tercihini (`Kapıda Nakit` / `Kapıda Kredi Kartı`) siparişe kaydetme
- MySQL connection pool kullanımı
- Sipariş oluştururken dedicated connection + transaction kullanımı
- Admin panelinden siparişleri görüntüleme ve durum güncelleme
- Admin panelinden yemek ve görsel ekleme
- Admin panelinden mevcut yemek fiyatını güncelleme
- Görsel yüklemede dosya türü ve 5 MB boyut kontrolü
- API cevaplarında array doğrulaması ile frontend crash koruması

> Bu proje bir portföy/demo uygulamasıdır. Gerçek ödeme entegrasyonu içermez; kart numarası veya CVV toplamaz/saklamaz.

## Teknolojiler

### Backend

- Node.js
- Express 5
- MySQL / mysql2
- JSON Web Token (JWT)
- bcrypt
- Multer
- CORS
- dotenv

### Frontend

- React 18
- React Router
- Fetch API
- CSS

## Kurulum

### 1. Backend ortam değişkenleri

`.env.example` dosyasını `.env` adıyla kopyala:

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

JWT secret üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2A. Sıfırdan veritabanı oluşturuyorsan

MySQL Workbench'te sırasıyla:

```text
database/schema.sql
database/seed.sql
```

çalıştır.

### 2B. Mevcut eski `yemekdb` veritabanını kullanıyorsan

Bu sürüm `unit_price` ve `payment_method` alanlarını kullanır. Mevcut veritabanını güncellemek için **bir kez**:

```text
database/migrate-existing.sql
```

çalıştır.

> Eski siparişlerde sipariş anındaki ürün fiyatı geçmişte kaydedilmediği için migration yalnızca o anki ürün fiyatını `unit_price` alanına doldurabilir. Migration sonrasında oluşturulan tüm yeni siparişlerde gerçek sipariş anındaki fiyat saklanır.

### 3. Backend

```bash
npm install
npm start
```

Backend varsayılan olarak `http://localhost:5000` üzerinde çalışır.

### 4. Frontend

Yeni terminal:

```bash
cd yemek-siparis-frontend
npm install
npm start
```

Frontend varsayılan olarak `http://localhost:3000` üzerinde çalışır.

Farklı backend adresi için `yemek-siparis-frontend/.env.example` dosyasını `.env` olarak kopyalayıp düzenleyebilirsin:

```env
REACT_APP_API_URL=http://localhost:5000
```

## Admin Kullanıcısı

Önce uygulamadan kullanıcı oluştur, sonra geliştirme veritabanında:

```sql
UPDATE users
SET is_admin = 1
WHERE email = 'admin@example.com';
```

Çıkış yapıp tekrar giriş yaptığında yeni JWT admin rolünü içerir.

## API Özeti

### Public

- `POST /api/users/register`
- `POST /api/users/login`
- `GET /api/kategoriler`
- `GET /api/yemekler`

### Giriş gerekli

- `GET /api/users/me`
- `PUT /api/users/me`
- `PUT /api/users/me/password`
- `POST /api/addresses`
- `POST /api/orders`
- `GET /api/orders/my`

### Admin gerekli

- `GET /api/admin/orders`
- `PUT /api/admin/orders/:orderId/status`
- `POST /api/yemekler`
- `POST /api/yemekler/upload`
- `PUT /api/yemekler/:id` — fiyat güncelleme

## Fiyat Geçmişi Mantığı

Örneğin bir ürün 200 TL iken sipariş verilirse:

- `foods.price`: güncel menü fiyatıdır.
- `order_items.unit_price`: sipariş anındaki fiyattır.

Admin daha sonra ürünü 300 TL yaparsa ana menü 300 TL gösterir; eski sipariş 200 TL olarak kalır.

## Güvenlik / Mimari Notları

- `.env` Git'e eklenmez.
- Veritabanı şifresi ve JWT secret kaynak kodda tutulmaz.
- Kullanıcı ID'si profil ve sipariş işlemlerinde request body'den değil doğrulanmış JWT'den alınır.
- Admin yetkisi backend middleware ile doğrulanır.
- Sipariş toplamı istemciden kabul edilmez; backend yeniden hesaplar.
- Her sipariş transaction için pool'dan ayrı bir connection alır ve işlem sonunda release edilir.
- Demo ödeme akışı kart bilgisi toplamaz.

## GitHub'a Yüklemeden Önce

`node_modules`, `.env`, build çıktıları ve editör dosyaları `.gitignore` ile hariç tutulur. Bu ZIP içinde de `node_modules` bulunmamalıdır.

## Sonraki Geliştirme Fikirleri

- Otomatik testler
- HttpOnly cookie tabanlı oturum yönetimi
- Refresh token
- Rate limiting
- Şifre sıfırlama
- Kayıtlı adresleri listeleme/seçme ekranı
- Docker Compose
- Home sayfasını daha küçük React component'lerine bölme
