# SESA-DASH MySQL veri katmanı

Bu klasör, SESA-DASH uygulamasının MySQL veri tabanı ve JWT tabanlı kullanıcı oturumu için gerekli şema ve veri giriş dosyalarını içerir. Uygulama artık Firebase/Firestore veya Firebase Authentication kullanmaz.

## 1. Veritabanını oluşturma

MySQL sunucusunda hedef veritabanını oluşturup `database/schema.sql` dosyasını bir kez çalıştırın. Dosya tabloları, foreign key ilişkilerini ve sorgu index’lerini oluşturur. Canias kodları ve personel kayıtları şirketin gerçek veri aktarımıyla eklenmelidir.

```bash
mysql --host=HOST --user=USER --password DB_NAME < database/schema.sql
```

## 2. Sunucu değişkenleri

Aşağıdaki değerleri yalnızca Vercel Project Settings → Environment Variables veya sunucu ortamına ekleyin. Bu değişkenler frontend’e gönderilmemelidir:

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB_NAME
DATABASE_SSL=true
DB_CONNECTION_LIMIT=5
JWT_SECRET=32-karakterden-uzun-rastgele-gizli-deger
JWT_EXPIRES_IN=8h
ADMIN_SIGNUP_CODE=yonetici-kayit-kodu
RESPONSIBLE_SIGNUP_CODE=sorumlu-kayit-kodu
```

## 3. Kimlik doğrulama mimarisi

Kullanıcı kayıt ve giriş işlemleri `/api/auth/register` ve `/api/auth/login` endpoint’leri üzerinden yapılır. Parolalar bcrypt hash olarak `users.password_hash` alanında saklanır. Başarılı girişte sunucu JWT erişim tokenı üretir; React istemcisi tokenı `localStorage` içinde saklar ve sonraki `/api` isteklerinde `Authorization: Bearer <token>` başlığı gönderir.

## 4. API akışı

`/api/departments` iş merkezi/departman listesini, `/api/machines` makine listesini ve QR/makine kodu eşleştirmesini, `/api/issues` arıza/bakım CRUD işlemlerini, `/api/users` ise yetkili personel yönetimini sağlar. Yetkili kontrolleri JWT içindeki MySQL kullanıcı ID’si ve `users.role` alanı üzerinden yapılır.

## 5. Canias veri girişi

Yöneticinin dolduracağı doğrudan veri giriş dosyası `database/canias-data-entry-template.xlsx` dosyasıdır. SQL kurulum, ilişki açıklamaları ve yorum satırındaki INSERT taslakları `database/canias-mysql-template.sql` dosyasında bulunur.

## 6. Güvenlik notu

Düz metin parola, Firebase anahtarı veya JWT secret GitHub’a gönderilmemelidir. Gerçek kayıt kodları ve bağlantı bilgileri yalnızca Vercel/sunucu ortam değişkenlerinde tutulmalıdır. Mevcut canlı veritabanı üzerinde şema değişikliği yapmadan önce yedek alınmalıdır.
