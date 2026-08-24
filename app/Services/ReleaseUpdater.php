<?php
namespace App\Services;

/**
 * Release Verification & Migration Runner
 */
class ReleaseUpdater {
    public static function getInstalledVersion(): string {
        $envFile = dirname(dirname(__DIR__)) . '/.env';
        if (file_exists($envFile)) {
            $env = @parse_ini_file($envFile);
            return $env['app.version'] ?? '1.2.0';
        }
        return '1.0.0';
    }

    public static function checkHealth(): array {
        return [
            'status' => 'operational',
            'php_version' => PHP_VERSION,
            'pdo' => extension_loaded('pdo_mysql'),
            'writable' => is_writable(dirname(dirname(__DIR__)) . '/writable')
        ];
    }
}
