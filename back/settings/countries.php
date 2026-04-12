<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include '../connection.php';

// Busca países únicos em ordem alfabética
$query = "SELECT DISTINCT value FROM settings WHERE type = 'country' ORDER BY value ASC";
$result = mysqli_query($mysqli, $query);

$rows = [];
while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
    $rows[] = $row;
}

$response = new \stdClass();
$response->error = !$result;

echo json_encode($rows, JSON_UNESCAPED_UNICODE);
?> 