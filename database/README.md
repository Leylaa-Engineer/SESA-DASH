# SESA-DASH MySQL geçişi

Bu klasör, Firestore yerine kullanılacak boş MySQL veri katmanını içerir. Mevcut Firestore kayıtları bu geçişte taşınmaz; ilk production kurulumu boş şema üzerinden başlar.

## 1. Veritabanını oluşturma

MySQL sunucusunda bir veritabanı oluşturup `database/schema.sql` dosyasını bir kez çalıştırın. Dosya tablo, foreign key ve sorgu index’lerini oluşturur; yalnızca sabit bölüm kataloğunu ekler. Kullanıcı, makine ve arıza kayıtları uygulama akışıyla oluşur.

```bash
mysql --host=HOST --user=USER --password DB_NAME < database/schema.sql
```

## 2. Vercel değişkenleri

`.env.example` dosyasındaki değerleri Vercel Project Settings → Environment Variables bölümüne production ve preview ortamları için ekleyin. `DATABASE_URL`, Firebase Admin değişkenleri ve kayıt kodları istemciye gönderilmemelidir; bu yüzden `VITE_` öneki kullanılmamalıdır.

## 3. Geçiş mimarisi

Firebase Authentication başlangıç aşamasında kimlik doğrulama sağlayıcısı olarak korunur. Tarayıcı Firebase ID token alır ve `/api` fonksiyonlarına `Authorization: Bearer <token>` başlığıyla gönderir. Vercel API fonksiyonları token’ı Firebase Admin ile doğrular, kullanıcı/role bilgilerini MySQL’den okur ve operasyon kayıtlarını MySQL’e yazar.

Bu yaklaşım eski Firestore verilerini kopyalamaz ve parolaları MySQL’e taşımaz. Kimlik doğrulamanın tamamen MySQL’e alınması ayrı bir proje olarak tasarlanmalıdır; düz metin parola saklamak kabul edilemez.

## 4. Henüz gerekli olan canlı kurulum adımı

MySQL bağlantı bilgileri Vercel’e eklenmeden `/api/health` ve kayıt/arıza uçları 503 döndürür. Bağlantı eklendikten sonra boş veritabanında bölüm listesi, makine oluşturma, arıza oluşturma ve durum geçmişi akışları browser’da doğrulanmalıdır.
