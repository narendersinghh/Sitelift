<?php
/**
 * Sitelift - Self-Hosted Personal SEO Intelligence
 * Web-Based Installation Wizard (v1.2.0)
 * Requirements: PHP 8.2+, PDO MySQL, cURL, OpenSSL, mbstring, JSON
 */

define('SITELIFT_PUBLIC', __DIR__);
define('SITELIFT_ROOT', dirname(dirname(__DIR__)));
$lockFile = SITELIFT_ROOT . '/writable/install.lock';

// -------------------------------------------------------------
// Security Lock Check: Prevent accidental reruns
// -------------------------------------------------------------
if (file_exists($lockFile)) {
    header("Content-Type: text/html; charset=UTF-8");
    die("<!DOCTYPE html>
    <html lang='en'>
    <head>
        <meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <title>Sitelift - Installation Locked</title>
        <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet'>
        <style>
            body { background: #f0f5fa; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
            .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 540px; width: 100%; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); }
        </style>
    </head>
    <body>
        <div class='card p-4 p-md-5 text-center'>
            <div class='d-inline-flex align-items-center justify-content-center mx-auto mb-3' style='width: 56px; height: 56px; border-radius: 14px; background: #eff6ff; color: #2563eb;'>
                <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2' ry='2'></rect><path d='M7 11V7a5 5 0 0 1 10 0v4'></path></svg>
            </div>
            <h4 class='fw-bold text-slate-900 mb-2'>Sitelift is Already Installed</h4>
            <p class='text-muted small mb-4'>For server security, the web installer has been automatically locked. To reinstall or reconfigure from scratch, remove <code>writable/install.lock</code> via cPanel File Manager or FTP.</p>
            <a href='/' class='btn btn-primary w-100 py-2.5 fw-bold' style='background: #2563eb; border-color: #2563eb; border-radius: 10px;'>Launch Sitelift Dashboard &rarr;</a>
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
    'Writable Directory'       => ['pass' => is_writable(SITELIFT_ROOT . '/writable'), 'val' => is_writable(SITELIFT_ROOT . '/writable') ? 'Writable (0755)' : 'Not Writable', 'req' => 'writable/']
];

$allRequirementsPassed = true;
foreach ($requirements as $r) {
    if (!$r['pass']) {
        $allRequirementsPassed = false;
        break;
    }
}

// Step 2 & 3: Handle Installation Form Submission
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

    if (empty($dbName)) $errors[] = "Database name is required.";
    if (empty($dbUser)) $errors[] = "Database username is required.";
    if (empty($adminEmail) || !filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) $errors[] = "A valid administrator email is required.";
    if (strlen($adminPass) < 8) $errors[] = "Administrator password must be at least 8 characters.";

    if (empty($errors)) {
        try {
            $dsnWithoutDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
            $pdo = new PDO($dsnWithoutDb, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);

            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
            $pdo->exec("USE `{$dbName}`;");

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

            if (!empty($schemaSql)) {
                if ($dbPrefix !== 'sl_') {
                    $schemaSql = str_replace('`sl_', '`' . $dbPrefix, $schemaSql);
                    $schemaSql = str_replace('sl_', $dbPrefix, $schemaSql);
                }
                $pdo->exec($schemaSql);
            }

            $passHash = password_hash($adminPass, PASSWORD_BCRYPT, ['cost' => 12]);
            $stmt = $pdo->prepare("INSERT INTO `{$dbPrefix}users` (`name`, `email`, `password_hash`, `role`, `created_at`) VALUES (?, ?, ?, 'admin', NOW()) ON DUPLICATE KEY UPDATE `password_hash` = ?, `name` = ?");
            $stmt->execute([$adminName, $adminEmail, $passHash, $passHash, $adminName]);

            $appKey = 'base64:' . base64_encode(random_bytes(32));
            $cronToken = 'sl_cron_' . bin2hex(random_bytes(16));

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
            $errors[] = "Database Connection / Migration Error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sitelift Web Installation Wizard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="installer.css" rel="stylesheet">
    <style>
        :root {
            --sl-blue: #2563eb;
            --sl-blue-hover: #1d4ed8;
            --sl-emerald: #059669;
            --sl-slate-900: #0f172a;
            --sl-slate-700: #334155;
            --sl-slate-200: #e2e8f0;
            --sl-bg: #f0f5fa;
        }
        body { background: var(--sl-bg); color: var(--sl-slate-900); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; padding: 40px 16px; }
        .installer-box { max-width: 660px; margin: 0 auto; }
        .card { background: #ffffff; border: 1px solid var(--sl-slate-200); border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.08); padding: 28px; }
        .badge-pass { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px; }
        .badge-fail { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 9999px; }
        .form-control, .form-select { background: #f8fafc; border: 1px solid #cbd5e1; color: #0f172a; font-size: 0.875rem; border-radius: 10px; padding: 9px 13px; font-weight: 500; }
        .form-control:focus { background: #ffffff; border-color: var(--sl-blue); color: #0f172a; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
        .form-label { font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 4px; }
        .btn-primary { background: var(--sl-blue); border-color: var(--sl-blue); font-weight: 700; border-radius: 10px; padding: 10px 18px; font-size: 0.875rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
        .btn-primary:hover { background: var(--sl-blue-hover); border-color: var(--sl-blue-hover); }
        .btn-secondary { background: #f1f5f9; border-color: #cbd5e1; color: #334155; font-weight: 600; border-radius: 10px; padding: 10px 18px; font-size: 0.875rem; }
        .btn-secondary:hover { background: #e2e8f0; color: #0f172a; }
        .stepper { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 24px; }
        .step-node { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.825rem; font-weight: 800; background: #e2e8f0; color: #64748b; }
        .step-node.active { background: var(--sl-blue); color: #ffffff; box-shadow: 0 4px 10px -1px rgba(37,99,235,0.3); }
        .step-node.completed { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .step-line { width: 36px; height: 2px; background: #cbd5e1; }
    </style>
</head>
<body>
<div class="installer-box">
    <!-- Brand Header -->
    <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center p-2 rounded-3 bg-white border border-slate-200 shadow-sm mb-2" style="width: 48px; height: 48px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <h1 class="h4 fw-bold text-slate-900 mb-0">Sitelift Web Installer</h1>
        <p class="text-muted small">Self-Hosted Personal SEO Intelligence Suite (v1.2.0)</p>
    </div>

    <!-- Stepper Navigation -->
    <div class="stepper">
        <div class="step-node <?= $step === 1 ? 'active' : ($step > 1 ? 'completed' : '') ?>"><?= $step > 1 ? '✓' : '1' ?></div>
        <div class="step-line"></div>
        <div class="step-node <?= $step === 2 ? 'active' : ($step > 2 ? 'completed' : '') ?>"><?= $step > 2 ? '✓' : '2' ?></div>
        <div class="step-line"></div>
        <div class="step-node <?= $step === 3 ? 'active' : '' ?>">3</div>
    </div>

    <!-- Error Alert -->
    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger mb-4 border border-danger-subtle rounded-3 p-3">
            <div class="fw-bold mb-1 small text-danger-emphasis d-flex align-items-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Installation Issues Detected
            </div>
            <ul class="mb-0 ps-3 small text-danger-emphasis">
                <?php foreach ($errors as $err): ?>
                    <li><?= htmlspecialchars($err) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <!-- STEP 1: Server Requirements Check -->
    <?php if ($step === 1): ?>
        <div class="card">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <div>
                    <h5 class="fw-bold text-slate-900 mb-0">Step 1: Environment & Requirements</h5>
                    <p class="text-muted small mb-0">Checking your server compatibility for Sitelift.</p>
                </div>
                <span class="badge bg-light text-dark border px-2 py-1 small font-monospace">PHP <?= PHP_VERSION ?></span>
            </div>

            <div class="list-group list-group-flush mb-4 rounded-3 border border-slate-200 overflow-hidden">
                <?php foreach ($requirements as $title => $r): ?>
                    <div class="list-group-item d-flex justify-content-between align-items-center bg-white py-2 px-3 border-bottom">
                        <div>
                            <span class="fw-semibold text-slate-800 small"><?= htmlspecialchars($title) ?></span>
                            <span class="text-muted d-block" style="font-size: 0.75rem;"><?= htmlspecialchars($r['val']) ?> (Required: <?= htmlspecialchars($r['req']) ?>)</span>
                        </div>
                        <span class="badge <?= $r['pass'] ? 'badge-pass' : 'badge-fail' ?>">
                            <?= $r['pass'] ? '✓ Passed' : '✕ Missing' ?>
                        </span>
                    </div>
                <?php endforeach; ?>
            </div>

            <?php if ($allRequirementsPassed): ?>
                <a href="?step=2" class="btn btn-primary w-100 py-2.5">
                    Next: Configure Database & Admin &rarr;
                </a>
            <?php else: ?>
                <div class="alert alert-warning small mb-0 rounded-3 border">
                    Your hosting environment is missing one or more required PHP extensions. Please enable them in cPanel (Select PHP Version / PHP Extensions) or contact your hosting provider.
                </div>
            <?php endif; ?>
        </div>

    <!-- STEP 2: Database & Admin Configuration -->
    <?php elseif ($step === 2): ?>
        <div class="card">
            <h5 class="fw-bold text-slate-900 mb-1">Step 2: Database & Admin Configuration</h5>
            <p class="text-muted small mb-3">Enter your MySQL credentials and set up your master login.</p>

            <form method="POST" action="?step=2">
                <input type="hidden" name="action" value="install">

                <div class="p-3 bg-light rounded-3 border border-slate-200 mb-3">
                    <div class="fw-bold text-primary small text-uppercase tracking-wider mb-2">MySQL Database Connection</div>
                    <div class="row g-2">
                        <div class="col-md-8">
                            <label class="form-label">Database Host</label>
                            <input type="text" name="db_host" class="form-control" value="127.0.0.1" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Port</label>
                            <input type="text" name="db_port" class="form-control" value="3306" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Database Name</label>
                            <input type="text" name="db_name" class="form-control" placeholder="e.g. cpaneluser_sitelift" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Table Prefix</label>
                            <input type="text" name="db_prefix" class="form-control" value="sl_" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Database Username</label>
                            <input type="text" name="db_user" class="form-control" placeholder="e.g. cpaneluser_db" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Database Password</label>
                            <input type="password" name="db_pass" class="form-control" placeholder="••••••••">
                        </div>
                    </div>
                </div>

                <div class="p-3 bg-light rounded-3 border border-slate-200 mb-4">
                    <div class="fw-bold text-primary small text-uppercase tracking-wider mb-2">Master Administrator Login</div>
                    <div class="row g-2">
                        <div class="col-md-6">
                            <label class="form-label">Full Name</label>
                            <input type="text" name="admin_name" class="form-control" value="Administrator" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Admin Email</label>
                            <input type="email" name="admin_email" class="form-control" placeholder="admin@yourdomain.com" required>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Admin Password (Min. 8 characters)</label>
                            <input type="password" name="admin_password" class="form-control" placeholder="Create a secure password" minlength="8" required>
                        </div>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <a href="?step=1" class="btn btn-secondary py-2.5 px-4">&larr; Back</a>
                    <button type="submit" class="btn btn-primary flex-grow-1 py-2.5">
                        Run Installer & Build Tables &rarr;
                    </button>
                </div>
            </form>
        </div>

    <!-- STEP 3: Complete & Crontab Setup -->
    <?php elseif ($step === 3): ?>
        <div class="card text-center">
            <div class="d-inline-flex align-items-center justify-content-center mx-auto mb-3" style="width: 56px; height: 56px; border-radius: 14px; background: #ecfdf5; color: #059669;">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h4 class="fw-bold text-slate-900 mb-1">Installation Successful!</h4>
            <p class="text-muted small mb-4">All database tables migrated, secure encryption tokens generated, and installer safely locked.</p>

            <div class="p-3 bg-slate-900 text-light rounded-3 text-start mb-4 border" style="background: #0f172a;">
                <div class="text-primary small fw-bold text-uppercase tracking-wider mb-1" style="color: #60a5fa !important;">cPanel / Server Cron Job Command:</div>
                <div class="font-monospace small p-2 rounded bg-black text-slate-100" style="word-break: break-all; font-size: 0.8rem;">
                    * * * * * php <?= SITELIFT_ROOT ?>/cron.php --token=<?= htmlspecialchars($cronToken) ?> &gt;/dev/null 2&gt;&amp;1
                </div>
            </div>

            <a href="/" class="btn btn-primary w-100 py-2.5 fw-bold">
                Launch Sitelift Dashboard &rarr;
            </a>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
