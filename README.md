# SESA Operasyon Takip Sistemi

SESA saha ekiplerinin QR kod veya makine kodu üzerinden arıza bildirmesini, yetkili kullanıcıların da kayıtları takip edip durumlarını yönetmesini sağlayan React uygulamasıdır.

## Mimari

Uygulama artık Firebase/Firestore yerine **PostgreSQL + Node.js API + React/Vite** mimarisi kullanır. React istemcisi veritabanına doğrudan bağlanmaz; tüm veri işlemleri `server/index.js` içindeki API üzerinden yürütülür. Kimlik doğrulama ve roller de PostgreSQL `users` tablosunda tutulur.

## Yerel kurulum

Önce PostgreSQL sunucusunu başlatın:

```bash
docker compose up -d postgres
```

Ardından bağımlılıkları kurup uygulamayı başlatın:

```bash
npm install
cp .env.example .env
npm run dev:full
```

Frontend `http://localhost:5173`, SQL API ise `http://localhost:3001` adresinde çalışır. API sağlık kontrolü için `http://localhost:3001/api/health` adresi kullanılabilir.

## Veritabanı

Şema `server/schema.sql` dosyasındadır. PostgreSQL tabloları; `users`, `departments`, `machines`, `issues`, `issue_status_history` ve `settings` olarak ayrılmıştır. Arıza durum geçmişi, Firestore’daki dizi yapısı yerine ilişkisel `issue_status_history` tablosunda tutulur.

Mevcut Firebase projesindeki gerçek kayıtların aktarımı için Firebase yönetici kimlik bilgileri gerekir. Bu bilgiler paylaşılmadan canlı veriler otomatik olarak çekilmez; uygulama yeni PostgreSQL veritabanı üzerinde temiz şema ile çalışır.

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Yalnızca Vite frontend’ini başlatır |
| `npm run server` | PostgreSQL API sunucusunu başlatır |
| `npm run dev:full` | Frontend ve API’yi birlikte başlatır |
| `npm run build` | Üretim frontend derlemesi |
| `npm run lint` | Oxlint kontrolü |

Gerçek bağlantı bilgilerini `.env` dosyasında tutun; `.env` dosyasını GitHub’a göndermeyin. Şablon olarak yalnızca `.env.example` paylaşılmalıdır.
