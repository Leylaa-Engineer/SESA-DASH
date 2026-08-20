# SESA Operasyon Takip Sistemi

SESA, saha ekiplerinin QR kod veya makine koduyla arıza bildirimi oluşturduğu ve sorumluların arızaları takip ettiği React + PHP + MySQL uygulamasıdır.

## Teknoloji

Frontend production build’i Vite ile oluşturulur ve IIS/Plesk yayın köküne yüklenir. Backend `api/index.php` üzerinden PHP ile çalışır. Veriler MySQL’de tutulur; tarayıcı MySQL’e doğrudan bağlanmaz.

## Yerel build

```bash
npm install
npm run build
npm run lint
```

Yayınlanacak dosyalar `dist/` klasörünün içindedir. `dist` klasörünün kendisini değil, içindeki dosyaları hosting yayın köküne yükle.

## Hosting yapısı

```text
/httpdocs/
├── index.html
├── assets/
├── api/index.php
├── App_Data/config.php
├── App_Data/web.config
├── manifest.webmanifest
├── sw.js
└── web.config
```

## MySQL kurulumu

`database/mysql_schema.sql` dosyasını phpMyAdmin’e aktar. `App_Data/config.example.php` dosyasını `config.php` adıyla kopyala ve gerçek MySQL host, veritabanı, kullanıcı ve şifre bilgilerini gir. Gerçek `config.php` dosyası GitHub’a gönderilmemelidir; `.gitignore` içinde korunur.

Ayrıntılı FileZilla ve phpMyAdmin adımları için [`HOSTING_KURULUM_TR.md`](./HOSTING_KURULUM_TR.md) dosyasına bak.

## API kontrolü

Kurulumdan sonra aşağıdaki adres JSON yanıtı vermelidir:

```text
https://alan-adin.com/api/index.php?action=session
```

Beklenen ilk yanıt:

```json
{"user":null}
```

Bu proje sürümünde Firebase, Vercel Functions, Node.js API ve GitHub Pages yayın ayarları kullanılmaz. Hosting ortamı PHP ve MySQL desteklemelidir.
