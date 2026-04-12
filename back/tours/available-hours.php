<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include '../connection.php';

$date = $_GET['date'] ?? '';
$type = $_GET['type'] ?? '';
$status = $_GET['status'] ?? '';

mysqli_begin_transaction($mysqli);

try {
    $query = "
        SELECT DISTINCT tourHour 
        FROM tour 
        WHERE tourDate = ? 
        AND type = ? 
        AND status = ? 
        AND canceled = 0
        ORDER BY tourHour ASC
    ";

    $stmt = mysqli_prepare($mysqli, $query);
    mysqli_stmt_bind_param($stmt, "sss", $date, $type, $status);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $hours = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $hours[] = $row['tourHour'];
    }

    mysqli_commit($mysqli);
    echo json_encode($hours, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    mysqli_rollback($mysqli);
    echo json_encode(['error' => true, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} 