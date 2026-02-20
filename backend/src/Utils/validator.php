<?php

// backend/src/Utils/Validator.php

namespace App\Utils;

class Validator
{
    public static function email($email)
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Email inválido');
        }

        return filter_var($email, FILTER_SANITIZE_EMAIL);
    }

    public static function string($string, $minLength = 1, $maxLength = 255)
    {
        $cleaned = htmlspecialchars(trim($string), ENT_QUOTES, 'UTF-8');

        if (strlen($cleaned) < $minLength || strlen($cleaned) > $maxLength) {
            throw new \InvalidArgumentException("String deve ter entre {$minLength} e {$maxLength} caracteres");
        }

        return $cleaned;
    }

    public static function integer($value, $min = null, $max = null)
    {
        if (!is_numeric($value)) {
            throw new \InvalidArgumentException('Valor deve ser numérico');
        }

        $int = (int) $value;

        if ($min !== null && $int < $min) {
            throw new \InvalidArgumentException("Valor mínimo: {$min}");
        }

        if ($max !== null && $int > $max) {
            throw new \InvalidArgumentException("Valor máximo: {$max}");
        }

        return $int;
    }

    public static function decimal($value, $decimals = 2)
    {
        if (!is_numeric($value)) {
            throw new \InvalidArgumentException('Valor deve ser numérico');
        }

        return number_format((float) $value, $decimals, '.', '');
    }

    public static function required($value, $fieldName = 'Campo')
    {
        if (empty($value) && $value !== '0' && $value !== 0) {
            throw new \InvalidArgumentException("{$fieldName} é obrigatório");
        }

        return $value;
    }

    public static function cpf($cpf)
    {
        $cpf = preg_replace('/[^0-9]/', '', $cpf);

        if (strlen($cpf) != 11) {
            throw new \InvalidArgumentException('CPF inválido');
        }

        // Validação do CPF
        for ($t = 9; $t < 11; ++$t) {
            $d = 0;
            for ($c = 0; $c < $t; ++$c) {
                $d += $cpf[$c] * (($t + 1) - $c);
            }
            $d = ((10 * $d) % 11) % 10;
            if ($cpf[$c] != $d) {
                throw new \InvalidArgumentException('CPF inválido');
            }
        }

        return $cpf;
    }
}