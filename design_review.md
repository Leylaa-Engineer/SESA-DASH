# SESA Arıza Takip Sistemi — Mevcut Durum ve Yenileme Yönü

## Ürün Mantığı

SESA, üretim alanındaki makineler için **QR kod veya makine kodu üzerinden hızlı arıza bildirimi** sunar. Saha kullanıcısı makineyi açar, açıklama ve isteğe bağlı fotoğrafla kaydı iletir; sistem arızayı Firestore’a kaydeder ve ilgili bölüm sorumlularına e-posta gönderir. Yetkili kullanıcılar makine kayıtlarını, arıza durumlarını ve personeli rol bazında yönetir.

| Kullanıcı | Temel iş | Yenilenecek odak |
| --- | --- | --- |
| Saha kullanıcısı | QR tarar, makineyi bulur, arıza bildirir | Hızlı, hatasız ve güven veren bildirim akışı |
| Bölüm sorumlusu | Kendi makineleri ve arızalarını takip eder | Öncelik, durum ve sonraki aksiyonu hızla görme |
| Yönetici | Kayıt, kullanıcı ve kapsam görünürlüğünü yönetir | Kurumsal özet, filtreleme ve kontrol görünümü |

## Mevcut Arayüz Bulguları

Mevcut yapı işlevsel olmakla birlikte açık gri zemin, beyaz kartlar, yaygın inline stil kullanımı ve birbirinden kopuk görsel vurgular nedeniyle bir operasyon kontrol sistemi yerine temel form arayüzü algısı oluşturuyor. Arıza listesi zaten Açık, İşlemde ve Çözüldü durumlarını kullanıyor; yenilenen tasarım bu bilgiyi koyu zeminde daha belirgin durum rozetleri, bilgi yoğunluklu kartlar ve operasyon odaklı başlıklarla öne çıkaracaktır.

## Tasarım Yönü

Koyu gece laciverti yüzeyler, ince soğuk gri sınırlar ve sınırlı elektrik sarısı vurgu rengi kullanılacaktır. Kırmızı yalnız kritik veya açık arıza, amber işleme alınan kayıt ve yeşil çözülen kayıt için ayrılacaktır. Saha ekranında büyük ve tek amaçlı işlem yüzeyleri; yönetim ekranında ise operasyon özeti, görev kartları ve belirgin filtre katmanları kullanılacaktır.

## Görsel Doğrulama

Yerel tarayıcı önizlemesinde saha başlangıç ekranı ve yetkili giriş ekranı masaüstünde doğrulandı. Başlıklar, QR tarama ve manuel kod kartları, form kontrolleri ve koyu zemin üzerinde yeterli kontrast sağlıyor. Yerel başsız tarayıcıyla alınan dar ekran görüntüsü uygulama JavaScript’ini yüklemediği için yalnız koyu arka planı içerdi; bu nedenle telefon yerleşimi CSS’nin 768 piksel altındaki tek kolon ve sabit alt navigasyon kuralları üzerinden ayrıca gözden geçirildi. Production yayınından sonra gerçek telefonla son kullanım kontrolü yapılmalıdır.
