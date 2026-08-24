<?php
/**
 * Sitelift - Self-Hosted Personal SEO Intelligence
 * Web-Based Installation Wizard (v1.2.0)
 * Requirements: PHP 8.2+, PDO MySQL, cURL, OpenSSL, mbstring, JSON
 */

// Define paths
define('SITELIFT_PUBLIC', __DIR__);
define('SITELIFT_ROOT', dirname(dirname(__DIR__)));
$lockFile = SITELIFT_ROOT . '/writable/install.lock';

// If already installed, prevent rerunning for security
if (file_exists($lockFile)) {
    header("Content-Type: text/html; charset=UTF-8");
    die("<!DOCTYPE html>
    <html lang='en'>
    <head>
        <meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <title>Sitelift - Already Installed</title>
        <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet'>
        <style>
            body { background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 540px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        </style>
    </head>
    <body>
        <div class='card p-4 text-center'>
            <div class='mb-3 text-warning' style='font-size: 2.5rem;'>🔒</div>
            <h4 class='fw-bold text-white mb-2'>Sitelift is Already Installed</h4>
            <p class='text-secondary small mb-4'>For security reasons, the web installer has been locked. To re-install, delete <code>writable/install.lock</code> via cPanel File Manager or FTP.</p>
            <a href='/' class='btn btn-primary w-100 py-2'>Launch Sitelift Dashboard &rarr;</a>
        </div>
    </body>
    </html>");
}

// Auto-create writable folders if missing
$writableDirs = [
    SITELIFT_ROOT . '/writable',
    SITELIFT_ROOT . '/writable/cache',
    SITELIFT_ROOT . '/writable/logs',
    SITELIFT_ROOT . '/writable/session',
    SITELIFT_ROOT . '/writable/snapshots',
];
foreach ($writableDirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

$step = isset($_GET['step']) ? (int)$_GET['step'] : 1;
$errors = [];
$successMessage = '';
$cronToken = '';

// Step 1: System Requirements Check
$phpOk = version_compare(PHP_VERSION, '8.2.0', '>=');
$requirements = [
    'PHP Version (>= 8.2)'     => ['pass' => $phpOk, 'val' => PHP_VERSION, 'req' => '8.2.0+'],
    'PDO MySQL Extension'      => ['pass' => extension_loaded('pdo_mysql'), 'val' => extension_loaded('pdo_mysql') ? 'Enabled' : 'Missing', 'req' => 'Required'],
    'cURL Extension'           => ['pass' => extension_loaded('curl'), 'val' => extension_loaded('curl') ? 'Enabled' : 'Missing', 'req' => 'Required'],
    'OpenSSL Extension'        => ['pass' => extension_loaded('openssl'), 'val' => extension_loaded('openssl') ? 'Enabled' : 'Missing', 'req' => 'Required'],
    'mbstring Extension'       => ['pass' => extension_loaded('mbstring'), 'val' => extension_loaded('mbstring') ? 'Enabled' : 'Missing', 'req' => 'Required'],
    'JSON Extension'           => ['pass' => extension_loaded('json'), 'val' => extension_loaded('json') ? 'Enabled' : 'Missing', 'req' => 'Required'],
    'Writable Directory'       => ['pass' => is_writable(SITELIFT_ROOT . '/writable'), 'val' => is_writable(SITELIFT_ROOT . '/writable') ? 'Writable' : 'Not Writable', 'req' => 'writable/']
];

$allRequirementsPassed = true;
foreach ($requirements as $r) {
    if (!$r['pass']) {
        $allRequirementsPassed = false;
        break;
    }
}

// Step 2: Handle Database & Admin Installation Form
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'install') {
    $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
    $dbPort = trim($_POST['db_port'] ?? '3306');
    $dbName = trim($_POST['db_name'] ?? '');
    $dbUser = trim($_POST['db_user'] ?? '');
    $dbPass = $_POST['db_pass'] ?? '';
    $dbPrefix = trim($_POST['db_prefix'] ?? 'sl_');

    $adminName = trim($_POST['admin_name'] ?? 'Administrator');
    $adminEmail = trim($_POST['admin_email'] ?? '');
    $adminPass = $_POST['admin_password'] ?? '';

    // Basic validation
    if (empty($dbName)) $errors[] = "Database name is required.";
    if (empty($dbUser)) $errors[] = "Database username is required.";
    if (empty($adminEmail) || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) $errors[] = "Valid admin email is required.";
    if (strlen($adminPass) < 8) $errors[] = "Admin password must be at least 8 characters.";

    if (empty($errors)) {
        try {
            // 1. Test MySQL Connection
            $dsnWithoutDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
            $pdo = new PDO($dsnWithoutDb, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            // 2. Create Database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            $pdo->exec("USE `{$dbName}`;");

            // 3. Locate and execute SQL migration file
            $migrationFiles = [
                SITELIFT_ROOT . '/app/Database/Migrations/2026_01_01_000001_create_sitelift_tables.sql',
                SITELIFT_ROOT . '/database.sql'
            ];
            $schemaSql = '';
            foreach ($migrationFiles as $mf) {
                if (file_exists($mf)) {
                    $schemaSql = file_get_contents($mf);
                    break;
                }
            }

            if (empty($schemaSql)) {
                throw new Exception("Migration schema file not found in app/Database/Migrations/.");
            }

            if ($dbPrefix !== 'sl_') {
                $schemaSql = str_replace('`sl_', '`' . $dbPrefix, $schemaSql);
                $schemaSql = str_replace('sl_', $dbPrefix, $schemaSql);
            }

            // Execute SQL commands in batches
            $pdo->exec($schemaSql);

            // 4. Create Initial Admin User
            $passHash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
            $stmt = $pdo->prepare("INSERT INTO `{$dbPrefix}users` (`name`, `email`, `password_hash`, `role`, `created_at`) VALUES (?, ?, ?, 'admin', NOW()) ON DUPLICATE KEY UPDATE `password_hash` = ?, `name` = ?");
            $stmt->execute([$adminName, $adminEmail, $passHash, $passHash, $adminName]);

            // 5. Generate Application Key and Cron Secret
            $appKey = 'base64:' . base64_encode(random_bytes(32));
            $cronToken = 'sl_cron_' . bin2hex(random_bytes(16));

            // 6. Insert Default Global Settings
            $stmt = $pdo->prepare("INSERT INTO `{$dbPrefix}settings` (`setting_key`, `setting_value`, `created_at`) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `setting_value` = ?");
            $defaultSettings = [
                'app_name' => 'Sitelift',
                'app_version' => '1.2.0',
                'app_key' => $appKey,
                'cron_token' => $cronToken,
                'timezone' => 'America/New_York',
                'retention_days_daily' => '365',
                'retention_days_queries' => '180',
                'retention_days_rank' => '730',
                'retention_days_logs' => '60'
            ];
            foreach ($defaultSettings as $k => $v) {
                $stmt->execute([$k, $v, $v]);
            }

            // 7. Write production .env file
            $isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
            $baseUrl = ($isHttps ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/';

            $envContent = "# Sitelift Configuration - Generated " . date('Y-m-d H:i:s') . "\n" .
                "CI_ENVIRONMENT = production\n\n" .
                "app.baseURL = '{$baseUrl}'\n" .
                "app.appKey = '{$appKey}'\n" .
                "app.version = '1.2.0'\n\n" .
                "database.default.hostname = '{$dbHost}'\n" .
                "database.default.database = '{$dbName}'\n" .
                "database.default.username = '{$dbUser}'\n" .
                "database.default.password = '{$dbPass}'\n" .
                "database.default.DBDriver = 'MySQLi'\n" .
                "database.default.DBPrefix = '{$dbPrefix}'\n" .
                "database.default.port = {$dbPort}\n\n" .
                "sitelift.cronToken = '{$cronToken}'\n";

            file_put_contents(SITELIFT_ROOT . '/.env', $envContent);

            // 8. Write install.lock
            file_put_contents($lockFile, json_encode([
                'installed_at' => date('c'),
                'version' => '1.2.0',
                'admin_email' => $adminEmail,
                'php_version' => PHP_VERSION,
                'db_name' => $dbName
            ], JSON_PRETTY_PRINT));

            $step = 3;
            $successMessage = "Sitelift has been installed successfully!";
        } catch (Exception $e) {
            $errors[] = "Database Configuration Error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitelift - Web Installation Wizard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background: #0b1120; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; padding: 40px 16px; }
        .installer-box { max-width: 640px; margin: 0 auto; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
        .badge-pass { background: #059669; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 9999px; }
        .badge-fail { background: #dc2626; color: #fff; font-size: 0.75rem; padding: 5px 10px; border-radius: 9999px; }
        .form-control { background: #0f172a; border-color: #334155; color: #f8fafc; font-size: 0.9rem; }
        .form-control:focus { background: #0f172a; border-color: #0284c7; color: #f8fafc; box-shadow: 0 0 0 0.25rem rgba(2,132,199,0.25); }
        .btn-primary { background: #0284c7; border-color: #0284c7; font-weight: 600; }
        .btn-primary:hover { background: #0369a1; border-color: #0369a1; }
        .step-indicator { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 24px; }
        .step-pill { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: bold; background: #334155; color: #94a3b8; }
        .step-pill.active { background: #0284c7; color: #fff; }
        .step-pill.completed { background: #059669; color: #fff; }
    </style>
</head>
<body>
<div class="installer-box">
    <!-- Brand Header -->
    <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center p-2 rounded-3 bg-primary bg-opacity-25 mb-2 text-primary">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <h1 class="h4 fw-bold text-white mb-1">Sitelift Web Installer</h1>
        <p class="text-secondary small">Self-Hosted Personal SEO Intelligence Suite</p>
    </div>

    <!-- Stepper Indicator -->
    <div class="step-indicator">
        <div class="step-pill <?= $step === 1 ? 'active' : ($step > 1 ? 'completed' : '') ?>">1</div>
        <div style="width: 30px; height: 2px; background: #334155;"></div>
        <div class="step-pill <?= $step === 2 ? 'active' : ($step > 2 ? 'completed' : '') ?>">2</div>
        <div style="width: 30px; height: 2px; background: #334155;"></div>
        <div class="step-pill <?= $step === 3 ? 'active' : '' ?>">3</div>
    </div>

    <!-- Errors Notification -->
    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger mb-4 border-0 shadow-sm">
            <h6 class="fw-bold mb-1">Installation Warning</h6>
            <ul class="mb-0 ps-3 small">
                <?php foreach ($errors as $err): ?>
                    <li><?= htmlspecialchars($err) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <!-- STEP 1: Server Requirements Check -->
    <?php if ($step === 1): ?>
        <div class="card p-4">
            <h5 class="fw-bold text-white mb-3">Step 1: Environment & Requirements</h5>
            <p class="text-secondary small mb-3">Checking your server compatibility for Sitelift.</p>

            <div class="list-group list-group-flush mb-4 rounded-3 border border-secondary border-opacity-25 overflow-hidden">
                <?php foreach ($requirements as $title => $r): ?>
                    <div class="list-group-item d-flex justify-content-between align-items-center bg-transparent text-light border-secondary border-opacity-25 py-2 px-3">
                        <div>
                            <span class="fw-medium small"><?= htmlspecialchars($title) ?></span>
                            <span class="text-secondary text-opacity-70 d-block" style="font-size: 0.75rem;"><?= htmlspecialchars($r['val']) ?> (Required: <?= htmlspecialchars($r['req']) ?>)</span>
                        </div>
                        <span class="badge <?= $r['pass'] ? 'badge-pass' : 'badge-fail' ?>">
                            <?= $r['pass'] ? '✓ Passed' : '✕ Missing' ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ($allRequirementsPassed): ?>
                <a href="?step=2" class="btn btn-primary w-100 py-2">
                    Next: Configure Database & Admin &rarr;
                </a>
            <?php else: ?>
                <div class="alert alert-warning small mb-0">
                    Your hosting environment is missing one or more required PHP extensions. Please enable them in cPanel (Select PHP Version / PHP Extensions) or contact your web host.
                </div>
            <?php endif; ?>
        </div>

    <!-- STEP 2: Database & Admin Configuration -->
    <?php elseif ($step === 2): ?>
        <div class="card p-4">
            <h5 class="fw-bold text-white mb-1">Step 2: Database & Admin Account</h5>
            <p class="text-secondary small mb-3">Enter your MySQL database details and choose your admin login.</p>

            <form method="POST" action="?step=2">
                <input type="hidden" name="action" value="install">

                <h6 class="text-info text-uppercase fw-bold mt-2 mb-2" style="font-size: 0.75rem; letter-spacing: 0.05em;">MySQL Database Credentials</h6>
                <div class="row g-2 mb-3">
                    <div class="col-md-8">
                        <label class="form-label small text-secondary mb-1">Database Host</label>
                        <input type="text" name="db_host" class="form-control" value="127.0.0.1" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-secondary mb-1">Port</label>
                        <input type="text" name="db_port" class="form-control" value="3306" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-secondary mb-1">Database Name</label>
                        <input type="text" name="db_name" class="form-control" placeholder="e.g. your_sitelift" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-secondary mb-1">Table Prefix</label>
                        <input type="text" name="db_prefix" class="form-control" value="sl_" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-secondary mb-1">Database Username</label>
                        <input type="text" name="db_user" class="form-control" placeholder="e.g. db_user" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-secondary mb-1">Database Password</label>
                        <input type="password" name="db_pass" class="form-control" placeholder="••••••••">
                    </div>
                </div>

                <h6 class="text-info text-uppercase fw-bold mt-3 mb-2" style="font-size: 0.75rem; letter-spacing: 0.05em;">Primary Administrator Account</h6>
                <div class="row g-2 mb-4">
                    <div class="col-md-6">
                        <label class="form-label small text-secondary mb-1">Admin Full Name</label>
                        <input type="text" name="admin_name" class="form-control" value="Administrator" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-secondary mb-1">Admin Email Address</label>
                        <input type="email" name="admin_email" class="form-control" placeholder="admin@yourdomain.com" required>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small text-secondary mb-1">Admin Password (Min. 8 chars)</label>
                        <input type="password" name="admin_password" class="form-control" placeholder="Choose a strong password" minlength="8" required>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <a href="?step=1" class="btn btn-outline-secondary py-2 px-3">&larr; Back</a>
                    <button type="submit" class="btn btn-primary flex-grow-1 py-2">
                        Run Installer & Build Tables &rarr;
                    </button>
                </div>
            </form>
        </div>

    <!-- STEP 3: Complete & Crontab Setup -->
    <?php elseif ($step === 3): ?>
        <div class="card p-4 text-center">
            <div class="text-success mb-2" style="font-size: 2.5rem;">✓</div>
            <h4 class="fw-bold text-white mb-1">Installation Complete!</h4>
            <p class="text-secondary small mb-3">All 14 MySQL tables created, config files written, and installer safely locked.</p>

            <div class="alert alert-dark text-start font-monospace small mb-4 p-3 bg-black border border-secondary border-opacity-50">
                <div class="text-info fw-bold mb-1" style="font-size: 0.75rem;">SHARED HOSTING CRONTAB (CPANEL CRON JOB):</div>
                <div class="user-select-all text-light" style="word-break: break-all; font-size: 0.8rem;">
                    * * * * * php <?= SITELIFT_ROOT ?>/cron.php --token=<?= htmlspecialchars($cronToken) ?> &gt;/dev/null 2&gt;&amp;1
                </div>
            </div>

            <a href="/" class="btn btn-primary w-100 py-2">
                Launch Sitelift &rarr;
            </a>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
