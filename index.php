<?php
/**
 * Sitelift - Self-Hosted Personal SEO Intelligence
 * Main Application & Auto-Installer Router
 * 
 * Requirements: PHP 8.2+, MySQL 5.7+ / 8.0+, Apache / Nginx / LiteSpeed
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
$parsedPath = parse_url($requestUri, PHP_URL_PATH) ?? '/';

// -------------------------------------------------------------
// 3. Robust Static Asset Delivery (handles root, subfolders, & direct PHP routing)
// -------------------------------------------------------------
if (preg_match('#(?:^|/)(assets|dist/assets)/([^/?#]+)#i', $parsedPath, $matches)) {
    $filename = basename($matches[2]);
    
    // Check multiple possible asset locations
    $candidatePaths = [
        SITELIFT_ROOT . '/assets/' . $filename,
        SITELIFT_ROOT . '/dist/assets/' . $filename,
        SITELIFT_ROOT . '/public/assets/' . $filename
    ];

    $assetFile = null;
    foreach ($candidatePaths as $p) {
        if (file_exists($p) && is_file($p)) {
            $assetFile = $p;
            break;
        }
    }

    if ($assetFile) {
        $ext = strtolower(pathinfo($assetFile, PATHINFO_EXTENSION));
        $mimes = [
            'js'    => 'application/javascript; charset=utf-8',
            'mjs'   => 'application/javascript; charset=utf-8',
            'css'   => 'text/css; charset=utf-8',
            'svg'   => 'image/svg+xml',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'webp'  => 'image/webp',
            'gif'   => 'image/gif',
            'ico'   => 'image/x-icon',
            'woff2' => 'font/woff2',
            'woff'  => 'font/woff',
            'ttf'   => 'font/ttf',
            'json'  => 'application/json; charset=utf-8',
            'map'   => 'application/json; charset=utf-8'
        ];

        header('Access-Control-Allow-Origin: *');
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        header('Content-Length: ' . filesize($assetFile));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($assetFile);
        exit;
    } else {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "404 Not Found: Static asset [{$filename}] could not be located in assets/ or dist/assets/.";
        exit;
    }
}

// -------------------------------------------------------------
// 4. API Router for Server-Side Endpoints
// -------------------------------------------------------------
if (strpos($parsedPath, '/api/') !== false) {
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
    if (strpos($parsedPath, '/api/health') !== false || strpos($parsedPath, '/api/version') !== false) {
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
// 5. Calculate Base URL and Locate Built Asset Files
// -------------------------------------------------------------
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '/index.php';
$baseDir = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');
$baseHref = ($baseDir === '' || $baseDir === '/') ? '/' : $baseDir . '/';

// Find JavaScript Bundle
$jsFiles = glob(SITELIFT_ROOT . '/assets/*.js');
if (empty($jsFiles)) {
    $jsFiles = glob(SITELIFT_ROOT . '/dist/assets/*.js');
}

// Find CSS Bundle
$cssFiles = glob(SITELIFT_ROOT . '/assets/*.css');
if (empty($cssFiles)) {
    $cssFiles = glob(SITELIFT_ROOT . '/dist/assets/*.css');
}

$jsAsset = !empty($jsFiles) ? basename(end($jsFiles)) : '';
$cssAsset = !empty($cssFiles) ? basename(end($cssFiles)) : '';

// -------------------------------------------------------------
// 6. Serve Production Single Page Application HTML
// -------------------------------------------------------------
header('Content-Type: text/html; charset=utf-8');
header('X-Frame-Options: SAMEORIGIN');
header('X-Content-Type-Options: nosniff');
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="<?= htmlspecialchars($baseHref) ?>">
    <title>Sitelift - Personal SEO Intelligence</title>
    <meta name="description" content="Self-Hosted Personal SEO Intelligence Suite" />
    <?php if (!empty($cssAsset)): ?>
    <link rel="stylesheet" crossorigin href="assets/<?= htmlspecialchars($cssAsset) ?>">
    <?php endif; ?>
    <?php if (!empty($jsAsset)): ?>
    <script type="module" crossorigin src="assets/<?= htmlspecialchars($jsAsset) ?>"></script>
    <?php endif; ?>
  </head>
  <body class="bg-[#f0f5fa] text-slate-800 antialiased overflow-hidden m-0 p-0 h-full">
    <div id="root" class="h-full w-full bg-[#f0f5fa]"></div>
  </body>
</html>
