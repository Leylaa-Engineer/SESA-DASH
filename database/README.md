# SESA-DASH MySQL veri katmanı

Bu klasör, SESA-DASH uygulamasının PHP backend’i tarafından kullanılan MySQL şemasını içerir. Uygulama Firebase, Firestore, JWT veya Vercel Functions kullanmaz. Tarayıcı yalnızca aynı alan adındaki `api/index.php` endpoint’ine istek gönderir; MySQL bağlantısı sunucu tarafında kalır.

## Veritabanını oluşturma

Plesk’te veritabanı ve kullanıcı oluşturduktan sonra `mysql_schema.sql` dosyasını phpMyAdmin üzerinden içe aktarın. SQL dosyasında `USE` satırındaki veritabanı adı Plesk’teki gerçek adla uyuşmuyorsa bu satırı kaldırıp dosyayı seçili veritabanında çalıştırın.

Şema şu tabloları oluşturur:

| Tablo | Kullanım |
|---|---|
| `users` | Yönetici ve sorumlu hesapları |
| `departments` | Bölüm kayıtları |
| `machines` | Makine ve QR/kod bilgileri |
| `issues` | Arıza kayıtları ve durumları |
| `settings` | Gelecekteki uygulama ayarları |
| `issue_status_history` | Durum geçmişi için yardımcı tablo |

## PHP yapılandırması

`App_Data/config.example.php` dosyasını `App_Data/config.php` adıyla kopyalayıp gerçek değerleri girin:

```php
return [
    'host' => 'localhost',
    'port' => '3306',
    'name' => 'GERCEK_VERITABANI_ADI',
    'user' => 'GERCEK_DB_KULLANICISI',
    'pass' => 'GERCEK_DB_SIFRESI',
    'charset' => 'utf8mb4',
    'admin_code' => 'YONETICI_KAYIT_KODU',
    'responsible_code' => 'SORUMLU_KAYIT_KODU',
];
```

Gerçek `config.php` GitHub’a gönderilmemelidir. `.gitignore` bu dosyayı dışarıda bırakır; hosting’e yalnızca FileZilla ile yüklenir.

## API ve oturum

Tüm işlemler `api/index.php?action=...` üzerinden yapılır. Giriş PHP session cookie ile korunur ve cookie `HttpOnly`, `SameSite=Lax` özellikleriyle oluşturulur. Kayıt ekranındaki `admin_code` yönetici, `responsible_code` ise sorumlu hesabı oluşturur. Şifreler `password_hash` ile hashlenir; düz metin saklanmaz.

Makine kodu sorgusu saha ekranında oturumsuz yapılabilir. Arıza bildirimi de QR/kod akışını desteklemek için oturumsuz oluşturulabilir. Yönetim listeleri, makine yönetimi ve kullanıcı yönetimi oturum/yönetici yetkisi gerektirir.

## Veri bütünlüğü

Yeni bir makine arızası açıldığında aynı makineye ait önceki `Açık` veya `İşlemde` kayıtlar otomatik olarak `Çözüldü` durumuna geçirilir. Böylece bir makine aynı anda birden fazla aktif durumda görünmez.

Canlı veritabanında şema değişikliği yapmadan önce phpMyAdmin üzerinden yedek alın. Gerçek hosting, FTP ve MySQL şifrelerini kaynak koduna, ekran görüntüsüne veya GitHub’a koymayın.
