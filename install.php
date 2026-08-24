<?php
/**
 * Sitelift - Self-Hosted Personal SEO Intelligence
 * Root Web Installer Entry Point
 * Requirements: PHP 8.2+, PDO MySQL, cURL, OpenSSL, mbstring, JSON
 */

// If public/install/index.php exists, load that, otherwise execute standalone installer
if (file_exists(__DIR__ . '/public/install/index.php')) {
    require_once __DIR__ . '/public/install/index.php';
    exit;
}

define('SITELIFT_ROOT', __DIR__);
$lockFile = SITELIFT_ROOT . '/writable/install.lock';

if (file_exists($lockFile)) {
    die("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Installation Locked - Sitelift</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}div{background:#1e293b;padding:32px;border-radius:12px;border:1px solid #334155;max-width:500px;text-align:center;}h1{color:#38bdf8;font-size:22px;margin-top:0;}p{color:#94a3b8;font-size:14px;line-height:1.6;}a{display:inline-block;margin-top:16px;background:#0284c7;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;}</style></head><body><div><h1>Sitelift is Already Installed</h1><p>For security, the installer is locked. To re-install, delete <code>writable/install.lock</code> via cPanel File Manager or FTP.</p><a href='/'>Go to Sitelift Dashboard &rarr;</a></div></body></html>");
}

// Redirect to root which has the bundled installer
header("Location: /");
exit;
