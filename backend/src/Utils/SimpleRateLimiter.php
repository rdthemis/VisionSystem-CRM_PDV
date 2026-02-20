<?php
// backend/src/Utils/SimpleRateLimiter.php

namespace app\utils;

class SimpleRateLimiter {
    
    private $maxRequests = 10;
    private $timeWindow = 60; // segundos
    private $storageFile;
    
    public function __construct() {
        $this->storageFile = sys_get_temp_dir() . '/rate_limit.json';
    }
    
    public function check($ip) {
        $data = $this->loadData();
        $now = time();
        
        // Limpar dados antigos
        $data = array_filter($data, function($item) use ($now) {
            return $item['expires'] > $now;
        });
        
        // Contar requisições deste IP
        $requests = array_filter($data, function($item) use ($ip) {
            return $item['ip'] === $ip;
        });
        
        if (count($requests) >= $this->maxRequests) {
            return false;
        }
        
        // Adicionar nova requisição
        $data[] = [
            'ip' => $ip,
            'expires' => $now + $this->timeWindow
        ];
        
        $this->saveData($data);
        return true;
    }
    
    private function loadData() {
        if (!file_exists($this->storageFile)) {
            return [];
        }
        
        $content = file_get_contents($this->storageFile);
        return json_decode($content, true) ?: [];
    }
    
    private function saveData($data) {
        file_put_contents($this->storageFile, json_encode($data));
    }
}