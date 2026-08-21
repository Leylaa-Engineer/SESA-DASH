-- SESA-DASH MySQL schema
-- This file creates the relational target schema. It does not insert fake or test data.
-- Use UTC timestamps at the application/database boundary.

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(150) NOT NULL,
  canias_work_center_code VARCHAR(50) NULL,
  canias_department_code VARCHAR(50) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_name (name),
  UNIQUE KEY uq_departments_work_center (canias_work_center_code),
  KEY idx_departments_department_code (canias_department_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  personnel_no VARCHAR(50) NULL,
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operator', 'maintenance', 'sorumlu') NOT NULL DEFAULT 'sorumlu',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_personnel_no (personnel_no),
  KEY idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS user_departments (
  user_id BIGINT UNSIGNED NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, department_id),
  CONSTRAINT fk_user_departments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_departments_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  KEY idx_user_departments_department (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS machines (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  added_by_user_id BIGINT UNSIGNED NULL,
  qr_code_value VARCHAR(255) NULL,
  canias_asset_no VARCHAR(64) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_machines_code (code),
  UNIQUE KEY uq_machines_qr_code_value (qr_code_value),
  UNIQUE KEY uq_machines_canias_asset_no (canias_asset_no),
  KEY idx_machines_department_active (department_id, is_active),
  CONSTRAINT fk_machines_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_machines_added_by_user FOREIGN KEY (added_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS issues (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  machine_id BIGINT UNSIGNED NOT NULL,
  machine_code VARCHAR(64) NOT NULL,
  machine_name VARCHAR(180) NOT NULL,
  department_id VARCHAR(64) NOT NULL,
  reporter_user_id BIGINT UNSIGNED NULL,
  reporter_personnel_no VARCHAR(50) NULL,
  reporter_email VARCHAR(254) NULL,
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
  KEY idx_issues_reporter_email (reporter_email),
  CONSTRAINT fk_issues_machine FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE RESTRICT,
  CONSTRAINT fk_issues_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_issues_reporter_user FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_issues_resolved_by_user FOREIGN KEY (resolved_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

CREATE TABLE IF NOT EXISTS issue_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  issue_id BIGINT UNSIGNED NOT NULL,
  status ENUM('Açık', 'İşlemde', 'Çözüldü') NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  changed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_issue_status_history_issue_time (issue_id, changed_at),
  CONSTRAINT fk_issue_status_history_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_issue_status_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;

-- Yönetici, Canias'taki gerçek iş merkezi ve personel kayıtlarını kendi aktarım
-- dosyasından eklemelidir. Bu şema sahte/örnek müşteri verisi eklemez.
-- Kayıt yetkilendirme kodları yalnızca sunucu ortam değişkenlerinde tutulmalıdır.
