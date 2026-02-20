<?php

// backend/public/security_headers.php

// Proteção XSS
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// 🔧 Content Security Policy - AJUSTADO PARA DESENVOLVIMENTO
// Permite conexões do frontend (localhost:3000)
header("Content-Security-Policy: default-src 'self' http://localhost:3000; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3000");

// Referrer Policy
header('Referrer-Policy: strict-origin-when-cross-origin');

// Permissions Policy
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// HSTS (usar apenas com HTTPS)
if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}