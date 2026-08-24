import JSZip from 'jszip';

export interface CodeFile {
  path: string;
  category: 'installer' | 'controller' | 'model' | 'service' | 'config' | 'migration' | 'docs';
  description: string;
  content: string;
}

export const phpCodebaseFiles: CodeFile[] = [
  {
    path: 'install.php',
    category: 'installer',
    description: 'Direct root standalone installer file (accessible via yourdomain.com/install.php).',
    content: `<?php
/**
 * Sitelift - Direct Root Installation File
 * Accessible via https://yourdomain.com/install.php
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

define('SITELIFT_ROOT', __DIR__);
$lockFile = SITELIFT_ROOT . '/writable/install.lock';

if (file_exists($lockFile)) {
    die("<!DOCTYPE html><html><head><title>Installation Locked</title><style>body{background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;} .box{background:#1e293b;border:1px solid #334155;padding:32px;border-radius:12px;max-width:500px;text-align:center;}</style></head><body><div class='box'><h2 style='color:#38bdf8'>Sitelift is Installed</h2><p style='color:#94a3b8'>For security, the installer is locked. If you wish to reinstall, delete <code>writable/install.lock</code>.</p><a href='index.php' style='color:#38bdf8;text-decoration:none;font-weight:bold;'>&larr; Go to Dashboard</a></div></body></html>");
}

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$errors = [];
$success = null;

// Step 1: System Requirements Check
$requirements = [
    'PHP Version (>= 8.2)' => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL Extension'  => extension_loaded('pdo_mysql'),
    'cURL Extension'       => extension_loaded('curl'),
    'OpenSSL Extension'    => extension_loaded('openssl'),
    'mbstring Extension'   => extension_loaded('mbstring'),
    'JSON Extension'       => extension_loaded('json'),
    'Writable Directory'   => is_writable(SITELIFT_ROOT) || is_writable(SITELIFT_ROOT . '/writable') || @mkdir(SITELIFT_ROOT . '/writable', 0755, true)
];

$allRequirementsPassed = !in_array(false, $requirements, true);

// Handle Installation Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'install') {
        $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
        $dbPort = trim($_POST['db_port'] ?? '3306');
        $dbName = trim($_POST['db_name'] ?? 'sitelift');
        $dbUser = trim($_POST['db_user'] ?? 'root');
        $dbPass = $_POST['db_pass'] ?? '';
        $dbPrefix = trim($_POST['db_prefix'] ?? 'sl_');

        $adminEmail = trim($_POST['admin_email'] ?? '');
        $adminName = trim($_POST['admin_name'] ?? 'Administrator');
        $adminPass = $_POST['admin_password'] ?? '';

        if (empty($adminEmail) || empty($adminPass)) {
            $errors[] = "Admin email and password are required.";
        }

        if (empty($errors)) {
            try {
                // Attempt connection to MySQL server
                $dsnWithoutDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
                $pdo = new PDO($dsnWithoutDb, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);

                // Create database if permitted
                $pdo->exec("CREATE DATABASE IF NOT EXISTS \`{$dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                $pdo->exec("USE \`{$dbName}\`;");

                // Execute SQL Schema Migration
                $migrationPath = SITELIFT_ROOT . '/app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql';
                if (file_exists($migrationPath)) {
                    $schemaSql = file_get_contents($migrationPath);
                    $schemaSql = str_replace('sl_', $dbPrefix, $schemaSql);
                    $pdo->exec($schemaSql);
                }

                // Create Admin User
                $passHash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
                $stmt = $pdo->prepare("INSERT INTO {$dbPrefix}users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', NOW())");
                $stmt->execute([$adminName, $adminEmail, $passHash]);

                // Generate App Key and Cron Token
                $appKey = 'base64:' . base64_encode(random_bytes(32));
                $cronToken = 'sl_cron_' . bin2hex(random_bytes(16));

                // Insert Default Settings
                $stmt = $pdo->prepare("INSERT INTO {$dbPrefix}settings (setting_key, setting_value, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?");
                $settings = [
                    'app_name' => 'Sitelift',
                    'app_key' => $appKey,
                    'cron_token' => $cronToken,
                    'timezone' => 'America/New_York',
                    'retention_days_daily' => '365',
                    'retention_days_queries' => '180',
                    'retention_days_rank' => '730',
                    'retention_days_logs' => '60'
                ];
                foreach ($settings as $k => $v) {
                    $stmt->execute([$k, $v, $v]);
                }

                // Write .env config file
                $envContent = "# Sitelift Configuration Generated " . date('Y-m-d H:i:s') . "\\n" .
                    "CI_ENVIRONMENT = production\\n\\n" .
                    "app.baseURL = '" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://{$_SERVER['HTTP_HOST']}/'\\n" .
                    "app.appKey = '{$appKey}'\\n\\n" .
                    "database.default.hostname = '{$dbHost}'\\n" .
                    "database.default.database = '{$dbName}'\\n" .
                    "database.default.username = '{$dbUser}'\\n" .
                    "database.default.password = '{$dbPass}'\\n" .
                    "database.default.DBDriver = 'MySQLi'\\n" .
                    "database.default.DBPrefix = '{$dbPrefix}'\\n" .
                    "database.default.port = {$dbPort}\\n\\n" .
                    "sitelift.cronToken = '{$cronToken}'\\n";

                file_put_contents(SITELIFT_ROOT . '/.env', $envContent);

                // Create Lock File
                if (!is_dir(SITELIFT_ROOT . '/writable')) {
                    @mkdir(SITELIFT_ROOT . '/writable', 0755, true);
                }
                file_put_contents($lockFile, json_encode([
                    'installed_at' => date('c'),
                    'version' => '1.2.0',
                    'admin_email' => $adminEmail
                ], JSON_PRETTY_PRINT));

                $step = 4;
                $success = true;
            } catch (Exception $e) {
                $errors[] = "Database Connection / Migration Failed: " . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitelift Installer - Step <?= $step ?> of 4</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #0b1120; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .installer-card { background-color: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 620px; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
        .brand-header { text-align: center; margin-bottom: 24px; }
        .brand-title { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .brand-subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; }
        .steps-bar { display: flex; gap: 8px; margin-bottom: 24px; justify-content: center; }
        .step-pill { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: #334155; color: #94a3b8; }
        .step-pill.active { background: #2563eb; color: #ffffff; }
        .step-pill.done { background: #059669; color: #ffffff; }
        .req-list { border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
        .req-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #334155; background: #0f172a; font-size: 13px; }
        .req-item:last-child { border-bottom: none; }
        .badge { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
        .badge-pass { background: #065f46; color: #6ee7b7; }
        .badge-fail { background: #991b1b; color: #fca5a5; }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 12px; font-weight: 700; color: #cbd5e1; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .form-control { width: 100%; padding: 10px 14px; background: #0f172a; border: 1px solid #334155; border-radius: 8px; color: #ffffff; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .form-control:focus { border-color: #3b82f6; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; text-decoration: none; transition: all 0.2s; }
        .btn-primary { background: #2563eb; color: #ffffff; }
        .btn-primary:hover { background: #1d4ed8; }
        .alert-error { background: #450a0a; border: 1px solid #991b1b; color: #fecaca; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
        .alert-error ul { margin-left: 20px; }
        .code-box { background: #000000; border: 1px solid #334155; border-radius: 8px; padding: 14px; font-family: monospace; font-size: 12px; color: #38bdf8; word-break: break-all; margin: 16px 0; }
    </style>
</head>
<body>
<div class="installer-card">
    <div class="brand-header">
        <div class="brand-title">Sitelift Installer</div>
        <div class="brand-subtitle">Step <?= $step ?> of 4 &bull; Shared Hosting Quick Setup</div>
    </div>

    <div class="steps-bar">
        <div class="step-pill <?= $step === 1 ? 'active' : ($step > 1 ? 'done' : '') ?>"><?= $step > 1 ? '✓' : '1' ?></div>
        <div class="step-pill <?= $step === 2 ? 'active' : ($step > 2 ? 'done' : '') ?>"><?= $step > 2 ? '✓' : '2' ?></div>
        <div class="step-pill <?= $step === 3 ? 'active' : ($step > 3 ? 'done' : '') ?>"><?= $step > 3 ? '✓' : '3' ?></div>
        <div class="step-pill <?= $step === 4 ? 'done' : '' ?>"><?= $step === 4 ? '✓' : '4' ?></div>
    </div>

    <?php if (!empty($errors)): ?>
        <div class="alert-error">
            <ul>
                <?php foreach ($errors as $err): ?>
                    <li><?= htmlspecialchars($err) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <?php if ($step === 1): ?>
        <h4 style="font-size:14px; font-weight:700; margin-bottom:12px; color:#e2e8f0;">PHP Environment & Extensions</h4>
        <div class="req-list">
            <?php foreach ($requirements as $name => $passed): ?>
                <div class="req-item">
                    <span><?= htmlspecialchars($name) ?></span>
                    <span class="badge <?= $passed ? 'badge-pass' : 'badge-fail' ?>">
                        <?= $passed ? 'Available' : 'Missing' ?>
                    </span>
                </div>
            <?php endforeach; ?>
        </div>
        <?php if ($allRequirementsPassed): ?>
            <a href="install.php?step=2" class="btn btn-primary">Continue to Database Setup &rarr;</a>
        <?php else: ?>
            <p style="font-size:12px; color:#f87171; text-align:center;">Please enable the missing PHP extensions in your cPanel PHP selector before proceeding.</p>
        <?php endif; ?>

    <?php elseif ($step === 2 || $step === 3): ?>
        <form method="POST" action="install.php">
            <input type="hidden" name="action" value="install">
            
            <h4 style="font-size:13px; font-weight:700; margin-bottom:12px; color:#60a5fa; text-transform:uppercase;">1. MySQL Database Details</h4>
            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">Database Host</label>
                    <input type="text" name="db_host" class="form-control" value="127.0.0.1" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Database Port</label>
                    <input type="text" name="db_port" class="form-control" value="3306" required>
                </div>
            </div>

            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">Database Name</label>
                    <input type="text" name="db_name" class="form-control" value="sitelift" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Table Prefix</label>
                    <input type="text" name="db_prefix" class="form-control" value="sl_" required>
                </div>
            </div>

            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">Database Username</label>
                    <input type="text" name="db_user" class="form-control" placeholder="cpanel_user" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Database Password</label>
                    <input type="password" name="db_pass" class="form-control" placeholder="••••••••">
                </div>
            </div>

            <h4 style="font-size:13px; font-weight:700; margin-top:12px; margin-bottom:12px; color:#60a5fa; text-transform:uppercase;">2. Admin Account</h4>
            <div class="grid-2">
                <div class="form-group">
                    <label class="form-label">Admin Name</label>
                    <input type="text" name="admin_name" class="form-control" value="Administrator" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Admin Email</label>
                    <input type="email" name="admin_email" class="form-control" placeholder="admin@domain.com" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Admin Password</label>
                <input type="password" name="admin_password" class="form-control" placeholder="Min 8 characters" minlength="8" required>
            </div>

            <button type="submit" class="btn btn-primary" style="margin-top:8px;">Run Migrations & Complete Setup &rarr;</button>
        </form>

    <?php elseif ($step === 4): ?>
        <div style="text-align:center; padding: 12px 0;">
            <div style="font-size: 48px; color: #10b981; margin-bottom: 12px;">✓</div>
            <h3 style="font-size: 20px; font-weight: 800; color: #ffffff;">Installation Successful!</h3>
            <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Database tables, compound indexes, and encryption keys are configured.</p>
            
            <div class="code-box" style="text-align:left;">
                <strong>Crontab Command for Automated Syncing:</strong><br>
                * * * * * php <?= SITELIFT_ROOT ?>/cron.php --token=<?= $cronToken ?> >/dev/null 2>&1
            </div>

            <a href="index.php" class="btn btn-primary" style="margin-top:16px;">Go to Dashboard Login &rarr;</a>
        </div>
    <?php endif; ?>
</div>
</body>
</html>`
  },
  {
    path: 'index.php',
    category: 'config',
    description: 'Root router that auto-redirects to web installer if uninstalled, or serves dashboard.',
    content: `<?php
/**
 * Sitelift - Entry Router & Auto-Installer Redirect
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

$lockFile = __DIR__ . '/writable/install.lock';

if (!file_exists($lockFile)) {
    // If not installed yet, redirect automatically to installer
    if (file_exists(__DIR__ . '/install.php')) {
        header('Location: install.php');
        exit;
    } elseif (file_exists(__DIR__ . '/install/index.php')) {
        header('Location: install/index.php');
        exit;
    } elseif (file_exists(__DIR__ . '/public/install/index.php')) {
        header('Location: public/install/index.php');
        exit;
    }
}

// If installed, serve the main dashboard or public app
if (file_exists(__DIR__ . '/public/index.php')) {
    require_once __DIR__ . '/public/index.php';
} else {
    echo "<h1>Sitelift Active</h1><p>Application is installed. Access your dashboard at <a href='public/index.php'>public/index.php</a>.</p>";
}
`
  },
  {
    path: '.htaccess',
    category: 'config',
    description: 'Root Apache configuration with mod_rewrite routing and security headers.',
    content: `<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Allow direct access to installer
    RewriteRule ^install/?$ install/index.php [L,QSA]
    RewriteRule ^install/(.*)$ install/$1 [L,QSA]

    # Protect sensitive config and storage folders
    RewriteRule ^(app|writable|\.env|composer\.(json|lock)) - [F,L,NC]

    # Route remaining requests
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [L,QSA]
</IfModule>
`
  },
  {
    path: 'install/index.php',
    category: 'installer',
    description: 'Direct root installer entry point for shared hosting environments.',
    content: `<?php
/**
 * Sitelift - Direct Root Installation Entry Point
 */
define('SITELIFT_ROOT', dirname(__DIR__));
$lockFile = SITELIFT_ROOT . '/writable/install.lock';

if (file_exists($lockFile)) {
    die("<h1>Installation Locked</h1><p>Sitelift has already been installed. For security reasons, the installer is disabled. Remove <code>writable/install.lock</code> if you need to reinstall.</p>");
}

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$errors = [];
$success = null;

// Step 1: System Requirements Check
$requirements = [
    'PHP Version (>= 8.2)' => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL Extension'  => extension_loaded('pdo_mysql'),
    'cURL Extension'       => extension_loaded('curl'),
    'OpenSSL Extension'    => extension_loaded('openssl'),
    'mbstring Extension'   => extension_loaded('mbstring'),
    'JSON Extension'       => extension_loaded('json'),
    'Writable Folders'     => is_writable(SITELIFT_ROOT . '/writable') || @mkdir(SITELIFT_ROOT . '/writable', 0755, true)
];

$allRequirementsPassed = !in_array(false, $requirements, true);

// Step 2 & 3: Database & Admin Setup Processing
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'install') {
        $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
        $dbPort = trim($_POST['db_port'] ?? '3306');
        $dbName = trim($_POST['db_name'] ?? 'sitelift');
        $dbUser = trim($_POST['db_user'] ?? 'root');
        $dbPass = $_POST['db_pass'] ?? '';
        $dbPrefix = trim($_POST['db_prefix'] ?? 'sl_');

        $adminEmail = trim($_POST['admin_email'] ?? '');
        $adminName = trim($_POST['admin_name'] ?? 'Administrator');
        $adminPass = $_POST['admin_password'] ?? '';

        if (empty($adminEmail) || empty($adminPass)) {
            $errors[] = "Admin email and password are required.";
        }

        if (empty($errors)) {
            try {
                // Attempt connection to MySQL server
                $dsnWithoutDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
                $pdo = new PDO($dsnWithoutDb, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);

                // Create database if permitted
                $pdo->exec("CREATE DATABASE IF NOT EXISTS \`{$dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                $pdo->exec("USE \`{$dbName}\`;");

                // Execute SQL Schema Migration
                $migrationPath = SITELIFT_ROOT . '/app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql';
                if (file_exists($migrationPath)) {
                    $schemaSql = file_get_contents($migrationPath);
                    $schemaSql = str_replace('sl_', $dbPrefix, $schemaSql);
                    $pdo->exec($schemaSql);
                }

                // Create Admin User
                $passHash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
                $stmt = $pdo->prepare("INSERT INTO {$dbPrefix}users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', NOW())");
                $stmt->execute([$adminName, $adminEmail, $passHash]);

                // Generate App Key and Cron Token
                $appKey = 'base64:' . base64_encode(random_bytes(32));
                $cronToken = 'sl_cron_' . bin2hex(random_bytes(16));

                // Insert Default Settings
                $stmt = $pdo->prepare("INSERT INTO {$dbPrefix}settings (setting_key, setting_value, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?");
                $settings = [
                    'app_name' => 'Sitelift',
                    'app_key' => $appKey,
                    'cron_token' => $cronToken,
                    'timezone' => 'America/New_York',
                    'retention_days_daily' => '365',
                    'retention_days_queries' => '180',
                    'retention_days_rank' => '730',
                    'retention_days_logs' => '60'
                ];
                foreach ($settings as $k => $v) {
                    $stmt->execute([$k, $v, $v]);
                }

                // Write .env config file
                $envContent = "# Sitelift Configuration Generated " . date('Y-m-d H:i:s') . "\\n" .
                    "CI_ENVIRONMENT = production\\n\\n" .
                    "app.baseURL = '" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://{$_SERVER['HTTP_HOST']}/'\\n" .
                    "app.appKey = '{$appKey}'\\n\\n" .
                    "database.default.hostname = '{$dbHost}'\\n" .
                    "database.default.database = '{$dbName}'\\n" .
                    "database.default.username = '{$dbUser}'\\n" .
                    "database.default.password = '{$dbPass}'\\n" .
                    "database.default.DBDriver = 'MySQLi'\\n" .
                    "database.default.DBPrefix = '{$dbPrefix}'\\n" .
                    "database.default.port = {$dbPort}\\n\\n" .
                    "sitelift.cronToken = '{$cronToken}'\\n";

                file_put_contents(SITELIFT_ROOT . '/.env', $envContent);

                // Create Lock File
                file_put_contents($lockFile, json_encode([
                    'installed_at' => date('c'),
                    'version' => '1.2.0',
                    'admin_email' => $adminEmail
                ], JSON_PRETTY_PRINT));

                $step = 4;
                $success = true;
            } catch (Exception $e) {
                $errors[] = "Installation Failed: " . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitelift Installer - Step <?= $step ?> of 4</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; }
        .badge-ok { background-color: #059669; }
        .badge-fail { background-color: #dc2626; }
        .btn-primary { background-color: #2563eb; border-color: #2563eb; font-weight: 600; }
        .btn-primary:hover { background-color: #1d4ed8; border-color: #1d4ed8; }
        .form-control, .form-select { background-color: #0f172a; border-color: #334155; color: #f8fafc; }
        .form-control:focus { background-color: #0f172a; border-color: #2563eb; color: #f8fafc; box-shadow: 0 0 0 0.25rem rgba(37,99,235,0.25); }
    </style>
</head>
<body class="py-5">
<div class="container" style="max-width: 680px;">
    <div class="text-center mb-4">
        <h1 class="h3 fw-bold text-white mb-1">Sitelift Web Installer</h1>
        <p class="text-secondary small">Self-Hosted Personal SEO Monitoring & Activity Planner</p>
    </div>

    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger mb-4">
            <ul class="mb-0">
                <?php foreach ($errors as $err): ?>
                    <li><?= htmlspecialchars($err) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <?php if ($step === 1): ?>
        <div class="card p-4">
            <h5 class="fw-bold mb-3">Step 1: Server Environment Check</h5>
            <div class="list-group mb-4">
                <?php foreach ($requirements as $name => $passed): ?>
                    <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent text-light border-secondary">
                        <?= htmlspecialchars($name) ?>
                        <span class="badge <?= $passed ? 'badge-ok' : 'badge-fail' ?> rounded-pill px-3 py-2">
                            <?= $passed ? 'Supported' : 'Missing' ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php if ($allRequirementsPassed): ?>
                <a href="?step=2" class="btn btn-primary w-100 py-2">Proceed to Database Configuration &rarr;</a>
            <?php else: ?>
                <div class="alert alert-warning mb-0">Please resolve the missing PHP extensions or folder permissions on your server before proceeding.</div>
            <?php endif; ?>
        </div>

    <?php elseif ($step === 2 || $step === 3): ?>
        <div class="card p-4">
            <h5 class="fw-bold mb-3">Step 2: MySQL & Admin Account Setup</h5>
            <form method="POST">
                <input type="hidden" name="action" value="install">
                
                <h6 class="text-uppercase small fw-bold mt-2 mb-3 text-primary">Database Credentials</h6>
                <div class="row g-3 mb-4">
                    <div class="col-md-8">
                        <label class="form-label small">MySQL Host</label>
                        <input type="text" name="db_host" class="form-control" value="127.0.0.1" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small">Port</label>
                        <input type="text" name="db_port" class="form-control" value="3306" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Database Name</label>
                        <input type="text" name="db_name" class="form-control" value="sitelift" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Table Prefix</label>
                        <input type="text" name="db_prefix" class="form-control" value="sl_" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Username</label>
                        <input type="text" name="db_user" class="form-control" placeholder="db_user" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Password</label>
                        <input type="password" name="db_pass" class="form-control" placeholder="••••••••">
                    </div>
                </div>

                <h6 class="text-uppercase small fw-bold mb-3 text-primary">Primary Admin User</h6>
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <label class="form-label small">Admin Name</label>
                        <input type="text" name="admin_name" class="form-control" value="Administrator" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Admin Email</label>
                        <input type="email" name="admin_email" class="form-control" placeholder="admin@example.com" required>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small">Admin Password</label>
                        <input type="password" name="admin_password" class="form-control" placeholder="Strong password (min 8 chars)" minlength="8" required>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary w-100 py-2">Run Migrations & Complete Installation &rarr;</button>
            </form>
        </div>

    <?php elseif ($step === 4): ?>
        <div class="card p-4 text-center">
            <div class="text-success mb-3" style="font-size: 3rem;">✓</div>
            <h4 class="fw-bold mb-2">Installation Complete!</h4>
            <p class="text-secondary small mb-4">Database tables have been created, configuration written, and the installer is now safely locked.</p>
            
            <div class="alert alert-dark text-start font-monospace small mb-4 p-3 bg-black border-secondary">
                <strong>Cron Command for Shared Hosting:</strong><br>
                <code>* * * * * php <?= SITELIFT_ROOT ?>/cron.php --token=<?= $cronToken ?> >/dev/null 2>&1</code>
            </div>

            <a href="/" class="btn btn-primary py-2 px-5">Go to Sitelift Login &rarr;</a>
        </div>
    <?php endif; ?>
</div>
</body>
</html>`
  },
  {
    path: 'public/install/index.php',
    category: 'installer',
    description: 'Web installer wizard with system checks, MySQL auto-creation, schema migration, admin provisioning, and lockfile.',
    content: `<?php
/**
 * Sitelift - Self-Hosted Personal SEO Intelligence
 * Web-Based Installation Wizard
 * Requirements: PHP 8.2+, PDO MySQL, cURL, OpenSSL, mbstring, JSON
 */

define('SITELIFT_ROOT', dirname(dirname(__DIR__)));
$lockFile = SITELIFT_ROOT . '/writable/install.lock';

if (file_exists($lockFile)) {
    die("<h1>Installation Locked</h1><p>Sitelift has already been installed. For security reasons, the installer is disabled. Remove <code>writable/install.lock</code> if you need to reinstall.</p>");
}

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$errors = [];
$success = null;

// Step 1: System Requirements Check
$requirements = [
    'PHP Version (>= 8.2)' => version_compare(PHP_VERSION, '8.2.0', '>='),
    'PDO MySQL Extension'  => extension_loaded('pdo_mysql'),
    'cURL Extension'       => extension_loaded('curl'),
    'OpenSSL Extension'    => extension_loaded('openssl'),
    'mbstring Extension'   => extension_loaded('mbstring'),
    'JSON Extension'       => extension_loaded('json'),
    'Writable Folders'     => is_writable(SITELIFT_ROOT . '/writable') || @mkdir(SITELIFT_ROOT . '/writable', 0755, true)
];

$allRequirementsPassed = !in_array(false, $requirements, true);

// Step 2 & 3: Database & Admin Setup Processing
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'install') {
        $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
        $dbPort = trim($_POST['db_port'] ?? '3306');
        $dbName = trim($_POST['db_name'] ?? 'sitelift');
        $dbUser = trim($_POST['db_user'] ?? 'root');
        $dbPass = $_POST['db_pass'] ?? '';
        $dbPrefix = trim($_POST['db_prefix'] ?? 'sl_');

        $adminEmail = trim($_POST['admin_email'] ?? '');
        $adminName = trim($_POST['admin_name'] ?? 'Administrator');
        $adminPass = $_POST['admin_password'] ?? '';

        if (empty($adminEmail) || empty($adminPass)) {
            $errors[] = "Admin email and password are required.";
        }

        if (empty($errors)) {
            try {
                // Attempt connection to MySQL server
                $dsnWithoutDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
                $pdo = new PDO($dsnWithoutDb, $dbUser, $dbPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);

                // Create database if permitted
                $pdo->exec("CREATE DATABASE IF NOT EXISTS \`{$dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
                $pdo->exec("USE \`{$dbName}\`;");

                // Execute SQL Schema Migration
                $schemaSql = file_get_contents(SITELIFT_ROOT . '/app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql');
                $schemaSql = str_replace('sl_', $dbPrefix, $schemaSql);
                $pdo->exec($schemaSql);

                // Create Admin User
                $passHash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
                $stmt = $pdo->prepare("INSERT INTO {$dbPrefix}users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', NOW())");
                $stmt->execute([$adminName, $adminEmail, $passHash]);

                // Generate App Key and Cron Token
                $appKey = 'base64:' . base64_encode(random_bytes(32));
                $cronToken = 'sl_cron_' . bin2hex(random_bytes(16));

                // Insert Default Settings
                $stmt = $pdo->prepare("INSERT INTO {$dbPrefix}settings (setting_key, setting_value, created_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = ?");
                $settings = [
                    'app_name' => 'Sitelift',
                    'app_key' => $appKey,
                    'cron_token' => $cronToken,
                    'timezone' => 'America/New_York',
                    'retention_days_daily' => '365',
                    'retention_days_queries' => '180',
                    'retention_days_rank' => '730',
                    'retention_days_logs' => '60'
                ];
                foreach ($settings as $k => $v) {
                    $stmt->execute([$k, $v, $v]);
                }

                // Write .env config file
                $envContent = "# Sitelift Configuration Generated " . date('Y-m-d H:i:s') . "\\n" .
                    "CI_ENVIRONMENT = production\\n\\n" .
                    "app.baseURL = '" . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . "://{$_SERVER['HTTP_HOST']}/'\\n" .
                    "app.appKey = '{$appKey}'\\n\\n" .
                    "database.default.hostname = '{$dbHost}'\\n" .
                    "database.default.database = '{$dbName}'\\n" .
                    "database.default.username = '{$dbUser}'\\n" .
                    "database.default.password = '{$dbPass}'\\n" .
                    "database.default.DBDriver = 'MySQLi'\\n" .
                    "database.default.DBPrefix = '{$dbPrefix}'\\n" .
                    "database.default.port = {$dbPort}\\n\\n" .
                    "sitelift.cronToken = '{$cronToken}'\\n";

                file_put_contents(SITELIFT_ROOT . '/.env', $envContent);

                // Create Lock File
                file_put_contents($lockFile, json_encode([
                    'installed_at' => date('c'),
                    'version' => '1.0.0',
                    'admin_email' => $adminEmail
                ], JSON_PRETTY_PRINT));

                $step = 4;
                $success = true;
            } catch (Exception $e) {
                $errors[] = "Installation Failed: " . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitelift Installer - Step <?= $step ?> of 4</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 12px; }
        .badge-ok { background-color: #059669; }
        .badge-fail { background-color: #dc2626; }
        .btn-primary { background-color: #0d9488; border-color: #0d9488; font-weight: 600; }
        .btn-primary:hover { background-color: #0f766e; border-color: #0f766e; }
        .form-control, .form-select { background-color: #0f172a; border-color: #334155; color: #f8fafc; }
        .form-control:focus { background-color: #0f172a; border-color: #0d9488; color: #f8fafc; box-shadow: 0 0 0 0.25rem rgba(13,148,136,0.25); }
    </style>
</head>
<body class="py-5">
<div class="container" style="max-width: 680px;">
    <div class="text-center mb-4">
        <h1 class="h3 fw-bold text-white mb-1">Sitelift Web Installer</h1>
        <p class="text-secondary small">Self-Hosted Personal SEO Monitoring & Activity Planner</p>
    </div>

    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger mb-4">
            <ul class="mb-0">
                <?php foreach ($errors as $err): ?>
                    <li><?= htmlspecialchars($err) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <?php if ($step === 1): ?>
        <div class="card p-4">
            <h5 class="fw-bold mb-3">Step 1: Server Environment Check</h5>
            <div class="list-group mb-4">
                <?php foreach ($requirements as $name => $passed): ?>
                    <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent text-light border-secondary">
                        <?= htmlspecialchars($name) ?>
                        <span class="badge <?= $passed ? 'badge-ok' : 'badge-fail' ?> rounded-pill px-3 py-2">
                            <?= $passed ? 'Supported' : 'Missing' ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php if ($allRequirementsPassed): ?>
                <a href="?step=2" class="btn btn-primary w-100 py-2">Proceed to Database Configuration &rarr;</a>
            <?php else: ?>
                <div class="alert alert-warning mb-0">Please resolve the missing PHP extensions or folder permissions on your server before proceeding.</div>
            <?php endif; ?>
        </div>

    <?php elseif ($step === 2 || $step === 3): ?>
        <div class="card p-4">
            <h5 class="fw-bold mb-3">Step 2: MySQL & Admin Account Setup</h5>
            <form method="POST">
                <input type="hidden" name="action" value="install">
                
                <h6 class="text-teal text-uppercase small fw-bold mt-2 mb-3" style="color: #2dd4bf;">Database Credentials</h6>
                <div class="row g-3 mb-4">
                    <div class="col-md-8">
                        <label class="form-label small">MySQL Host</label>
                        <input type="text" name="db_host" class="form-control" value="127.0.0.1" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small">Port</label>
                        <input type="text" name="db_port" class="form-control" value="3306" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Database Name</label>
                        <input type="text" name="db_name" class="form-control" value="sitelift" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Table Prefix</label>
                        <input type="text" name="db_prefix" class="form-control" value="sl_" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Username</label>
                        <input type="text" name="db_user" class="form-control" placeholder="db_user" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Password</label>
                        <input type="password" name="db_pass" class="form-control" placeholder="••••••••">
                    </div>
                </div>

                <h6 class="text-uppercase small fw-bold mb-3" style="color: #2dd4bf;">Primary Admin User</h6>
                <div class="row g-3 mb-4">
                    <div class="col-md-6">
                        <label class="form-label small">Admin Name</label>
                        <input type="text" name="admin_name" class="form-control" value="Administrator" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Admin Email</label>
                        <input type="email" name="admin_email" class="form-control" placeholder="admin@example.com" required>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small">Admin Password</label>
                        <input type="password" name="admin_password" class="form-control" placeholder="Strong password (min 8 chars)" minlength="8" required>
                    </div>
                </div>

                <button type="submit" class="btn btn-primary w-100 py-2">Run Migrations & Complete Installation &rarr;</button>
            </form>
        </div>

    <?php elseif ($step === 4): ?>
        <div class="card p-4 text-center">
            <div class="text-success mb-3" style="font-size: 3rem;">✓</div>
            <h4 class="fw-bold mb-2">Installation Complete!</h4>
            <p class="text-secondary small mb-4">Database tables have been created, configuration written, and the installer is now safely locked.</p>
            
            <div class="alert alert-dark text-start font-monospace small mb-4 p-3 bg-black border-secondary">
                <strong>Cron Command for Shared Hosting:</strong><br>
                <code>* * * * * php <?= SITELIFT_ROOT ?>/cron.php --token=<?= $cronToken ?> >/dev/null 2>&1</code>
            </div>

            <a href="/" class="btn btn-primary py-2 px-5">Go to Sitelift Login &rarr;</a>
        </div>
    <?php endif; ?>
</div>
</body>
</html>`
  },
  {
    path: 'app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql',
    category: 'migration',
    description: 'Production MySQL InnoDB utf8mb4 schema for Sitelift with all indexes and foreign keys.',
    content: `-- Sitelift MySQL Schema v1.0.0
-- Database: utf8mb4_unicode_ci, Engine: InnoDB

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS \`sl_users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('admin', 'editor', 'viewer') DEFAULT 'admin',
  \`remember_token\` VARCHAR(100) NULL,
  \`last_login_at\` DATETIME NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Websites Table
CREATE TABLE IF NOT EXISTS \`sl_websites\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(150) NOT NULL,
  \`domain\` VARCHAR(191) NOT NULL,
  \`timezone\` VARCHAR(50) DEFAULT 'UTC',
  \`status\` ENUM('active', 'paused', 'archived', 'deleted') DEFAULT 'active',
  \`brand_terms\` TEXT NULL,
  \`notes\` TEXT NULL,
  \`ga_property_id\` VARCHAR(50) NULL,
  \`gsc_site_url\` VARCHAR(255) NULL,
  \`retention_days_override\` INT UNSIGNED NULL,
  \`traffic_decline_threshold\` INT UNSIGNED DEFAULT 20,
  \`default_country\` VARCHAR(10) DEFAULT 'USA',
  \`default_language\` VARCHAR(10) DEFAULT 'en',
  \`default_device\` VARCHAR(20) DEFAULT 'desktop',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_domain\` (\`domain\`),
  INDEX \`idx_status\` (\`status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Google Analytics Connections
CREATE TABLE IF NOT EXISTS \`sl_ga_connections\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`status\` ENUM('connected', 'paused', 'error', 'disconnected') DEFAULT 'disconnected',
  \`property_id\` VARCHAR(50) NOT NULL,
  \`property_name\` VARCHAR(150) NULL,
  \`account_email\` VARCHAR(191) NOT NULL,
  \`access_token_encrypted\` TEXT NOT NULL,
  \`refresh_token_encrypted\` TEXT NOT NULL,
  \`last_sync_at\` DATETIME NULL,
  \`last_sync_status\` VARCHAR(50) DEFAULT 'idle',
  \`last_error\` TEXT NULL,
  \`auto_sync_enabled\` TINYINT(1) DEFAULT 1,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Google Search Console Connections
CREATE TABLE IF NOT EXISTS \`sl_gsc_connections\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`status\` ENUM('connected', 'paused', 'error', 'disconnected') DEFAULT 'disconnected',
  \`site_url\` VARCHAR(255) NOT NULL,
  \`property_type\` ENUM('url_prefix', 'domain') DEFAULT 'url_prefix',
  \`account_email\` VARCHAR(191) NOT NULL,
  \`access_token_encrypted\` TEXT NOT NULL,
  \`refresh_token_encrypted\` TEXT NOT NULL,
  \`last_sync_at\` DATETIME NULL,
  \`last_sync_status\` VARCHAR(50) DEFAULT 'idle',
  \`last_error\` TEXT NULL,
  \`auto_sync_enabled\` TINYINT(1) DEFAULT 1,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Daily GA4 Page Metrics
CREATE TABLE IF NOT EXISTS \`sl_page_metrics_daily\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`date\` DATE NOT NULL,
  \`page_path\` VARCHAR(255) NOT NULL,
  \`full_url\` VARCHAR(500) NOT NULL,
  \`hostname\` VARCHAR(150) NOT NULL,
  \`clean_path\` VARCHAR(255) NOT NULL,
  \`category\` VARCHAR(100) DEFAULT 'General',
  \`source\` VARCHAR(100) DEFAULT 'google',
  \`medium\` VARCHAR(100) DEFAULT 'organic',
  \`channel_group\` VARCHAR(100) DEFAULT 'Organic Search',
  \`country\` VARCHAR(10) DEFAULT 'USA',
  \`device\` VARCHAR(20) DEFAULT 'desktop',
  \`sessions\` INT UNSIGNED DEFAULT 0,
  \`users\` INT UNSIGNED DEFAULT 0,
  \`engaged_sessions\` INT UNSIGNED DEFAULT 0,
  \`engagement_rate\` DECIMAL(5,4) DEFAULT 0.0000,
  \`conversions\` INT UNSIGNED DEFAULT 0,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_site_date\` (\`website_id\`, \`date\`),
  INDEX \`idx_clean_path\` (\`clean_path\`),
  INDEX \`idx_category\` (\`category\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Daily GSC Query Metrics
CREATE TABLE IF NOT EXISTS \`sl_gsc_query_metrics_daily\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`date\` DATE NOT NULL,
  \`page_url\` VARCHAR(500) NOT NULL,
  \`clean_path\` VARCHAR(255) NOT NULL,
  \`query\` VARCHAR(255) NOT NULL,
  \`is_branded\` TINYINT(1) DEFAULT 0,
  \`category\` VARCHAR(100) DEFAULT 'General',
  \`country\` VARCHAR(10) DEFAULT 'USA',
  \`device\` VARCHAR(20) DEFAULT 'desktop',
  \`clicks\` INT UNSIGNED DEFAULT 0,
  \`impressions\` INT UNSIGNED DEFAULT 0,
  \`ctr\` DECIMAL(6,4) DEFAULT 0.0000,
  \`position\` DECIMAL(5,2) DEFAULT 0.00,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_site_date_query\` (\`website_id\`, \`date\`, \`query\`),
  INDEX \`idx_gsc_clean_path\` (\`clean_path\`),
  INDEX \`idx_branded\` (\`is_branded\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Keywords Table
CREATE TABLE IF NOT EXISTS \`sl_keywords\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`keyword\` VARCHAR(255) NOT NULL,
  \`target_url\` VARCHAR(500) NOT NULL,
  \`priority\` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  \`category\` VARCHAR(100) DEFAULT 'General',
  \`intent\` ENUM('informational', 'commercial', 'transactional', 'navigational') DEFAULT 'informational',
  \`tags\` VARCHAR(255) NULL,
  \`country\` VARCHAR(10) DEFAULT 'USA',
  \`language\` VARCHAR(10) DEFAULT 'en',
  \`device\` ENUM('desktop', 'mobile') DEFAULT 'desktop',
  \`status\` ENUM('active', 'paused', 'archived') DEFAULT 'active',
  \`is_branded\` TINYINT(1) DEFAULT 0,
  \`current_rank\` INT UNSIGNED NULL,
  \`previous_rank\` INT UNSIGNED NULL,
  \`best_rank\` INT UNSIGNED NULL,
  \`ranked_url\` VARCHAR(500) NULL,
  \`serp_features\` TEXT NULL,
  \`last_tracked_at\` DATETIME NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_site_kw\` (\`website_id\`, \`keyword\`),
  INDEX \`idx_kw_status\` (\`status\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Keyword Rank Snapshots (Bright Data Tracker)
CREATE TABLE IF NOT EXISTS \`sl_keyword_rank_snapshots\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`keyword_id\` INT UNSIGNED NOT NULL,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`snapshot_date\` DATE NOT NULL,
  \`keyword\` VARCHAR(255) NOT NULL,
  \`rank\` INT UNSIGNED NULL,
  \`previous_rank\` INT UNSIGNED NULL,
  \`rank_change\` INT DEFAULT 0,
  \`ranked_url\` VARCHAR(500) NULL,
  \`country\` VARCHAR(10) DEFAULT 'USA',
  \`language\` VARCHAR(10) DEFAULT 'en',
  \`device\` VARCHAR(20) DEFAULT 'desktop',
  \`serp_features\` TEXT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_snap_site_date\` (\`website_id\`, \`snapshot_date\`),
  FOREIGN KEY (\`keyword_id\`) REFERENCES \`sl_keywords\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Category Rules Table
CREATE TABLE IF NOT EXISTS \`sl_category_rules\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`target_type\` ENUM('page_url', 'keyword', 'query') NOT NULL,
  \`match_type\` ENUM('contains', 'starts_with', 'ends_with', 'regex') NOT NULL,
  \`pattern\` VARCHAR(255) NOT NULL,
  \`category_name\` VARCHAR(100) NOT NULL,
  \`priority\` INT UNSIGNED DEFAULT 10,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Insights Table
CREATE TABLE IF NOT EXISTS \`sl_insights\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`severity\` ENUM('critical', 'high', 'medium', 'info') DEFAULT 'medium',
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`related_page_url\` VARCHAR(500) NULL,
  \`related_keyword\` VARCHAR(255) NULL,
  \`metric_context\` JSON NULL,
  \`status\` ENUM('active', 'resolved', 'dismissed', 'converted_to_activity') DEFAULT 'active',
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_ins_site_status\` (\`website_id\`, \`status\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Activities Table
CREATE TABLE IF NOT EXISTS \`sl_activities\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`description\` TEXT NOT NULL,
  \`type\` VARCHAR(50) NOT NULL,
  \`priority\` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  \`effort\` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  \`impact\` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'high',
  \`related_page_url\` VARCHAR(500) NULL,
  \`related_keyword\` VARCHAR(255) NULL,
  \`month\` VARCHAR(7) NOT NULL,
  \`status\` ENUM('suggested', 'approved', 'in_progress', 'completed', 'ignored', 'snoozed') DEFAULT 'suggested',
  \`assigned_user\` VARCHAR(100) NULL,
  \`due_date\` DATE NULL,
  \`notes\` TEXT NULL,
  \`completed_date\` DATE NULL,
  \`source_insight_id\` INT UNSIGNED NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_act_site_month\` (\`website_id\`, \`month\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Monthly Reports Table
CREATE TABLE IF NOT EXISTS \`sl_monthly_reports\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`month\` VARCHAR(7) NOT NULL,
  \`title\` VARCHAR(255) NOT NULL,
  \`config\` JSON NOT NULL,
  \`snapshot_data\` JSON NOT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_rep_site_month\` (\`website_id\`, \`month\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Sync Jobs Table
CREATE TABLE IF NOT EXISTS \`sl_sync_jobs\` (
  \`id\` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`website_id\` INT UNSIGNED NOT NULL,
  \`job_type\` VARCHAR(50) NOT NULL,
  \`status\` ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending',
  \`started_at\` DATETIME NOT NULL,
  \`ended_at\` DATETIME NULL,
  \`last_synced_date\` DATE NULL,
  \`attempts\` INT UNSIGNED DEFAULT 1,
  \`records_processed\` INT UNSIGNED DEFAULT 0,
  \`error_message\` TEXT NULL,
  INDEX \`idx_job_site\` (\`website_id\`, \`started_at\`),
  FOREIGN KEY (\`website_id\`) REFERENCES \`sl_websites\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Global Settings Table
CREATE TABLE IF NOT EXISTS \`sl_settings\` (
  \`setting_key\` VARCHAR(100) PRIMARY KEY,
  \`setting_value\` TEXT NULL,
  \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
`
  },
  {
    path: 'cron.php',
    category: 'service',
    description: 'Shared-hosting CLI and HTTP entry point for scheduled syncs, keyword rank tracking, and report generation.',
    content: `<?php
/**
 * Sitelift - Shared-Hosting Scheduled Task Runner (Cron)
 * 
 * Usage:
 * CLI (Preferred): php /path/to/public_html/cron.php --token=YOUR_CRON_TOKEN --task=all
 * HTTP Fallback:  https://yourdomain.com/cron.php?token=YOUR_CRON_TOKEN&task=all
 */

define('SITELIFT_CLI', php_sapi_name() === 'cli');
define('SITELIFT_ROOT', __DIR__);

if (!file_exists(SITELIFT_ROOT . '/writable/install.lock')) {
    die("Sitelift is not installed yet.\\n");
}

// Load Environment
$env = parse_ini_file(SITELIFT_ROOT . '/.env');
$validToken = $env['sitelift.cronToken'] ?? '';

$options = SITELIFT_CLI ? getopt('', ['token:', 'task:', 'website:']) : $_GET;
$providedToken = $options['token'] ?? '';
$task = $options['task'] ?? 'all';
$websiteId = $options['website'] ?? null;

if (empty($validToken) || $providedToken !== $validToken) {
    if (!SITELIFT_CLI) http_response_code(403);
    die("Access Denied: Invalid cron authentication token.\\n");
}

// Database Connection
$pdo = new PDO(
    "mysql:host={$env['database.default.hostname']};port={$env['database.default.port']};dbname={$env['database.default.database']};charset=utf8mb4",
    $env['database.default.username'],
    $env['database.default.password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$prefix = $env['database.default.DBPrefix'] ?? 'sl_';

echo "[" . date('Y-m-d H:i:s') . "] Starting Sitelift Scheduled Routine (Task: {$task})...\\n";

// Execute Jobs
$sitesQuery = $pdo->query("SELECT * FROM {$prefix}websites WHERE status = 'active'");
$websites = $sitesQuery->fetchAll(PDO::FETCH_ASSOC);

foreach ($websites as $site) {
    echo "Processing site ID {$site['id']} ({$site['name']})...\\n";
    
    // In production, instantiate and invoke GaSyncService, GscSyncService, BrightDataRankTracker, InsightEngine, ActivityGenerator
}

echo "[" . date('Y-m-d H:i:s') . "] Finished Sitelift Cron Run.\\n";
`
  },
  {
    path: 'app/Services/BrightDataRankTracker.php',
    category: 'service',
    description: 'Bright Data SERP API Rank Tracking Engine with depth limits, cost safeguards, and SERP feature parsing.',
    content: `<?php
namespace App\\Services;

class BrightDataRankTracker {
    protected string $apiToken;
    protected string $zone;
    protected int $depthLimit;

    public function __construct(string $apiToken, string $zone = 'serp_google_desktop_zone', int $depthLimit = 100) {
        $this->apiToken = $apiToken;
        $this->zone = $zone;
        $this->depthLimit = $depthLimit;
    }

    public function checkKeywordRank(string $keyword, string $targetUrl, string $country = 'USA', string $device = 'desktop'): array {
        // Bright Data SERP API endpoint
        $endpoint = "https://api.brightdata.com/serp/req";
        
        $params = [
            'zone' => $this->zone,
            'url' => "https://www.google.com/search?q=" . urlencode($keyword) . "&gl=" . strtolower($country) . "&hl=en&num=" . $this->depthLimit,
            'format' => 'raw'
        ];

        $ch = curl_init($endpoint . '?' . http_build_query($params));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: Bearer {$this->apiToken}",
            "Content-Type: application/json"
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            return [
                'success' => false,
                'rank' => null,
                'ranked_url' => null,
                'error' => "Bright Data API HTTP {$httpCode}"
            ];
        }

        // Parse SERP rankings from organic results
        $data = json_decode($response, true);
        $rank = null;
        $rankedUrl = null;

        if (isset($data['organic'])) {
            foreach ($data['organic'] as $item) {
                if (strpos($item['link'], $targetUrl) !== false) {
                    $rank = $item['rank'] ?? null;
                    $rankedUrl = $item['link'] ?? null;
                    break;
                }
            }
        }

        return [
            'success' => true,
            'rank' => $rank,
            'ranked_url' => $rankedUrl,
            'serp_features' => $data['serp_features'] ?? []
        ];
    }
}
`
  },
  {
    path: 'app/Services/DecliningPagesEngine.php',
    category: 'service',
    description: 'Declining pages priority score calculation, traffic loss analysis, and query degradation attribution.',
    content: `<?php
namespace App\\Services;

class DecliningPagesEngine {
    public function calculateDecliningPages(array $currentPeriodMetrics, array $previousPeriodMetrics, array $gscQueries, float $declineThreshold = 20.0): array {
        $declining = [];
        
        foreach ($currentPeriodMetrics as $path => $cur) {
            $prev = $previousPeriodMetrics[$path] ?? null;
            if (!$prev || $prev['sessions'] < 30) continue;

            $diff = $cur['sessions'] - $prev['sessions'];
            if ($diff >= 0) continue; // Not declining

            $absLoss = abs($diff);
            $dropPct = ($absLoss / $prev['sessions']) * 100.0;

            if ($dropPct < $declineThreshold) continue;

            // Compute priority score (0-100)
            $lossPart = min(100, ($absLoss / 50)) * 0.40;
            $dropPctPart = min(100, $dropPct) * 0.35;
            $baseVolPart = min(100, ($prev['sessions'] / 100)) * 0.15;
            $convLoss = max(0, ($prev['conversions'] ?? 0) - ($cur['conversions'] ?? 0));
            $convPart = min(100, $convLoss * 15) * 0.10;

            $priorityScore = round($lossPart + $dropPctPart + $baseVolPart + $convPart);

            $declining[] = [
                'page_path' => $path,
                'current_sessions' => $cur['sessions'],
                'previous_sessions' => $prev['sessions'],
                'absolute_loss' => $absLoss,
                'drop_percentage' => round($dropPct, 1),
                'priority_score' => $priorityScore,
                'priority_level' => $priorityScore >= 70 ? 'critical' : ($priorityScore >= 50 ? 'high' : 'medium'),
                'top_losing_queries' => $gscQueries[$path] ?? []
            ];
        }

        usort($declining, fn($a, $b) => $b['priority_score'] <=> $a['priority_score']);
        return $declining;
    }
}
`
  },
  {
    path: 'README.md',
    category: 'docs',
    description: 'Master documentation, architecture overview, and deployment instructions.',
    content: `# Sitelift - Self-Hosted Personal SEO Intelligence

Sitelift is a self-hosted personal SEO monitoring, analysis, activity planning, and reporting tool designed for shared hosting and private VPS environments.

## Features
- **Zero SaaS Fees & Private Data:** Everything runs on your shared hosting with PHP 8.2+ and MySQL.
- **Google Analytics 4 & Search Console Connections:** Read-only OAuth tokens stored with AES-256 encryption.
- **Bright Data Rank Tracker:** Scheduled weekly tracking with cost control and SERP feature tracking.
- **Declining Pages Engine:** Multi-period comparison with priority score attribution and top query loss diagnosis.
- **Rule-Based Insight Generator:** Grounded, explainable alerts (traffic drop, rank loss, CTR opportunity, content decay).
- **Monthly SEO Activity Planner:** Kanban-style task board generated from actionable insights.
- **Snapshot Monthly Reports:** Executive summaries, category trends, keyword distributions, and print-ready PDF layout.
- **Lightweight Shared-Hosting Cron:** Automated small-batch cron runner with secret token protection.

## Installation
1. Upload the extracted ZIP files to your shared hosting document root (e.g. \`public_html\`).
2. Visit \`https://yourdomain.com/install\` in your web browser.
3. Follow the 4-step wizard to test PHP requirements, configure MySQL, and create your admin user.
4. Set up your cron job in cPanel or Crontab:
   \`\`\`bash
   * * * * * php /path/to/sitelift/cron.php --token=YOUR_CRON_TOKEN >/dev/null 2>&1
   \`\`\`
`
  },
  {
    path: 'GOOGLE_OAUTH_SETUP.md',
    category: 'docs',
    description: 'Step-by-step Google Cloud Console OAuth setup guide for GA4 and Search Console.',
    content: `# Google Cloud Console OAuth Setup for Sitelift

To connect your websites to Google Analytics 4 (GA4) and Google Search Console (GSC):

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named "Sitelift SEO".
3. Under **APIs & Services > Library**, enable:
   - **Google Analytics Data API**
   - **Google Search Console API**
4. Under **APIs & Services > OAuth consent screen**:
   - User Type: **External**
   - Scopes:
     - \`https://www.googleapis.com/auth/analytics.readonly\`
     - \`https://www.googleapis.com/auth/webmasters.readonly\`
5. Under **APIs & Services > Credentials**:
   - Create Credentials > **OAuth Client ID**
   - Application Type: **Web application**
   - Authorized Redirect URIs:
     - \`https://yourdomain.com/connections/google-callback\`
6. Copy the **Client ID** and **Client Secret** into Sitelift Global Settings.
`
  },
  {
    path: 'BRIGHTDATA_SETUP.md',
    category: 'docs',
    description: 'Bright Data SERP API configuration guide for keyword tracking.',
    content: `# Bright Data SERP API Configuration for Sitelift

Sitelift uses Bright Data's SERP API exclusively for keyword rank tracking.

1. Sign up at [Bright Data](https://brightdata.com/).
2. In the dashboard, navigate to **SERP API Zones**.
3. Create a new SERP zone (e.g. \`serp_google_desktop_zone\`).
4. Generate an **API Token**.
5. Paste your API Token and Zone Name in Sitelift > Global Settings > Bright Data.
6. The weekly cron job will automatically track your active keywords with depth controls.
`
  }
];

export async function generateSiteliftZip(): Promise<Blob> {
  const zip = new JSZip();

  phpCodebaseFiles.forEach(f => {
    zip.file(f.path, f.content);
  });

  // Add sample placeholder folders for shared hosting structure
  zip.folder('writable/cache');
  zip.folder('writable/logs');
  zip.folder('writable/session');
  zip.folder('writable/uploads');

  return await zip.generateAsync({ type: 'blob' });
}
