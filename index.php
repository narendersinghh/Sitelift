<?php
/**
 * Sitelift - Self-Hosted Personal SEO Intelligence
 * Main Application & Auto-Installer Router
 * 
 * Requirements: PHP 8.2+, MySQL 5.7+ / 8.0+, Apache / Nginx
 */

define('SITELIFT_ROOT', __DIR__);
define('SITELIFT_VERSION', '1.2.0');

$lockFile = SITELIFT_ROOT . '/writable/install.lock';
$envFile = SITELIFT_ROOT . '/.env';

// -------------------------------------------------------------
// 1. Check if Sitelift is Installed
// -------------------------------------------------------------
if (!file_exists($lockFile) || !file_exists($envFile)) {
    // Application is not installed yet: Automatically route to Web Installer!
    if (file_exists(SITELIFT_ROOT . '/public/install/index.php')) {
        require_once SITELIFT_ROOT . '/public/install/index.php';
        exit;
    } else {
        die("<h1>Sitelift Installation Missing</h1><p>Please ensure the installer files are uploaded to <code>public/install/</code> or run <code>install.php</code>.</p>");
    }
}

// -------------------------------------------------------------
// 2. Load Configuration & Environment
// -------------------------------------------------------------
$env = @parse_ini_file($envFile);
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$parsedPath = parse_url($requestUri, PHP_URL_PATH);

// -------------------------------------------------------------
// 3. Static Asset Router (for servers without direct rewrite)
// -------------------------------------------------------------
if (preg_match('#^/(assets|dist/assets)/(.+)$#', $parsedPath, $matches)) {
    $assetFile = SITELIFT_ROOT . '/dist/assets/' . basename($matches[2]);
    if (!file_exists($assetFile)) {
        $assetFile = SITELIFT_ROOT . '/assets/' . basename($matches[2]);
    }
    if (file_exists($assetFile)) {
        $ext = strtolower(pathinfo($assetFile, PATHINFO_EXTENSION));
        $mimes = [
            'js' => 'application/javascript; charset=utf-8',
            'css' => 'text/css; charset=utf-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'webp' => 'image/webp',
            'woff2' => 'font/woff2',
            'woff' => 'font/woff',
            'json' => 'application/json'
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        header('Cache-Control: public, max-age=31536000');
        readfile($assetFile);
        exit;
    }
}

// -------------------------------------------------------------
// 4. API Router for Server-Side Endpoints
// -------------------------------------------------------------
if (strpos($parsedPath, '/api/') === 0) {
    header('Content-Type: application/json; charset=utf-8');
    
    // Database connection
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
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]
        );
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }

    // Health / Version check
    if ($parsedPath === '/api/health' || $parsedPath === '/api/version') {
        echo json_encode([
            'status' => 'healthy',
            'version' => SITELIFT_VERSION,
            'php_version' => PHP_VERSION,
            'installed' => true,
            'database' => 'connected'
        ]);
        exit;
    }

    // Default API fallback
    echo json_encode([
        'status' => 'ok',
        'message' => 'Sitelift API Endpoint',
        'version' => SITELIFT_VERSION
    ]);
    exit;
}

// -------------------------------------------------------------
// 5. Serve Single Page Application UI
// -------------------------------------------------------------
header('Content-Type: text/html; charset=utf-8');
if (file_exists(SITELIFT_ROOT . '/dist/index.html')) {
    readfile(SITELIFT_ROOT . '/dist/index.html');
    exit;
} elseif (file_exists(SITELIFT_ROOT . '/index.html')) {
    readfile(SITELIFT_ROOT . '/index.html');
    exit;
} else {
    echo "<!DOCTYPE html><html><head><title>Sitelift v" . SITELIFT_VERSION . "</title><style>body{background:#0b1120;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;}</style></head><body><h1>Sitelift Self-Hosted Suite v" . SITELIFT_VERSION . "</h1><p>Backend & Database are successfully connected.</p></body></html>";
    exit;
}
