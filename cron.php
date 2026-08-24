<?php
/**
 * Sitelift - Shared-Hosting Scheduled Task Runner (Cron)
 * 
 * Usage:
 * CLI (cPanel / Crontab): php /path/to/public_html/cron.php --token=YOUR_CRON_TOKEN --task=all
 * HTTP (Web Cron / Uptime): https://yourdomain.com/cron.php?token=YOUR_CRON_TOKEN&task=all
 */

define('SITELIFT_CLI', php_sapi_name() === 'cli');
define('SITELIFT_ROOT', __DIR__);

if (!file_exists(SITELIFT_ROOT . '/writable/install.lock')) {
    die("Sitelift is not installed yet.\n");
}

// Load Environment
$env = @parse_ini_file(SITELIFT_ROOT . '/.env');
$validToken = $env['sitelift.cronToken'] ?? '';

$options = SITELIFT_CLI ? getopt('', ['token:', 'task:', 'website:']) : $_GET;
$providedToken = $options['token'] ?? '';
$task = $options['task'] ?? 'all';
$websiteId = $options['website'] ?? null;

if (empty($validToken) || $providedToken !== $validToken) {
    if (!SITELIFT_CLI) http_response_code(403);
    die("Access Denied: Invalid cron authentication token.\n");
}

// Database Connection
try {
    $dbHost = $env['database.default.hostname'] ?? '127.0.0.1';
    $dbName = $env['database.default.database'] ?? '';
    $dbUser = $env['database.default.username'] ?? '';
    $dbPass = $env['database.default.password'] ?? '';
    $dbPort = $env['database.default.port'] ?? 3306;
    $prefix = $env['database.default.DBPrefix'] ?? 'sl_';

    $pdo = new PDO(
        "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) {
    die("Cron Database Connection Error: " . $e->getMessage() . "\n");
}

echo "[" . date('Y-m-d H:i:s') . "] Starting Sitelift Scheduled Routine (Task: {$task})...\n";

// Execute Jobs for active websites
$stmt = $pdo->query("SELECT id, name, domain, status FROM `{$prefix}websites` WHERE status = 'active'");
$websites = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($websites) . " active website(s).\n";

foreach ($websites as $site) {
    echo "Processing site ID {$site['id']} ({$site['name']})...\n";
    // Sync GA4, Search Console, Bright Data Rank Tracker, Declining Pages Calculation
}

echo "[" . date('Y-m-d H:i:s') . "] Finished Sitelift Cron Run.\n";
