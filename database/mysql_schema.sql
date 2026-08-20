CREATE DATABASE IF NOT EXISTS `sesaitco_bakim` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sesaitco_bakim`;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  ad_soyad VARCHAR(190) NOT NULL DEFAULT '',
  telefon VARCHAR(50) NULL,
  rol ENUM('sorumlu','admin') NOT NULL DEFAULT 'sorumlu',
  bolum_idler JSON NULL,
  bolum_id VARCHAR(100) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  son_giris_tarihi DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (rol), INDEX idx_users_active (aktif)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(100) PRIMARY KEY,
  ad VARCHAR(190) NOT NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS machines (
  id CHAR(36) PRIMARY KEY,
  kod VARCHAR(100) NOT NULL UNIQUE,
  ad VARCHAR(190) NOT NULL,
  bolum_id VARCHAR(100) NULL,
  bolum_ad VARCHAR(190) NULL,
  ekleyen_email VARCHAR(190) NULL,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_machines_department (bolum_id), INDEX idx_machines_creator (ekleyen_email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issues (
  id CHAR(36) PRIMARY KEY,
  makine_id CHAR(36) NULL,
  makine_kod VARCHAR(100) NOT NULL,
  makine_ad VARCHAR(190) NULL,
  bolum_id VARCHAR(100) NULL,
  bolum_ad VARCHAR(190) NULL,
  ekleyen_email VARCHAR(190) NULL,
  sorumlu_email VARCHAR(190) NULL,
  email VARCHAR(190) NULL,
  aciklama TEXT NOT NULL,
  foto_url LONGTEXT NULL,
  durum ENUM('Açık','İşlemde','Çözüldü') NOT NULL DEFAULT 'Açık',
  cozulme_tarihi DATETIME NULL,
  cozen_sorumlu_id CHAR(36) NULL,
  durum_gecmisi JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_issues_machine (makine_id), INDEX idx_issues_status (durum), INDEX idx_issues_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(100) PRIMARY KEY,
  data JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS issue_status_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  issue_id CHAR(36) NOT NULL,
  durum VARCHAR(30) NOT NULL,
  tarih DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sorumlu_id CHAR(36) NULL,
  INDEX idx_history_issue (issue_id)
) ENGINE=InnoDB;
