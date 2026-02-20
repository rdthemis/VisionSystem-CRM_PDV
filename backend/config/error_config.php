<?php

// backend/config/error_config.php

if ($_ENV['APP_ENV'] === 'production') {
    // Produção: não mostrar erros
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(E_ALL);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__.'/../logs/php_errors.log');
} else {
    // Desenvolvimento: mostrar erros
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}