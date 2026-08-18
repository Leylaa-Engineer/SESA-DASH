# SESA-DASH – CaniasERP Veri Tabloları

Bu veri sözlüğü, SESA-DASH ile CaniasERP arasında ortak kullanılacak temel kodları tanımlar. **Önce `departments`, sonra `users`, `user_departments`, `machines`, `issues` ve son olarak `issue_status_history` tabloları doldurulmalıdır.**

## Tablo ilişkileri

| Tablo | İşlev | Canias ana alanı | Bağlantı |
|---|---|---|---|
| `departments` | İş merkezi/departman kartları | İş Merkezi Kodu, Departman Kodu | `machines.department_id`, `user_departments.department_id`, `issues.department_id` |
| `users` | Personel ve sistem kullanıcıları | Personel Sicil No | `reporter_user_id`, `resolved_by_user_id` |
| `user_departments` | Personelin iş merkezi yetkisi | İş Merkezi Kodu | `users` ↔ `departments` |
| `machines` | Makine kartları | Makine Kodu | `issues.machine_id` |
| `issues` | Arıza ve bakım bildirimleri | Makine Kodu, Personel Sicil No | `machines`, `users`, `departments` |
| `issue_status_history` | Arıza durum değişiklikleri | Personel Sicil No | `issues` |

## Doldurma tabloları

### 1. Departmanlar / İş Merkezleri

| id | canias_work_center_code | canias_department_code | name | is_active |
|---|---|---|---|---|
| Canias İş Merkezi Kodu | Canias İş Merkezi Kodu | Canias Departman Kodu | İş merkezi adı | 1 |

### 2. Kullanıcılar / Personel

| personnel_no | full_name | email | role | firebase_uid | is_active |
|---|---|---|---|---|---|
| Canias Personel Sicil No | Ad Soyad | Kurumsal e-posta | `admin` / `operator` / `maintenance` / `sorumlu` | Firebase Auth UID | 1 |

### 3. Personel–İş Merkezi Yetkileri

| personnel_no | department_id |
|---|---|
| Canias Personel Sicil No | İş Merkezi Kodu |

### 4. Makineler

| code | name | department_id | qr_code_value | canias_asset_no | is_active |
|---|---|---|---|---|---|
| Canias Makine Kodu | Makine adı/modeli | İş Merkezi Kodu | QR içeriği veya URL | Varsa Canias varlık/demirbaş no | 1 |

### 5. Arıza / Bakım Kayıtları

| machine_code | reporter_personnel_no | malfunction_type | priority | description | status | created_at |
|---|---|---|---|---|---|---|
| Canias Makine Kodu | Bildiren personel sicil no | Arıza/bakım türü | `low` / `normal` / `high` / `critical` | Açıklama | `Açık` / `İşlemde` / `Çözüldü` | UTC tarih-saat |

### 6. Durum Geçmişi

| issue_id | status | changed_by_user_id | changed_at |
|---|---|---|---|
| Arıza ID | `Açık` / `İşlemde` / `Çözüldü` | Değişikliği yapan kullanıcı ID | UTC tarih-saat |

> **Önemli:** Aynı Makine Kodu, İş Merkezi Kodu ve Personel Sicil No farklı yazımlarla tekrar girilmemelidir. Baştaki sıfırları korumak için kodlar Excel’de “Metin” biçiminde tutulmalıdır.

## Yöneticiye önerilen veri giriş sırası

Önce Canias’tan iş merkezi/departman listesini `departments` tablosuna aktarın. Ardından personel listesini `users` tablosuna, personel yetkilerini `user_departments` tablosuna ve makine listesini `machines` tablosuna aktarın. Arıza kayıtları ancak makine ve bildiren personel kartları oluşturulduktan sonra eklenmelidir.

Doğrudan veri yazılacak boş Excel dosyası `canias-data-entry-template.xlsx` içinde dört ana sayfa olarak yer alır: Departmanlar, Personel, Makineler ve Arıza/Bakım. SQL tarafında bu veriler ilişkisel olarak altı tabloya ayrılır; kurulum ve INSERT taslakları `canias-mysql-template.sql` dosyasındadır.
