# Sitelift Self-Hosted Installation & Deployment Guide

This repository contains the complete self-installing codebase for **Sitelift** — your self-hosted personal SEO Intelligence Suite.

---

## 🚀 Shared Hosting Quick-Start (cPanel / DirectAdmin / FTP)

### Option 1: Direct Git Clone or Zip Upload (Recommended)
1. **Upload Files**: Upload the contents of this repository directly to your web hosting root directory (usually `public_html` or `www`).
2. **Create MySQL Database**:
   - In cPanel, go to **MySQL® Databases**.
   - Create a database (e.g. `youruser_sitelift`).
   - Create a database user and assign **ALL PRIVILEGES** to that database.
3. **Open the Web Installer**:
   - Open your web browser and navigate to:
     `https://yourdomain.com/` (or `https://yourdomain.com/install.php` or `https://yourdomain.com/public/install/`)
   - Sitelift will automatically detect that it's uninstalled and launch the **3-Step Web Installer Wizard**.
4. **Complete Setup**:
   - Enter your MySQL database credentials.
   - Enter your administrator name, email, and password.
   - Click **Run Installer & Build Tables**.
   - The installer will create all 14 InnoDB tables, write your `.env` config, and generate your secure Cron secret.

---

## ⏰ Cron Automation Setup (cPanel Crontab)

To enable automatic daily Google Search Console & GA4 metric synchronizations, Bright Data keyword rank tracking, and declining traffic alerts:

1. In cPanel, navigate to **Cron Jobs**.
2. Set Common Settings to: **Once Per Day** (or **Every Minute** if running distributed micro-tasks).
3. Enter the command shown at the end of the installation wizard:
```bash
* * * * * php /home/youruser/public_html/cron.php --token=YOUR_CRON_TOKEN >/dev/null 2>&1
```

---

## 🔄 Zero-Downtime Safe Updates

To update Sitelift to a newer version without losing any data or configuration:
```bash
php update.php --action=update
```
- Creates an automatic safety backup snapshot in `writable/snapshots/`
- Updates core application scripts
- Executes any new database schema migrations
- **All your website settings, OAuth tokens, keywords, and metrics remain 100% intact.**

---

## 📋 System Requirements
- **PHP**: 8.2 or higher
- **Extensions**: `pdo_mysql`, `curl`, `openssl`, `mbstring`, `json`
- **Database**: MySQL 5.7+ / 8.0+ or MariaDB 10.3+ (InnoDB, `utf8mb4`)
- **Web Server**: Apache 2.4+ (with `mod_rewrite` enabled) or Nginx / LiteSpeed
