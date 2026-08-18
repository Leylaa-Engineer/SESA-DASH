-- ============================================================================
-- SESA-DASH | CaniasERP Uyumlu MySQL Veri Tabanı Şablonu
-- ============================================================================
-- Amaç:
--   SESA-DASH arıza ve bakım yönetim sisteminin Firestore veri modelini,
--   CaniasERP ile ortak kod alanları kullanacak ilişkisel MySQL yapısına taşımak.
--
-- UYUMLULUK NOTU:
--   1) Bu dosya boş bir MySQL şemasında ilk kurulum için hazırlanmıştır.
--   2) SESA-DASH API'sinin beklediği tablo adları korunmuştur: departments,
--      users, user_departments, machines, issues ve issue_status_history.
--   3) SESA-DASH içinde "issues" tablosu, işletmedeki arıza/bakım kayıtlarını
--      temsil eder. Ayrı bir "malfunctions" tablosu açılmamıştır; böylece
--      mevcut API sözleşmesi bozulmadan Canias alanları eklenmiştir.
--   4) Canias kodları örnek veya otomatik üretilmiş değildir. Yönetici, aşağıdaki
--      INSERT taslaklarındaki köşeli parantezli alanları gerçek Canias değerleriyle
--      değiştirmeden INSERT satırlarını çalıştırmamalıdır.
--   5) Zaman alanları UTC olarak saklanır. Ekranda gösterim yerel zamana çevrilir.
--
-- UYGULAMA SIRASI:
--   A. Aşağıdaki CREATE TABLE bloklarının tamamını çalıştırın.
--   B. Canias veri giriş taslaklarında gerçek kodları ve adları doldurun.
--   C. Önce departments, sonra users, machines ve en son issues kayıtlarını ekleyin.
--   D. Foreign key hatası alırsanız ilgili üst kayıt henüz eklenmemiş demektir.
--
-- DESTEKLENEN ARAÇLAR:
--   phpMyAdmin, MySQL Workbench ve DBeaver. Çalıştırma rehberi dosyanın
--   sonundaki yorum bölümündedir.
-- ============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- İsteğe bağlıdır. Hosting sağlayıcısı veritabanını önceden oluşturduysa
-- bu satırları çalıştırmayın; yalnızca USE satırında doğru adı seçin.
-- CREATE DATABASE IF NOT EXISTS sesa_dash
--   CHARACTER SET utf8mb4 COLLATE utf8mb4_turkish_ci;
-- USE sesa_dash;

-- ============================================================================
-- 1. DEPARTMANLAR / İŞ MERKEZLERİ
-- ============================================================================
-- id: SESA-DASH/API foreign key alanıdır; Canias iş merkezi koduyla aynı tutulur.
-- canias_work_center_code: Canias'taki İş Merkezi kodu.
-- canias_department_code: Canias'ta iş merkezinin bağlı olduğu departman kodu.

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) NOT NULL COMMENT 'SESA-DASH anahtarı; tercihen Canias iş merkezi kodu',
  canias_work_center_code VARCHAR(50) NOT NULL COMMENT 'Canias İş Merkezi Kodu',
  canias_department_code VARCHAR(50) NULL COMMENT 'Canias Departman Kodu',
  name VARCHAR(150) NOT NULL COMMENT 'İş merkezi/departman adı',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_work_center (canias_work_center_code),
  KEY idx_departments_department_code (canias_department_code),
  UNIQUE KEY uq_departments_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================================================
-- 2. KULLANICILAR / PERSONEL
-- ============================================================================
-- firebase_uid kimlik doğrulama için tutulur; personel sicil no iş verisi anahtarıdır.
-- Rol değerleri uygulamada küçük harf ve sabit kod olarak saklanır:
--   admin       = Yönetici
--   operator    = Operatör
--   maintenance = Bakım personeli
--   sorumlu     = Mevcut SESA-DASH sürümüyle geriye dönük uyumluluk

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  firebase_uid VARCHAR(128) NULL COMMENT 'Firebase Auth kullanıcı UID değeri',
  personnel_no VARCHAR(50) NULL COMMENT 'Canias Personel Sicil No; ERP eşleştirmesi tamamlanana kadar NULL olabilir',
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(254) NOT NULL,
  role ENUM('admin', 'operator', 'maintenance', 'sorumlu') NOT NULL DEFAULT 'operator',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_personnel_no (personnel_no),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_firebase_uid (firebase_uid),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS user_departments (
  user_id BIGINT UNSIGNED NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, department_id),
  CONSTRAINT fk_user_departments_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_departments_department FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE RESTRICT,
  KEY idx_user_departments_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================================================
-- 3. MAKİNELER
-- ============================================================================
-- code: SESA-DASH ve Canias'ta ortak kullanılacak Makine Kodu; benzersiz olmalıdır.
-- qr_code_value: QR içinde taşınacak değer. Öneri: doğrudan code veya sabit URL.

CREATE TABLE IF NOT EXISTS machines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL COMMENT 'Canias Makine Kodu; örn. KESIM-01',
  name VARCHAR(180) NOT NULL COMMENT 'Makine adı/modeli',
  department_id VARCHAR(64) NOT NULL COMMENT 'Bağlı Canias iş merkezi/departman id',
  qr_code_value VARCHAR(255) NULL COMMENT 'QR kodun metin değeri veya URLsi',
  canias_asset_no VARCHAR(64) NULL COMMENT 'Varsa Canias demirbaş/varlık numarası',
  added_by_user_id BIGINT UNSIGNED NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_machines_code (code),
  UNIQUE KEY uq_machines_qr_value (qr_code_value),
  UNIQUE KEY uq_machines_asset_no (canias_asset_no),
  KEY idx_machines_department_active (department_id, is_active),
  CONSTRAINT fk_machines_department FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_machines_added_by_user FOREIGN KEY (added_by_user_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================================================
-- 4. ARIZA / BAKIM KAYITLARI
-- ============================================================================
-- issues tablosu uygulamadaki mevcut endpoint adlarıyla uyumludur.
-- machine_code, machine_name, reporter_personnel_no ve department_id alanları
-- olay anındaki bilgiyi koruyan snapshot alanlarıdır; ana ilişkiler de ayrıca tutulur.

CREATE TABLE IF NOT EXISTS issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  machine_id BIGINT UNSIGNED NOT NULL,
  machine_code VARCHAR(64) NOT NULL COMMENT 'Olay anındaki Canias Makine Kodu',
  machine_name VARCHAR(180) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  reporter_user_id BIGINT UNSIGNED NULL,
  reporter_personnel_no VARCHAR(50) NULL COMMENT 'Olay anındaki Canias Personel Sicil No',
  reporter_email VARCHAR(254) NOT NULL,
  malfunction_type VARCHAR(80) NULL COMMENT 'Arıza türü veya bakım türü',
  priority ENUM('low', 'normal', 'high', 'critical') NOT NULL DEFAULT 'normal',
  description TEXT NOT NULL,
  photo_url TEXT NULL,
  status ENUM('Açık', 'İşlemde', 'Çözüldü') NOT NULL DEFAULT 'Açık',
  resolved_at DATETIME(3) NULL,
  resolved_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_issues_status_created (status, created_at),
  KEY idx_issues_machine_created (machine_id, created_at),
  KEY idx_issues_department_status (department_id, status),
  KEY idx_issues_reporter_personnel (reporter_personnel_no),
  CONSTRAINT fk_issues_machine FOREIGN KEY (machine_id)
    REFERENCES machines(id) ON DELETE RESTRICT,
  CONSTRAINT fk_issues_department FOREIGN KEY (department_id)
    REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_issues_reporter_user FOREIGN KEY (reporter_user_id)
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_issues_resolved_by_user FOREIGN KEY (resolved_by_user_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS issue_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id BIGINT UNSIGNED NOT NULL,
  status ENUM('Açık', 'İşlemde', 'Çözüldü') NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_issue_status_history_issue_time (issue_id, changed_at),
  CONSTRAINT fk_issue_status_history_issue FOREIGN KEY (issue_id)
    REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_issue_status_history_user FOREIGN KEY (changed_by_user_id)
    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- ============================================================================
-- 5. CANIAS VERİ GİRİŞİ INSERT TASLAKLARI
-- ============================================================================
-- Aşağıdaki satırlar kasıtlı olarak yorum satırıdır. Gerçek Canias değerlerini
-- ekleyip başlarındaki -- işaretlerini kaldırdıktan sonra, bu sırayla çalıştırın.
-- Kodlarda baştaki sıfırları kaybetmemek için alanları tırnak içinde bırakın.

-- Departman / İş Merkezi:
-- INSERT INTO departments
--   (id, canias_work_center_code, canias_department_code, name)
-- VALUES
--   ('[IS_MERKEZI_KODU]', '[IS_MERKEZI_KODU]', '[DEPARTMAN_KODU]', '[IS_MERKEZI_ADI]');

-- Personel / Kullanıcı:
-- Firebase Auth hesabı açıldıktan sonra firebase_uid değerini güncelleyin.
-- personnel_no alanı mevcut SESA-DASH kayıt endpointiyle uyum için NULL olabilir;
-- üretim kullanımında Canias eşleştirmesi tamamlanınca doldurulması önerilir.
-- INSERT INTO users
--   (firebase_uid, personnel_no, full_name, email, role)
-- VALUES
--   ('[FIREBASE_UID_VEYA_NULL]', '[SICIL_NO]', '[AD SOYAD]', '[EPOSTA]', 'operator');
-- Geçerli role değerleri: admin, operator, maintenance, sorumlu.

-- Personelin iş merkezi/departman yetkisi:
-- INSERT INTO user_departments (user_id, department_id)
-- VALUES (
--   (SELECT id FROM users WHERE personnel_no = '[SICIL_NO]'),
--   '[IS_MERKEZI_KODU]'
-- );

-- Makine:
-- INSERT INTO machines
--   (code, name, department_id, qr_code_value, canias_asset_no, added_by_user_id)
-- VALUES
--   ('[MAKINE_KODU]', '[MAKINE_ADI]', '[IS_MERKEZI_KODU]',
--    '[QR_DEGERI]', '[DEMiRBAS_NUMARASI_VEYA_NULL]',
--    (SELECT id FROM users WHERE personnel_no = '[EKLEYEN_SICIL_NO]'));

-- Arıza / bakım kaydı:
-- INSERT INTO issues
--   (machine_id, machine_code, machine_name, department_id,
--    reporter_user_id, reporter_personnel_no, reporter_email,
--    malfunction_type, priority, description, status)
-- SELECT
--   m.id, m.code, m.name, m.department_id,
--   u.id, u.personnel_no, u.email,
--   '[ARIZA_TURU]', 'normal', '[ARIZA_ACIKLAMASI]', 'Açık'
-- FROM machines AS m
-- JOIN users AS u ON u.personnel_no = '[BILDIRIM_YAPAN_SICIL_NO]'
-- WHERE m.code = '[MAKINE_KODU]';

-- İlk durum geçmişi; issue_id, yukarıdaki INSERT sonrasında oluşan id'dir.
-- INSERT INTO issue_status_history (issue_id, status, changed_by_user_id)
-- VALUES (
--   [ARIZA_ID], 'Açık',
--   (SELECT id FROM users WHERE personnel_no = '[BILDIRIM_YAPAN_SICIL_NO]')
-- );

-- ============================================================================
-- 6. DOĞRULAMA SORGULARI
-- ============================================================================
-- Kodların ve ilişkilerin doğru geldiğini kontrol etmek için kullanılabilir.
-- SELECT id, canias_work_center_code, canias_department_code, name
-- FROM departments ORDER BY canias_work_center_code;
--
-- SELECT code, name, department_id, qr_code_value, canias_asset_no
-- FROM machines ORDER BY code;
--
-- SELECT personnel_no, full_name, email, role, is_active
-- FROM users ORDER BY personnel_no;
--
-- SELECT i.id, i.machine_code, i.reporter_personnel_no, i.status,
--        i.priority, i.created_at
-- FROM issues AS i ORDER BY i.created_at DESC;

-- ============================================================================
-- 7. phpMyAdmin / MySQL Workbench / DBeaver ÇALIŞTIRMA REHBERİ
-- ============================================================================
-- phpMyAdmin:
--   1) Sol menüden hedef veritabanını oluşturun veya seçin.
--   2) İçe Aktar (Import) sekmesine girin ve bu .sql dosyasını seçin.
--   3) Karakter setini utf-8/utf8mb4 bırakın ve içe aktarmayı başlatın.
--   4) İçe aktarma bittikten sonra departments ve users tablolarını kontrol edin.
--   5) INSERT taslaklarını gerçek değerlerle doldurmadan çalıştırmayın.
--
-- MySQL Workbench:
--   1) Veritabanı bağlantısını açın ve hedef şemayı seçin.
--   2) File > Open SQL Script ile bu dosyayı açın.
--   3) CREATE TABLE bloklarını çalıştırın.
--   4) Gerçek Canias listelerini doldurduktan sonra INSERT satırlarını sırayla çalıştırın.
--   5) Sol taraftaki Schemas panelinde Refresh yaparak tabloları doğrulayın.
--
-- DBeaver:
--   1) MySQL bağlantısına sağ tıklayıp SQL Editor > New SQL Script seçin.
--   2) Dosyayı açıp doğru database/schema bağlamını seçin.
--   3) Script'i çalıştırın; foreign key hatalarını ve sonuç bildirimini kontrol edin.
--   4) Sonuçları görmek için tabloları yenileyin ve 6. bölümdeki sorguları çalıştırın.
--
-- CANIAS AKTARIM KONTROLÜ:
--   Canias'tan dışa aktarılan dosya doğrudan çalıştırılmamalıdır. Önce kodların
--   boşluk, büyük/küçük harf, baştaki sıfır ve karakter seti kuralları kontrol edilir.
--   Personel sicil no, Makine Kodu ve İş Merkezi Kodu benzersiz ve tutarlı
--   olmalıdır. Canias'ın gerçek kolon adları ve zorunlu alanları şirketinizin
--   Canias danışmanı ile teyit edilmelidir; bu dosya uygulama ile ERP arasında
--   ortak veri sözlüğü sağlar, Canias'ın üreticiye özel tüm tablolarının yerine
--   geçmez.
-- ============================================================================
