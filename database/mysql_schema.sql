-- SESA-DASH PHP + MySQL uyumlu şema
-- Bu dosya sahte/test veri eklemez.
-- phpMyAdmin’de hedef veritabanı seçiliyken çalıştırılabilir.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) NOT NULL,
  ad VARCHAR(190) NOT NULL,
  name VARCHAR(190) NULL,
  canias_work_center_code VARCHAR(50) NULL,
  canias_department_code VARCHAR(50) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name),
  UNIQUE KEY uq_departments_work_center (canias_work_center_code),
  KEY idx_departments_department_code (canias_department_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  personnel_no VARCHAR(50) NULL,
  ad_soyad VARCHAR(190) NOT NULL DEFAULT '',
  full_name VARCHAR(190) NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('sorumlu','admin') NOT NULL DEFAULT 'sorumlu',
  role VARCHAR(30) NULL,
  telefon VARCHAR(50) NULL,
  bolum_idler JSON NULL,
  bolum_id VARCHAR(100) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  son_giris_tarihi DATETIME NULL,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_personnel_no (personnel_no),
  KEY idx_users_role_active (rol, aktif),
  KEY idx_users_role_compat (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS user_departments (
  user_id CHAR(36) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, department_id),
  KEY idx_user_departments_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(100) NOT NULL,
  data JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  is_secret TINYINT(1) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS machines (
  id CHAR(36) NOT NULL,
  kod VARCHAR(100) NOT NULL,
  code VARCHAR(100) NULL,
  ad VARCHAR(190) NOT NULL,
  name VARCHAR(190) NULL,
  bolum_id VARCHAR(100) NULL,
  department_id VARCHAR(100) NULL,
  bolum_ad VARCHAR(190) NULL,
  ekleyen_email VARCHAR(254) NULL,
  added_by_user_id CHAR(36) NULL,
  qr_code_value VARCHAR(255) NULL,
  canias_asset_no VARCHAR(64) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_machines_kod (kod),
  UNIQUE KEY uq_machines_code (code),
  UNIQUE KEY uq_machines_qr_code (qr_code_value),
  UNIQUE KEY uq_machines_canias_asset (canias_asset_no),
  KEY idx_machines_department_active (bolum_id, aktif),
  KEY idx_machines_department_compat (department_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS issues (
  id CHAR(36) NOT NULL,
  makine_id CHAR(36) NULL,
  machine_id CHAR(36) NULL,
  makine_kod VARCHAR(100) NOT NULL,
  machine_code VARCHAR(100) NULL,
  makine_ad VARCHAR(190) NULL,
  machine_name VARCHAR(190) NULL,
  bolum_id VARCHAR(100) NULL,
  department_id VARCHAR(100) NULL,
  bolum_ad VARCHAR(190) NULL,
  ekleyen_email VARCHAR(254) NULL,
  reporter_user_id CHAR(36) NULL,
  reporter_personnel_no VARCHAR(50) NULL,
  sorumlu_email VARCHAR(254) NULL,
  email VARCHAR(254) NULL,
  reporter_email VARCHAR(254) NULL,
  aciklama TEXT NOT NULL,
  description TEXT NULL,
  foto_url LONGTEXT NULL,
  durum ENUM('Açık','İşlemde','Çözüldü') NOT NULL DEFAULT 'Açık',
  status VARCHAR(30) NULL,
  cozulme_tarihi DATETIME NULL,
  resolved_at DATETIME NULL,
  cozen_sorumlu_id CHAR(36) NULL,
  resolved_by_user_id CHAR(36) NULL,
  durum_gecmisi JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_issues_status_created (durum, created_at),
  KEY idx_issues_machine_created (makine_id, created_at),
  KEY idx_issues_department_status (bolum_id, durum),
  KEY idx_issues_reporter_email (ekleyen_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS issue_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id CHAR(36) NOT NULL,
  durum ENUM('Açık','İşlemde','Çözüldü') NOT NULL,
  status VARCHAR(30) NULL,
  sorumlu_id CHAR(36) NULL,
  changed_by_user_id CHAR(36) NULL,
  tarih DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_issue_status_history_issue_time (issue_id, tarih)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;
