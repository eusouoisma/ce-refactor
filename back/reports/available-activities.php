<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

// Retornar apenas atividades fixas sem consultar o banco de dados
$activities = ["Regular", "Tour 1", "Mix Tour 1"];

echo json_encode($activities, JSON_UNESCAPED_UNICODE);
