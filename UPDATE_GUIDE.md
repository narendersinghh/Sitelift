# Sitelift Safe Zero-Downtime Update Guide

Sitelift includes a built-in safe updater that allows you to update your installation directly from GitHub releases without wiping out any website data, keyword history, Google OAuth tokens, or database tables.

---

## How Safe Updates Work
1. **Pre-flight Health Check**: Verifies PHP 8.2+, database connectivity, and folder write permissions.
2. **Safety Snapshot Backup**: Automatically archives a rollback point in `writable/snapshots/` before touching any code.
3. **Atomic File Replacement**: Updates only core application logic (`app/`, `public/`, `update.php`, `cron.php`). Leaves your `.env`, `writable/`, and user uploaded files completely untouched.
4. **Incremental SQL Migrations**: Checks for unapplied migrations in `app/Database/Migrations/` and runs them safely.
5. **OPcache Invalidation**: Resets bytecode cache to ensure zero stale memory.

---

## 🛠️ Update Methods

### 1. Web-Based 1-Click Update (Easiest)
1. In Sitelift, go to **Deploy & Updates** in the sidebar.
2. Click **Check for Updates**.
3. If an update is detected, click **Safely Update to [Version]**.
4. The live progress logger will execute the backup, file update, and database migration automatically.

### 2. Command-Line (CLI / SSH / Terminal)
```bash
# Check if an update is available
php update.php --action=check

# Run the update
php update.php --action=update
```

### 3. Webhook / HTTP URL (Remote Trigger)
```bash
curl "https://yourdomain.com/update.php?token=YOUR_CRON_TOKEN&action=update"
```

---

## ⏪ 1-Click Instant Rollback
If you ever want to revert back to a previous snapshot:
- **Web UI**: Navigate to **Deploy & Updates > Version History & Snapshots** and click **Revert**.
- **CLI**: `php update.php --action=rollback --snapshot=snapshot_YYYYMMDD_HHMMSS`
