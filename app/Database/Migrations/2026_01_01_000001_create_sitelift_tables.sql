-- Sitelift MySQL Schema v1.2.0
-- Database: utf8mb4_unicode_ci, Engine: InnoDB

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `sl_users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'editor', 'viewer') DEFAULT 'admin',
  `remember_token` VARCHAR(100) NULL,
  `last_login_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Websites Table
CREATE TABLE IF NOT EXISTS `sl_websites` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `domain` VARCHAR(191) NOT NULL,
  `timezone` VARCHAR(50) DEFAULT 'UTC',
  `status` ENUM('active', 'paused', 'archived', 'deleted') DEFAULT 'active',
  `brand_terms` TEXT NULL,
  `notes` TEXT NULL,
  `ga_property_id` VARCHAR(50) NULL,
  `gsc_site_url` VARCHAR(255) NULL,
  `retention_days_override` INT UNSIGNED NULL,
  `traffic_decline_threshold` INT UNSIGNED DEFAULT 20,
  `default_country` VARCHAR(10) DEFAULT 'USA',
  `default_language` VARCHAR(10) DEFAULT 'en',
  `default_device` VARCHAR(20) DEFAULT 'desktop',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_domain` (`domain`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Google Analytics Connections
CREATE TABLE IF NOT EXISTS `sl_ga_connections` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `status` ENUM('connected', 'paused', 'error', 'disconnected') DEFAULT 'disconnected',
  `property_id` VARCHAR(50) NOT NULL,
  `property_name` VARCHAR(150) NULL,
  `account_email` VARCHAR(191) NOT NULL,
  `access_token_encrypted` TEXT NOT NULL,
  `refresh_token_encrypted` TEXT NOT NULL,
  `last_sync_at` DATETIME NULL,
  `last_sync_status` VARCHAR(50) DEFAULT 'idle',
  `last_error` TEXT NULL,
  `auto_sync_enabled` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_ga_web_id` (`website_id`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Google Search Console Connections
CREATE TABLE IF NOT EXISTS `sl_gsc_connections` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `status` ENUM('connected', 'paused', 'error', 'disconnected') DEFAULT 'disconnected',
  `site_url` VARCHAR(255) NOT NULL,
  `property_type` ENUM('url_prefix', 'domain') DEFAULT 'url_prefix',
  `account_email` VARCHAR(191) NOT NULL,
  `access_token_encrypted` TEXT NOT NULL,
  `refresh_token_encrypted` TEXT NOT NULL,
  `last_sync_at` DATETIME NULL,
  `last_sync_status` VARCHAR(50) DEFAULT 'idle',
  `last_error` TEXT NULL,
  `auto_sync_enabled` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_gsc_web_id` (`website_id`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Daily GA4 Page Metrics
CREATE TABLE IF NOT EXISTS `sl_page_metrics_daily` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `page_path` VARCHAR(255) NOT NULL,
  `full_url` VARCHAR(500) NOT NULL,
  `hostname` VARCHAR(150) NOT NULL,
  `clean_path` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) DEFAULT 'General',
  `source` VARCHAR(100) DEFAULT 'google',
  `medium` VARCHAR(100) DEFAULT 'organic',
  `channel_group` VARCHAR(100) DEFAULT 'Organic Search',
  `country` VARCHAR(10) DEFAULT 'USA',
  `device` VARCHAR(20) DEFAULT 'desktop',
  `sessions` INT UNSIGNED DEFAULT 0,
  `users` INT UNSIGNED DEFAULT 0,
  `engaged_sessions` INT UNSIGNED DEFAULT 0,
  `engagement_rate` DECIMAL(5,4) DEFAULT 0.0000,
  `conversions` INT UNSIGNED DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_site_date` (`website_id`, `date`),
  INDEX `idx_clean_path` (`clean_path`),
  INDEX `idx_category` (`category`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Daily GSC Query Metrics
CREATE TABLE IF NOT EXISTS `sl_gsc_query_metrics_daily` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `date` DATE NOT NULL,
  `page_url` VARCHAR(500) NOT NULL,
  `clean_path` VARCHAR(255) NOT NULL,
  `query` VARCHAR(255) NOT NULL,
  `is_branded` TINYINT(1) DEFAULT 0,
  `category` VARCHAR(100) DEFAULT 'General',
  `country` VARCHAR(10) DEFAULT 'USA',
  `device` VARCHAR(20) DEFAULT 'desktop',
  `clicks` INT UNSIGNED DEFAULT 0,
  `impressions` INT UNSIGNED DEFAULT 0,
  `ctr` DECIMAL(6,4) DEFAULT 0.0000,
  `position` DECIMAL(5,2) DEFAULT 0.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_site_date_query` (`website_id`, `date`, `query`),
  INDEX `idx_gsc_clean_path` (`clean_path`),
  INDEX `idx_branded` (`is_branded`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Keywords Table
CREATE TABLE IF NOT EXISTS `sl_keywords` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `keyword` VARCHAR(255) NOT NULL,
  `target_url` VARCHAR(500) NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `category` VARCHAR(100) DEFAULT 'General',
  `intent` ENUM('informational', 'commercial', 'transactional', 'navigational') DEFAULT 'informational',
  `tags` VARCHAR(255) NULL,
  `country` VARCHAR(10) DEFAULT 'USA',
  `language` VARCHAR(10) DEFAULT 'en',
  `device` ENUM('desktop', 'mobile') DEFAULT 'desktop',
  `status` ENUM('active', 'paused', 'archived') DEFAULT 'active',
  `is_branded` TINYINT(1) DEFAULT 0,
  `current_rank` INT UNSIGNED NULL,
  `previous_rank` INT UNSIGNED NULL,
  `best_rank` INT UNSIGNED NULL,
  `ranked_url` VARCHAR(500) NULL,
  `serp_features` TEXT NULL,
  `last_tracked_at` DATETIME NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_site_kw` (`website_id`, `keyword`),
  INDEX `idx_kw_status` (`status`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Keyword Rank Snapshots (Bright Data Tracker)
CREATE TABLE IF NOT EXISTS `sl_keyword_rank_snapshots` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `keyword_id` INT UNSIGNED NOT NULL,
  `website_id` INT UNSIGNED NOT NULL,
  `snapshot_date` DATE NOT NULL,
  `keyword` VARCHAR(255) NOT NULL,
  `rank` INT UNSIGNED NULL,
  `previous_rank` INT UNSIGNED NULL,
  `rank_change` INT DEFAULT 0,
  `ranked_url` VARCHAR(500) NULL,
  `country` VARCHAR(10) DEFAULT 'USA',
  `language` VARCHAR(10) DEFAULT 'en',
  `device` VARCHAR(20) DEFAULT 'desktop',
  `serp_features` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_snap_site_date` (`website_id`, `snapshot_date`),
  FOREIGN KEY (`keyword_id`) REFERENCES `sl_keywords`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Category Rules Table
CREATE TABLE IF NOT EXISTS `sl_category_rules` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `target_type` ENUM('page_url', 'keyword', 'query') NOT NULL,
  `match_type` ENUM('contains', 'starts_with', 'ends_with', 'regex') NOT NULL,
  `pattern` VARCHAR(255) NOT NULL,
  `category_name` VARCHAR(100) NOT NULL,
  `priority` INT UNSIGNED DEFAULT 10,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Insights Table
CREATE TABLE IF NOT EXISTS `sl_insights` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `severity` ENUM('critical', 'high', 'medium', 'info') DEFAULT 'medium',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `related_page_url` VARCHAR(500) NULL,
  `related_keyword` VARCHAR(255) NULL,
  `metric_context` JSON NULL,
  `status` ENUM('active', 'resolved', 'dismissed', 'converted_to_activity') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ins_site_status` (`website_id`, `status`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Activities Table
CREATE TABLE IF NOT EXISTS `sl_activities` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `effort` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `impact` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'high',
  `related_page_url` VARCHAR(500) NULL,
  `related_keyword` VARCHAR(255) NULL,
  `month` VARCHAR(7) NOT NULL,
  `status` ENUM('suggested', 'approved', 'in_progress', 'completed', 'ignored', 'snoozed') DEFAULT 'suggested',
  `assigned_user` VARCHAR(100) NULL,
  `due_date` DATE NULL,
  `notes` TEXT NULL,
  `completed_date` DATE NULL,
  `source_insight_id` INT UNSIGNED NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_act_site_month` (`website_id`, `month`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Monthly Reports Table
CREATE TABLE IF NOT EXISTS `sl_monthly_reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `month` VARCHAR(7) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `config` JSON NOT NULL,
  `snapshot_data` JSON NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_rep_site_month` (`website_id`, `month`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Sync Jobs Table
CREATE TABLE IF NOT EXISTS `sl_sync_jobs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `website_id` INT UNSIGNED NOT NULL,
  `job_type` VARCHAR(50) NOT NULL,
  `status` ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  `started_at` DATETIME NOT NULL,
  `ended_at` DATETIME NULL,
  `last_synced_date` DATE NULL,
  `attempts` INT UNSIGNED DEFAULT 1,
  `records_processed` INT UNSIGNED DEFAULT 0,
  `error_message` TEXT NULL,
  INDEX `idx_job_site` (`website_id`, `started_at`),
  FOREIGN KEY (`website_id`) REFERENCES `sl_websites`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Global Settings Table
CREATE TABLE IF NOT EXISTS `sl_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Schema Migrations Log Table
CREATE TABLE IF NOT EXISTS `sl_migrations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `migration` VARCHAR(255) NOT NULL,
  `batch` INT UNSIGNED NOT NULL DEFAULT 1,
  `executed_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
