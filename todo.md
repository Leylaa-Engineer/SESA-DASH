# Project TODO

- [x] Mevcut arıza takip akışını, sayfaları ve veri kullanımını inceleme
- [x] Koyu temayı koruyan kurumsal tasarım sistemi ve bilgi hiyerarşisini tanımlama
- [x] Dashboard, arıza listesi ve detay görünümlerini uzman kullanıcı ihtiyaçlarına göre yenileme
- [x] Filtre, durum, öncelik ve tarih bilgilerini daha anlaşılır hâle getirme
- [ ] Mobil ve masaüstü arayüzü görsel olarak doğrulama
- [x] Derleme ve testleri çalıştırma
- [x] Yenilenen uygulamayı GitHub’a gönderip Vercel yayınını doğrulama

## Sayfa Geçişi Sorunu

- [ ] Route ve sayfa geçişlerinde kullanılan yönlendirme akışını incele.
- [ ] Firebase Auth/ProtectedRoute yükleme davranışını incele.
- [ ] PWA service worker ve önbellek kayıt akışını incele.
- [ ] Yenileme gerektiren akış için hedefli düzeltme uygula.
- [ ] Build, lint ve canlı geçiş davranışını doğrula.
- [ ] Düzeltmeyi GitHub’a gönder ve kullanıcıya canlı deployment adımlarını bildir.

## MySQL Veri Katmanına Geçiş

- [x] Firestore koleksiyonları ve alanları için SQL veri sözlüğünü kesinleştir
- [x] MySQL schema.sql dosyasını foreign key ve index kurallarıyla oluştur
- [ ] Firestore’dan MySQL’e güvenli veri taşıma scripti ve dry-run çıktısı hazırla
- [ ] Firebase sorgularını MySQL backend API katmanına taşı
- [ ] Frontend’i yeni API’ye bağla ve Firebase veri erişimini kaldır
- [ ] MySQL bağlantı değişkenlerini Vercel/server ortamında yapılandır
- [ ] Migration, lint, build ve canlı arıza bildirim akışını doğrula

## Boş MySQL Başlangıcı

- [x] Mevcut Firestore verilerini taşımadan boş MySQL şemasıyla başla
- [x] MySQL backend için DATABASE_URL ve güvenli bağlantı katmanını ekle
- [x] Yeni kayıt, makine, kullanıcı, arıza ve durum geçmişi API uçlarını oluştur
- [x] Frontend’de Firestore operasyon çağrılarını yeni API istemcisine geçir
- [ ] Boş veritabanı ile kayıt ve listeleme akışlarını doğrula

## Yeni Host Bağımsız QA

- [x] Vite production build ve lint sonuçlarını yeniden doğrula
- [x] Tüm Vercel API dosyalarında node syntax kontrolü çalıştır
- [x] DATABASE_URL yokken `/api/health` için güvenli 503 davranışını test et
- [x] SQL şeması, endpoint sözleşmesi ve `.env.example` tutarlılığını statik testle doğrula
- [x] Host kurulum adımlarını ve canlı MySQL gereksinimini dokümante et

## Dinamik Veri Garantisi

- [x] Makineler, kullanıcılar, arızalar ve durum geçmişi için sabit frontend verisi kullanılmadığını doğrula
- [x] API listeleme işlemlerinin her istekte MySQL’den güncel veri okuduğunu doğrula
- [x] Kayıt/güncelleme/silme sonrası ilgili listelerin yeniden sorgulandığını ve güncel kaldığını doğrula

## Vercel API Route QA

- [ ] Production `/api/health` 404 nedenini Vercel build/root route yapılandırmasında teşhis et
- [x] API fonksiyonlarının Vercel’de algılanması için gerekli yapılandırmayı ekle
- [ ] GitHub deployment sonrası `/api/health` ve frontend route’larını tekrar doğrula

- [ ] Vercel health fonksiyonundaki bağlantı/ortam hatasını function invocation failure yerine kontrollü 503 olarak döndür
- [ ] Vercel production `/api/health` yanıtını düzeltme sonrası tekrar doğrula

## CaniasERP Uyumlu SQL Şablonu

- [x] Mevcut SESA-DASH veri modelini Canias makine kodu, iş merkezi/departman kodu ve personel sicil no alanlarıyla karşılaştır
- [x] Yöneticinin uygulayabileceği açıklamalı MySQL schema ve INSERT taslak dosyasını hazırla
- [x] SQL şablonunu MySQL sözdizimi, foreign key sırası ve örnek veri olmaması açısından doğrula
- [x] Canias veri aktarımı için alan eşleştirme ve kullanım rehberini teslim et

## Yeni Production QA Bulgusu

- [ ] Vercel production `/api/health` hâlâ FUNCTION_INVOCATION_FAILED dönüyor; gerçek runtime logu veya Vercel proje erişimiyle teşhis et

## Canias Veri Giriş Tabloları

- [x] Canias uyumlu altı tablo için boş veri giriş şablonlarını oluştur (SQL ilişkisel yapı + 4 doğrudan Excel giriş sayfası)
- [x] Yöneticiye tablo ilişkilerini ve doldurma sırasını açıklayan veri sözlüğü hazırla
- [x] Şablon dosyasını doğrula ve GitHub’a gönder
