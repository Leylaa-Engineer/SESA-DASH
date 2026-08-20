# SESA — IIS/Plesk + PHP + MySQL Kurulumu

## 1. MySQL veritabanını oluştur

phpMyAdmin üzerinden `database/mysql_schema.sql` dosyasını içe aktar. Veritabanı adını, kullanıcı adını, host değerini ve şifreyi hosting firmasının verdiği bilgilerle kullan.

## 2. MySQL bağlantı dosyasını oluştur

`App_Data/config.example.php` dosyasını bilgisayarında `App_Data/config.php` adıyla kopyala ve gerçek değerleri doldur:

```php
return [
    'host' => 'localhost',
    'port' => '3306',
    'name' => 'sesaitco_bakim',
    'user' => 'GERCEK_DB_KULLANICISI',
    'pass' => 'GERCEK_DB_SIFRESI',
    'charset' => 'utf8mb4',
    'admin_code' => 'SADECE_YONETICIYE_VERILECEK_GIZLI_KOD',
    'responsible_code' => 'SORUMLU_KAYIT_GIZLI_KODU',
];
```

Bu dosyayı GitHub’a gönderme ve kimseyle paylaşma.

## 3. FileZilla ile yükleme

Yerel `dist` klasörünün **içindeki** dosyaları hosting alan adının yayın klasörüne, genellikle `/httpdocs/` içine yükle. `index.html` dosyası doğrudan `/httpdocs/index.html` konumunda olmalı; `/httpdocs/dist/index.html` şeklinde ikinci bir klasör oluşmamalı.

Ayrıca şu klasörleri aynı yayın köküne yükle:

```text
/httpdocs/
├── index.html
├── assets/
├── api/
│   └── index.php
├── App_Data/
│   ├── config.php
│   └── web.config
├── database/                 # İsteğe bağlı; canlı API için gerekmez
├── manifest.webmanifest
├── sw.js
├── workbox-*.js
└── web.config
```

`database/mysql_schema.sql` dosyasını web köküne yüklemek zorunda değilsin; phpMyAdmin’e içe aktarmak için bilgisayarda saklayabilirsin.

## 4. API bağlantısını test et

Tarayıcıdan şu adresi aç:

```text
https://bakim.sesait.com/api/index.php?action=session
```

MySQL ayarı doğruysa JSON olarak `{"user":null}` benzeri bir yanıt görürsün. Yapılandırma yoksa veya bağlantı hatalıysa anlaşılır bir JSON hata mesajı döner.

## 5. Frontend API adresi

Frontend ve API aynı alan adında olduğu için ayrıca `VITE_API_BASE` ayarlamak gerekmez. Uygulama varsayılan olarak `/api/index.php` adresini kullanır. Farklı bir API alan adı kullanılırsa build öncesi `.env.production` içine şu değer eklenebilir:

```text
VITE_API_BASE=https://bakim.sesait.com/api/index.php
```

## 6. İlk admin ve sorumlu kaydı

İlk hesabı uygulamadaki kayıt ekranından oluştur. `Yönetici` bölümünü seçerken `admin_code`, diğer bölümlerden birini seçerken `responsible_code` değerini kullan. Bu iki kod `App_Data/config.php` içinde tutulur; `ayarlar` tablosuna ayrıca kayıt eklemek gerekmez. Kayıt ekranında yönetici hesabıyla giriş yaptıktan sonra makine kayıtlarını ekle.

QR/makine kodu ile arıza bildirimi için saha kullanıcısının önceden giriş yapması gerekmez. Yeni bir makine arızası açıldığında aynı makineye ait önceki `Açık` veya `İşlemde` kayıtlar otomatik olarak `Çözüldü` durumuna alınır.

## 7. Önemli güvenlik kuralları

`App_Data/config.php` dosyasını, FTP şifresini, MySQL şifresini ve Plesk bilgilerini GitHub’a koyma. Daha önce paylaşılmış şifreleri değiştir. API dosyası MySQL’e yalnızca sunucu tarafından bağlanır; React tarayıcısı MySQL’e doğrudan bağlanmaz.
