# SESA-DASH Firebase/Firestore → MySQL Dönüşüm Rehberi

Bu rehber, SESA-DASH’in Firebase/Firestore veri ve kimlik doğrulama katmanından MySQL + Node.js REST API + JWT mimarisine geçirilmesi için hazırlanmıştır. Uygulama tarafında Firebase bağımlılığı kaldırılmıştır; kullanıcı parolaları bcrypt hash, erişim oturumları JWT olarak yönetilir.

## 1. Yeni mimarinin özeti

| Katman | Yeni çözüm | Görevi |
|---|---|---|
| Veri tabanı | MySQL / InnoDB | Users, Departments, Machines, Malfunctions/Issues ve durum geçmişini saklar |
| API | Vercel Node.js Serverless Functions | CRUD, QR/makine kodu sorgusu, yetki ve kimlik doğrulama |
| Kimlik doğrulama | `bcryptjs` + `jsonwebtoken` | Kayıt, giriş, parola doğrulama ve JWT üretimi |
| Frontend | React `fetch` istemcisi | JWT’yi taşıyarak REST endpointlerine istek gönderir |

SESA-DASH mevcut endpoint sözleşmesi nedeniyle arıza kayıtlarını `issues` tablosunda tutar. Bu tablo, kullanıcı tarafındaki “Malfunctions / Arıza ve Bakım” kavramının MySQL karşılığıdır.

## 2. MySQL kurulumu

Önce boş bir MySQL veritabanı oluşturun. Ardından proje kökünden aşağıdaki komutu çalıştırın:

```bash
mysql --host=HOST --user=USER --password DB_NAME < database/schema.sql
```

Canias’a ait gerçek iş merkezi, makine, personel ve arıza kayıtlarını `database/sesa-mysql-data-import-template.xlsx` dosyasındaki sayfalara girin. SQL kurulum ve INSERT taslakları için `database/canias-mysql-template.sql` dosyasını kullanın. Veri ekleme sırası `departments → users → user_departments → machines → issues` olmalıdır.

## 3. Ortam değişkenleri

`.env` dosyasını GitHub’a göndermeyin. Vercel Project Settings → Environment Variables bölümünde hem Preview hem Production için aşağıdaki değerleri tanımlayın:

```text
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/DB_NAME
DATABASE_SSL=true
DB_CONNECTION_LIMIT=5
JWT_SECRET=32-karakterden-uzun-rastgele-gizli-deger
JWT_EXPIRES_IN=8h
ADMIN_SIGNUP_CODE=yonetici-kayit-kodu
RESPONSIBLE_SIGNUP_CODE=sorumlu-kayit-kodu
```

`JWT_SECRET`, en az 32 karakter uzunluğunda ve tahmin edilemez olmalıdır. `ADMIN_SIGNUP_CODE` ve `RESPONSIBLE_SIGNUP_CODE` yalnızca sunucuda tutulur; React bundle içine yazılmaz.

## 4. Backend dosyaları ve endpointler

Ortak bağlantı ve JWT yardımcıları `api/_lib.js` içinde bulunur. Bu dosya MySQL pool oluşturur, bcrypt parola yardımcılarını çalıştırır, JWT imzalar/doğrular ve admin kontrolü sağlar.

| Endpoint | Method | İşlev | Yetki |
|---|---:|---|---|
| `/api/auth/register` | POST | Kullanıcı kaydı, bcrypt hash, bölüm ilişkisi ve JWT üretimi | Kayıt kodu |
| `/api/auth/login` | POST | E-posta/şifre doğrulama ve JWT üretimi | Her kullanıcı |
| `/api/users/me` | GET | JWT kullanıcısının MySQL profilini getirir | Giriş gerekli |
| `/api/users` | POST | Yönetici tarafından personel hesabı açar | Admin |
| `/api/users/list` | GET | Personel listesini getirir | Giriş gerekli |
| `/api/users/:id` | PATCH/DELETE | Bölüm yetkisi güncelleme veya pasifleştirme | Admin |
| `/api/departments` | GET | İş merkezi/departman listesi | Giriş gerekli |
| `/api/machines` | GET/POST | Makine listeleme, QR/makine kodu sorgulama ve oluşturma | Listeleme giriş; POST giriş |
| `/api/machines/:id` | PATCH/DELETE | Makine güncelleme veya pasifleştirme | Mevcut uygulama yetkisi |
| `/api/issues` | GET/POST | Arıza listeleme ve oluşturma | Giriş gerekli |
| `/api/issues/:id` | GET/PATCH/DELETE | Arıza detay, durum güncelleme ve silme | Giriş gerekli |
| `/api/health` | GET | DATABASE_URL ve MySQL bağlantı kontrolü | Public health |

Arıza oluşturulurken `reporter_user_id`, `reporter_personnel_no`, `machine_id`, `machine_code` ve `department_id` ilişkileri birlikte yazılır. QR kodu için makine kodu `/api/machines?code=KESIM-01` biçiminde sorgulanabilir.

## 5. Frontend değişiklikleri

`src/api/client.js` artık Firebase Auth tokenı istemez. `sesa_access_token` anahtarıyla localStorage’daki JWT’yi okur ve REST isteklerine Bearer token olarak ekler.

`src/contexts/AuthContext.jsx` içinde Firebase `onAuthStateChanged`, `signInWithEmailAndPassword` ve `signOut` çağrıları kaldırılmıştır. Uygulama açılışında JWT varsa `/api/users/me` çağrılır; geçersiz token silinir. `login`, `register` ve `logout` işlevleri MySQL API ile çalışır.

`src/pages/Register.jsx` artık önce Firebase hesabı oluşturmadan doğrudan `/api/auth/register` endpointine istek gönderir. `src/pages/Login.jsx` mevcut form üzerinden `/api/auth/login` kullanır. Firestore `getDocs`, `addDoc`, `onSnapshot`, `setDoc`, `updateDoc` ve `deleteDoc` çağrıları kullanılmaz.

## 6. Firebase dosyalarını ve paketlerini kaldırma

Aşağıdaki dosya ve paketler artık kullanılmamalıdır:

```text
src/firebase/config.js
firebase
firebase-admin
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

Paket değişiklikleri:

```bash
npm uninstall firebase firebase-admin
npm install bcryptjs jsonwebtoken
npm install mysql2
```

Bu proje Vercel Functions kullandığı için uygulama kodunda ayrıca Express sunucusu başlatmak zorunlu değildir. `api/*.js` dosyaları Vercel tarafından serverless function olarak çalıştırılır. Express yalnızca ayrı bir VPS/Node sunucusu tercih edilirse eklenmelidir.

## 7. Test ve canlıya alma sırası

Önce dosya ve paket kontrollerini çalıştırın:

```bash
npm install
npm run build
find api -type f -name '*.js' -print0 | xargs -0 -n1 node --check
```

Sonra MySQL bağlantı değişkenlerini Vercel’e ekleyin ve deployment oluşturun. Canlı ortamda sırasıyla `/api/health`, kayıt, giriş, `/api/departments`, `/api/machines?code=...`, arıza oluşturma ve arıza durum güncelleme akışlarını test edin.

> Mevcut Firestore verileri otomatik olarak MySQL’e kopyalanmaz. Eski veriler korunacaksa önce dışa aktarım ve alan eşleştirme yapılmalı; parola verileri düz metin olarak taşınmamalıdır.
