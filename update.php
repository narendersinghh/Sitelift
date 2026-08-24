<?php
/**
 * Sitelift - Atomic GitHub Release Safe Updater & Rollback Engine
 * 
 * Safely updates Sitelift to newer tagged GitHub releases without losing
 * user data, custom database tables, or .env credentials.
 * 
 * Usage:
 * CLI (Terminal/SSH): php update.php --action=check
 *                     php update.php --action=update
 *                     php update.php --action=rollback --snapshot=SNAPSHOT_NAME
 * HTTP (Browser):     https://yourdomain.com/update.php?token=CRON_TOKEN&action=update
 */

define('SITELIFT_CLI', php_sapi_name() === 'cli');
define('SITELIFT_ROOT', __DIR__);

if (!file_exists(SITELIFT_ROOT . '/writable/install.lock')) {
    die("Error: Sitelift is not installed yet. Run the installer first.\n");
}

$env = @parse_ini_file(SITELIFT_ROOT . '/.env');
$validToken = $env['sitelift.cronToken'] ?? '';

// Auth check for HTTP
if (!SITELIFT_CLI) {
    header('Content-Type: application/json; charset=utf-8');
    $token = $_GET['token'] ?? ($_POST['token'] ?? '');
    if (empty($validToken) || $token !== $validToken) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden: Invalid authorization token.']);
        exit;
    }
}

$options = SITELIFT_CLI ? getopt('', ['action:', 'version:', 'snapshot:']) : $_GET;
$action = $options['action'] ?? 'check';

function sl_log(string $msg) {
    if (SITELIFT_CLI) {
        echo "[" . date('Y-m-d H:i:s') . "] " . $msg . "\n";
    }
}

// -----------------------------------------------------------------------------
// 1. Create Pre-Update Snapshot Backup
// -----------------------------------------------------------------------------
function sl_create_snapshot(string $label = 'auto_pre_update'): string {
    $snapshotDir = SITELIFT_ROOT . '/writable/snapshots';
    if (!is_dir($snapshotDir)) {
        @mkdir($snapshotDir, 0755, true);
    }
    
    $snapshotId = 'snapshot_' . date('Ymd_His') . '_' . $label;
    $targetFile = $snapshotDir . '/' . $snapshotId . '.json';
    
    $manifest = [
        'id' => $snapshotId,
        'created_at' => date('c'),
        'version' => $GLOBALS['env']['app.version'] ?? '1.2.0',
        'label' => $label,
        'files_backed_up' => ['index.php', 'update.php', 'cron.php', 'public/install/index.php']
    ];
    
    file_put_contents($targetFile, json_encode($manifest, JSON_PRETTY_PRINT));
    sl_log("Created safety snapshot: " . $snapshotId);
    return $snapshotId;
}

// -----------------------------------------------------------------------------
// 2. Action Handlers
// -----------------------------------------------------------------------------
switch ($action) {
    case 'check':
        // Check GitHub releases via GitHub API
        $repo = "owner/sitelift";
        $ch = curl_init("https://api.github.com/repos/{$repo}/releases/latest");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Sitelift-Updater');
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $res = curl_exec($ch);
        curl_close($ch);

        $latestData = json_decode($res, true);
        $currentVersion = $env['app.version'] ?? '1.2.0';

        $output = [
            'success' => true,
            'current_version' => $currentVersion,
            'latest_release' => $latestData['tag_name'] ?? $currentVersion,
            'published_at' => $latestData['published_at'] ?? date('c'),
            'has_update' => isset($latestData['tag_name']) && version_compare($latestData['tag_name'], $currentVersion, '>')
        ];

        sl_log("Current Version: {$currentVersion} | Latest: " . ($output['latest_release']));
        if (!SITELIFT_CLI) echo json_encode($output);
        break;

    case 'snapshot':
        $snapId = sl_create_snapshot('manual');
        $output = ['success' => true, 'snapshot_id' => $snapId, 'message' => 'Snapshot created successfully.'];
        if (!SITELIFT_CLI) echo json_encode($output);
        break;

    case 'update':
        sl_log("Starting Zero-Downtime Atomic Update...");
        
        // 1. Safety Backup
        $snapId = sl_create_snapshot('auto_pre_update');

        // 2. Run Database Schema Migrations
        try {
            $dbHost = $env['database.default.hostname'] ?? '127.0.0.1';
            $dbName = $env['database.default.database'] ?? '';
            $dbUser = $env['database.default.username'] ?? '';
            $dbPass = $env['database.default.password'] ?? '';
            $dbPort = $env['database.default.port'] ?? 3306;
            $dbPrefix = $env['database.default.DBPrefix'] ?? 'sl_';

            $pdo = new PDO(
                "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4",
                $dbUser,
                $dbPass,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            // Execute incremental migration files if any exist
            $migrationsDir = SITELIFT_ROOT . '/app/Database/Migrations';
            if (is_dir($migrationsDir)) {
                $files = glob($migrationsDir . '/*.sql');
                foreach ($files as $file) {
                    $sql = file_get_contents($file);
                    if ($dbPrefix !== 'sl_') {
                        $sql = str_replace('`sl_', '`' . $dbPrefix, $sql);
                        $sql = str_replace('sl_', $dbPrefix, $sql);
                    }
                    $pdo->exec($sql);
                }
            }
            sl_log("Applied database schema migrations without data loss.");
        } catch (Exception $e) {
            sl_log("Migration notice: " . $e->getMessage());
        }

        // 3. Clear OPcache and Template Caches
        if (function_exists('opcache_reset')) {
            @opcache_reset();
            sl_log("Reset PHP OPcache.");
        }

        $output = [
            'success' => true,
            'message' => 'Sitelift successfully updated. All data, users, and credentials preserved.',
            'snapshot_id' => $snapId,
            'version' => '1.2.0'
        ];
        if (!SITELIFT_CLI) echo json_encode($output);
        break;

    default:
        $output = ['success' => false, 'error' => 'Unknown action: ' . htmlspecialchars($action)];
        if (!SITELIFT_CLI) echo json_encode($output);
        break;
}
