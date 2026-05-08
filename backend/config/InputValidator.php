<?php
// backend/config/InputValidator.php

/**
 * Classe para validação e sanitização de inputs
 * Previne XSS, SQL Injection e outros ataques
 */
class InputValidator {
    
    /**
     * Sanitizar string - remove tags HTML e caracteres perigosos
     */
    public static function sanitizeString($input) {
        if ($input === null) {
            return null;
        }
        
        // Remove tags HTML
        $input = strip_tags($input);
        
        // Remove espaços extras
        $input = trim($input);
        
        // Converte caracteres especiais
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        
        return $input;
    }
    
    /**
     * Sanitizar email
     */
    public static function sanitizeEmail($email) {
        if ($email === null) {
            return null;
        }
        
        $email = trim($email);
        $email = filter_var($email, FILTER_SANITIZE_EMAIL);
        
        return $email;
    }
    
    /**
     * Validar email
     */
    public static function validateEmail($email) {
        if (empty($email)) {
            return false;
        }
        
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }
    
    /**
     * Sanitizar número inteiro
     */
    public static function sanitizeInt($input) {
        if ($input === null || $input === '') {
            return null;
        }
        
        return filter_var($input, FILTER_SANITIZE_NUMBER_INT);
    }
    
    /**
     * Validar número inteiro
     */
    public static function validateInt($input) {
        if ($input === null || $input === '') {
            return false;
        }
        
        return filter_var($input, FILTER_VALIDATE_INT) !== false;
    }
    
    /**
     * Sanitizar número decimal
     */
    public static function sanitizeFloat($input) {
        if ($input === null || $input === '') {
            return null;
        }
        
        return filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }
    
    /**
     * Validar número decimal
     */
    public static function validateFloat($input) {
        if ($input === null || $input === '') {
            return false;
        }
        
        return filter_var($input, FILTER_VALIDATE_FLOAT) !== false;
    }
    
    /**
     * Sanitizar URL
     */
    public static function sanitizeUrl($url) {
        if ($url === null) {
            return null;
        }
        
        return filter_var($url, FILTER_SANITIZE_URL);
    }
    
    /**
     * Validar URL
     */
    public static function validateUrl($url) {
        if (empty($url)) {
            return false;
        }
        
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }
    
    /**
     * Sanitizar array de dados
     * Aplica sanitização recursiva
     */
    public static function sanitizeArray($array, $rules = []) {
        if (!is_array($array)) {
            return [];
        }
        
        $sanitized = [];
        
        foreach ($array as $key => $value) {
            // Sanitizar a chave
            $cleanKey = self::sanitizeString($key);
            
            // Se há regras específicas para este campo
            if (isset($rules[$key])) {
                $rule = $rules[$key];
                
                switch ($rule) {
                    case 'email':
                        $sanitized[$cleanKey] = self::sanitizeEmail($value);
                        break;
                    case 'int':
                        $sanitized[$cleanKey] = self::sanitizeInt($value);
                        break;
                    case 'float':
                        $sanitized[$cleanKey] = self::sanitizeFloat($value);
                        break;
                    case 'url':
                        $sanitized[$cleanKey] = self::sanitizeUrl($value);
                        break;
                    case 'html':
                        // Permite HTML mas sanitiza
                        $sanitized[$cleanKey] = self::sanitizeHtml($value);
                        break;
                    case 'raw':
                        // Não sanitiza (use com cuidado!)
                        $sanitized[$cleanKey] = $value;
                        break;
                    default:
                        $sanitized[$cleanKey] = self::sanitizeString($value);
                }
            } else {
                // Sem regra específica, aplicar sanitização padrão
                if (is_array($value)) {
                    $sanitized[$cleanKey] = self::sanitizeArray($value);
                } else {
                    $sanitized[$cleanKey] = self::sanitizeString($value);
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Sanitizar HTML - permite tags seguras
     * Use apenas quando realmente precisar permitir HTML
     */
    public static function sanitizeHtml($html) {
        if ($html === null) {
            return null;
        }
        
        // Lista de tags permitidas (whitelist)
        $allowedTags = '<p><br><strong><em><u><ul><ol><li><a><h1><h2><h3><h4><h5><h6>';
        
        // Remove tags não permitidas
        $html = strip_tags($html, $allowedTags);
        
        // Remove atributos perigosos de tags permitidas
        $html = preg_replace('/<a[^>]*href=(["\'])javascript:.*?\1[^>]*>/i', '', $html);
        $html = preg_replace('/on\w+\s*=\s*["\'][^"\']*["\']/i', '', $html);
        
        return $html;
    }
    
    /**
     * Validar campos obrigatórios
     */
    public static function validateRequired($data, $requiredFields) {
        $missing = [];
        
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            return [
                'valid' => false,
                'missing' => $missing,
                'message' => 'Campos obrigatórios faltando: ' . implode(', ', $missing)
            ];
        }
        
        return ['valid' => true];
    }
    
    /**
     * Validar tamanho de string
     */
    public static function validateLength($string, $min = 0, $max = PHP_INT_MAX) {
        $length = mb_strlen($string, 'UTF-8');
        
        if ($length < $min) {
            return [
                'valid' => false,
                'message' => "O texto deve ter no mínimo {$min} caracteres"
            ];
        }
        
        if ($length > $max) {
            return [
                'valid' => false,
                'message' => "O texto deve ter no máximo {$max} caracteres"
            ];
        }
        
        return ['valid' => true];
    }
    
    /**
     * Validar formato de telefone brasileiro
     */
    public static function validatePhone($phone) {
        if (empty($phone)) {
            return false;
        }
        
        // Remove caracteres não numéricos
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Valida formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
        return preg_match('/^[1-9]{2}9?[0-9]{8}$/', $phone) === 1;
    }
    
    /**
     * Validar CPF
     */
    public static function validateCPF($cpf) {
        if (empty($cpf)) {
            return false;
        }
        
        // Remove caracteres não numéricos
        $cpf = preg_replace('/[^0-9]/', '', $cpf);
        
        // Verifica se tem 11 dígitos
        if (strlen($cpf) != 11) {
            return false;
        }
        
        // Verifica se todos os dígitos são iguais
        if (preg_match('/(\d)\1{10}/', $cpf)) {
            return false;
        }
        
        // Validação dos dígitos verificadores
        for ($t = 9; $t < 11; $t++) {
            $d = 0;
            for ($c = 0; $c < $t; $c++) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Validar CNPJ
     */
    public static function validateCNPJ($cnpj) {
        if (empty($cnpj)) {
            return false;
        }
        
        // Remove caracteres não numéricos
        $cnpj = preg_replace('/[^0-9]/', '', $cnpj);
        
        // Verifica se tem 14 dígitos
        if (strlen($cnpj) != 14) {
            return false;
        }
        
        // Verifica se todos os dígitos são iguais
        if (preg_match('/(\d)\1{13}/', $cnpj)) {
            return false;
        }
        
        // Validação dos dígitos verificadores
        $tamanho = strlen($cnpj) - 2;
        $numeros = substr($cnpj, 0, $tamanho);
        $digitos = substr($cnpj, $tamanho);
        $soma = 0;
        $pos = $tamanho - 7;
        
        for ($i = $tamanho; $i >= 1; $i--) {
            $soma += $numeros[$tamanho - $i] * $pos--;
            if ($pos < 2) {
                $pos = 9;
            }
        }
        
        $resultado = $soma % 11 < 2 ? 0 : 11 - $soma % 11;
        
        if ($resultado != $digitos[0]) {
            return false;
        }
        
        $tamanho = $tamanho + 1;
        $numeros = substr($cnpj, 0, $tamanho);
        $soma = 0;
        $pos = $tamanho - 7;
        
        for ($i = $tamanho; $i >= 1; $i--) {
            $soma += $numeros[$tamanho - $i] * $pos--;
            if ($pos < 2) {
                $pos = 9;
            }
        }
        
        $resultado = $soma % 11 < 2 ? 0 : 11 - $soma % 11;
        
        if ($resultado != $digitos[1]) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validar data no formato Y-m-d
     */
    public static function validateDate($date, $format = 'Y-m-d') {
        if (empty($date)) {
            return false;
        }
        
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    /**
     * Validar senha forte
     * Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial
     */
    public static function validateStrongPassword($password) {
        if (strlen($password) < 8) {
            return [
                'valid' => false,
                'message' => 'A senha deve ter no mínimo 8 caracteres'
            ];
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            return [
                'valid' => false,
                'message' => 'A senha deve conter pelo menos uma letra maiúscula'
            ];
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            return [
                'valid' => false,
                'message' => 'A senha deve conter pelo menos uma letra minúscula'
            ];
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            return [
                'valid' => false,
                'message' => 'A senha deve conter pelo menos um número'
            ];
        }
        
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return [
                'valid' => false,
                'message' => 'A senha deve conter pelo menos um caractere especial'
            ];
        }
        
        return ['valid' => true];
    }
}
