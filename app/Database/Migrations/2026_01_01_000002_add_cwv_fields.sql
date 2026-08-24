-- Sitelift Migration: Core Web Vitals & Rank Indexes
-- Safe conditional execution for existing installations

SET FOREIGN_KEY_CHECKS = 0;

-- Ensure migration log entry
INSERT INTO `sl_migrations` (`migration`, `batch`, `executed_at`) 
VALUES ('2026_01_01_000002_add_cwv_fields.sql', 1, NOW())
ON DUPLICATE KEY UPDATE `executed_at` = NOW();

SET FOREIGN_KEY_CHECKS = 1;
