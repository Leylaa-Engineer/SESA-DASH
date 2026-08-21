# SESA Operasyon Takip Sistemi — Hosting Kurulum Rehberi

Bu rehber, projeyi `https://bakim.sesait.com` adresinde PHP + MySQL + IIS/Plesk ortamında çalıştırmak için hazırlanmıştır. İşlemleri sırayla uygula; özellikle `config.php` dosyasını gerçek bilgilerle oluşturma adımını atlama.

## 1. Kullanılacak dosyayı seç

En kolay yöntem, sana verilen `SESA-DASH-hosting-package.zip` dosyasını kullanmaktır. Alternatif olarak GitHub’daki [SESA-DASH](https://github.com/Leylaa-Engineer/SESA-DASH) deposundan güncel kodu indirebilirsin.

ZIP dosyasını bilgisayarında aç. ZIP’in içinde aşağıdaki yapı bulunmalıdır:

```text
SESA-DASH-hosting-package/
├── index.html
├── assets/
├── web.config
├── manifest.webmanifest
├── sw.js
├── workbox-7e5eb42b.js
├── api/
│   └── index.php
└── App_Data/
    ├── config.example.php
    └── web.config
```

ZIP içinde `config.example.php` vardır. Bu dosya yalnızca şablondur. Gerçek MySQL şifreni ve kayıt kodlarını birazdan bilgisayarında `config.php` dosyasına yazacaksın. `config.php` dosyasını GitHub’a veya herkese açık bir klasöre yükleme.

## 2. Plesk’te PHP’yi kontrol et

Plesk’e giriş yap. **Websites & Domains** bölümünden `bakim.sesait.com` alan adını aç. **PHP Settings** ekranına gir ve PHP sürümünü PHP 8.x yap. En az `mysqli` uzantısının etkin olması gerekir. Hosting sağlayıcında PHP çalıştırma özelliği kapalıysa bu projeyi yüklemeden önce PHP 8.x ve MySQL desteğini etkinleştir.

Aynı ekranda alan adının yayın klasörünü de kontrol et. Çoğu Plesk kurulumunda bu klasör `/httpdocs/` olur. Bazı sağlayıcılarda farklı bir klasör gösterilebilir; FileZilla’da Plesk’in gösterdiği klasörü kullan.

## 3. Plesk’te MySQL veritabanı oluştur

Plesk’te **Databases** bölümünü aç ve yeni bir MySQL veritabanı oluştur. Aşağıdaki bilgileri bir not dosyasına kaydet:

| Bilgi | Nereden alınır? |
|---|---|
| Veritabanı adı | Plesk’te oluşturduğun veritabanı |
| Kullanıcı adı | Veritabanına bağladığın MySQL kullanıcısı |
| Şifre | MySQL kullanıcısının şifresi |
| Host | Genellikle `localhost`; hosting sağlayıcın farklı değer verdiyse onu kullan |
| Port | Genellikle `3306` |

Veritabanı oluşturduktan sonra Plesk’te **phpMyAdmin** bağlantısını aç. Doğru veritabanını seç. `database/mysql_schema.sql` dosyasını phpMyAdmin’in **Import / İçe Aktar** ekranından yükle ve çalıştır. İşlem başarılı olunca `users`, `departments`, `machines`, `issues`, `settings`, `app_settings`, `user_departments` ve `issue_status_history` tablolarını görmelisin.

Eğer phpMyAdmin `USE` satırı veya veritabanı seçimiyle ilgili hata verirse, önce sol taraftan doğru veritabanını seçip SQL dosyasının başındaki veritabanı seçme satırını kullanmadan içeri aktar. Bu proje sahte makine, sahte kullanıcı veya sahte arıza verisi eklemez; tablolar boş başlayacaktır.

## 4. Gizli `config.php` dosyasını hazırla

Bilgisayarında `App_Data/config.example.php` dosyasının bir kopyasını oluştur ve kopyanın adını tam olarak `config.php` yap. Dosyayı Not Defteri veya VS Code ile aç. İçeriğini aşağıdaki yapıya göre düzenle:

```php
<?php
return [
    'host' => 'localhost',
    'port' => '3306',
    'name' => 'PLESK_VERITABANI_ADI',
    'user' => 'PLESK_DB_KULLANICI_ADI',
    'pass' => 'MYSQL_SIFREN',
    'charset' => 'utf8mb4',
    'admin_code' => 'YONETICI_KAYIT_KODU',
    'responsible_code' => 'SORUMLU_KAYIT_KODU',
];
```

`name`, `user` ve `pass` alanlarına Plesk’te oluşturduğun gerçek bilgileri yaz. `admin_code` değerini yalnızca yönetici hesabı açarken kullanacağın gizli kod olarak belirle. `responsible_code` değerini sorumlu hesabı açacak kişilere ver.

Dosya adının Windows’ta yanlışlıkla `config.php.txt` olmadığını kontrol et. Dosya uzantılarını görmek için Dosya Gezgini’nde **View > File name extensions** seçeneğini açabilirsin. `config.php` dosyasını GitHub’a gönderme.

## 5. FileZilla ile doğru sunucu klasörüne bağlan

FileZilla’yı aç. Hosting sağlayıcının verdiği FTP veya SFTP bilgileriyle bağlan. Sağ taraftaki **Remote site** bölümünde alan adının yayın klasörünü aç. Genellikle yol `/httpdocs/` şeklindedir.

Önce eski projenin yedeğini al. Eski `/httpdocs/` içeriğini bilgisayarındaki ayrı bir klasöre indir. Daha sonra eski frontend dosyalarını silmeden önce yedeğin gerçekten oluştuğunu kontrol et.

## 6. Dosyaları `/httpdocs/` içine yükle

ZIP’in içindeki klasörü değil, klasörün içindeki dosyaları seç. Örneğin doğru konum şu olmalıdır:

```text
/httpdocs/index.html
/httpdocs/assets/index-....js
/httpdocs/api/index.php
/httpdocs/App_Data/config.php
/httpdocs/App_Data/web.config
/httpdocs/web.config
```

Yanlış konumlar şunlardır:

```text
/httpdocs/SESA-DASH-hosting-package/index.html
/httpdocs/dist/index.html
/httpdocs/App_Data/config.example.php
```

FileZilla’da aşağıdaki aktarımı yap:

| Bilgisayardaki kaynak | Sunucudaki hedef |
|---|---|
| ZIP içindeki `index.html` | `/httpdocs/index.html` |
| ZIP içindeki `assets/` | `/httpdocs/assets/` |
| ZIP içindeki `web.config` | `/httpdocs/web.config` |
| ZIP içindeki `manifest.webmanifest`, `sw.js`, `workbox-*.js` | `/httpdocs/` |
| ZIP içindeki `api/index.php` | `/httpdocs/api/index.php` |
| ZIP içindeki `App_Data/web.config` | `/httpdocs/App_Data/web.config` |
| Bilgisayarında oluşturduğun gerçek `App_Data/config.php` | `/httpdocs/App_Data/config.php` |

Upload tamamlandıktan sonra FileZilla’nın **Failed transfers** bölümünü kontrol et. Başarısız dosya varsa yeniden yükle. `App_Data/config.php` dosyasının gerçekten yüklenmiş olduğundan emin ol.

## 7. İlk API testini yap

Tarayıcıda şu adresi aç:

```text
https://bakim.sesait.com/api/index.php?action=session
```

Kurulum doğruysa ve henüz giriş yapılmadıysa aşağıdakine benzer bir yanıt görürsün:

```json
{"user":null}
```

Karşılaşabileceğin hatalar:

| Yanıt | Anlamı | Yapılacak işlem |
|---|---|---|
| `{"user":null}` | API ve MySQL bağlantısı çalışıyor | Uygulama testine geç |
| `MySQL yapılandırması bulunamadı` | `config.php` eksik veya yanlış yerde | `/httpdocs/App_Data/config.php` konumunu kontrol et |
| `Veritabanı bağlantısı kurulamadı` | MySQL bilgileri hatalı | Host, veritabanı adı, kullanıcı ve şifreyi Plesk’ten tekrar al |
| PHP dosyası indiriliyor veya 500 hatası | PHP çalışmıyor veya uzantı eksik | Plesk PHP Settings ve `mysqli` uzantısını kontrol et |
| HTML sayfası geliyor | API yolu yanlış veya dosya yanlış klasörde | `/httpdocs/api/index.php` konumunu kontrol et |

## 8. Web sitesini aç ve yönetici hesabı oluştur

`https://bakim.sesait.com` adresini aç. Kayıt ekranına git. Bölüm veya rol seçiminden **Yönetici** seçeneğini seç. `config.php` içine yazdığın `admin_code` değerini girerek ilk yönetici hesabını oluştur.

Yönetici hesabıyla giriş yaptıktan sonra makine yönetimi ekranından ilk makineyi ekle. Makine kodu, QR kodunda veya saha ekranında kullanılacak benzersiz koddur. Bölüm bilgilerini de doğru gir.

Sorumlu hesabı oluşturacaksan kayıt ekranında ilgili bölümü seç ve `responsible_code` değerini kullan. Kullanıcı yönetimi, makine yönetimi ve arıza durumunu değiştirme gibi yönetim işlemleri giriş yapmış kullanıcılarla çalışır.

## 9. Arıza akışını test et

Yeni makinenin kodunu tarayıcıda veya QR akışında aç. Makine bilgisi görünüyorsa makine sorgusu çalışıyordur. Arıza açıklaması yazıp arıza bildirimi gönder. Sonra sorumlu hesabıyla giriş yap ve arıza listesinde yeni kaydı kontrol et.

Arıza durumunu `Açık`, `İşlemde` ve `Çözüldü` durumları arasında değiştir. Aynı makineye yeni arıza gönderdiğinde önceki `Açık` veya `İşlemde` kayıtların `Çözüldü` durumuna geçirildiğini kontrol et. Böylece bir makine aynı anda iki aktif durumda görünmez.

## 10. Telefon testi

Telefonu mobil veri veya aynı Wi-Fi üzerinden aç. `https://bakim.sesait.com` adresini kullan; `http://` adresini kullanma. Giriş, sayfa geçişi, QR/makine kodu, arıza bildirimi ve çıkış işlemlerini telefonda dene.

Eski sayfa veya eski JavaScript görünürse tarayıcıda site verilerini temizle veya gizli sekmede aç. PWA service worker eski dosyaları tutuyorsa siteyi kapatıp yeniden aç ve tarayıcı önbelleğini temizle.

## 11. Kurulum tamamlanma kontrolü

Aşağıdaki koşulların hepsi sağlanıyorsa kurulum tamamlanmıştır:

| Kontrol | Beklenen sonuç |
|---|---|
| `api/index.php?action=session` | JSON olarak `user: null` döner |
| Ana sayfa | Uygulama açılır, boş siyah ekran kalmaz |
| Yönetici kaydı | `admin_code` ile hesap açılır |
| Yönetici girişi | Dashboard açılır |
| Makine ekleme | Makine listede görünür |
| QR/makine kodu | Makine bilgisi bulunur |
| Arıza bildirimi | Yeni arıza kaydı oluşturulur |
| Durum değişikliği | Sorumlu arızayı güncelleyebilir |
| Çıkış | Oturum kapanır ve korumalı sayfalar açılmaz |

## Güvenlik notu

Gerçek MySQL şifresini, FTP şifresini, Plesk şifresini ve kayıt kodlarını GitHub’a veya mesajlaşma uygulamalarına yazma. `config.php` yalnızca hosting üzerindeki `App_Data` klasöründe bulunmalıdır. Kurulum tamamlandıktan sonra Plesk, FTP ve MySQL şifrelerini bir parola yöneticisinde sakla.
