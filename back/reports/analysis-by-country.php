<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

include '../connection.php';

$data = json_decode(file_get_contents('php://input'), true);

$startDate = $data['startDate'] ?? null;
$endDate = $data['endDate'] ?? null;
$orderBy = ($data['orderBy'] ?? '') === 'valor' ? 'valorTotal' : 'totalPax';
$from = isset($data['from']) ? intval($data['from']) : 1;
$to = isset($data['to']) ? intval($data['to']) : 10;

$offset = max($from - 1, 0);
$limit = max($to - $from + 1, 1);

mysqli_begin_transaction($mysqli);

try {
    $where = "WHERE t.status = 'Confirmado' AND t.canceled = 0";

    if ($startDate && $endDate) {
        $where .= " AND t.tourDate BETWEEN '$startDate' AND '$endDate'";
    }

    // Totais gerais para cálculo de porcentagens
    $totaisQuery = "
        SELECT 
            SUM(CAST(IFNULL(t.paxAdult, 0) AS UNSIGNED) + 
                CAST(IFNULL(t.paxHalf, 0) AS UNSIGNED) + 
                CAST(IFNULL(t.paxFree, 0) AS UNSIGNED)) AS totalPaxGeral,
            SUM(CAST(REPLACE(t.totalValue, ',', '.') AS DECIMAL(10,2))) AS valorTotalGeral
        FROM tour t
        $where
    ";

    $totaisRes = mysqli_query($mysqli, $totaisQuery);
    if (!$totaisRes) {
        throw new Exception(mysqli_error($mysqli));
    }

    $totais = mysqli_fetch_assoc($totaisRes);
    $totalPaxGeral = (int) $totais['totalPaxGeral'];
    $valorTotalGeral = (float) $totais['valorTotalGeral'];

    // Consulta paginada com agrupamento por país
    $query = "
        SELECT 
            t.country,
            t.currency,
            SUM(CAST(IFNULL(t.paxAdult, 0) AS UNSIGNED) + 
                CAST(IFNULL(t.paxHalf, 0) AS UNSIGNED) + 
                CAST(IFNULL(t.paxFree, 0) AS UNSIGNED)) AS totalPax,
            SUM(CAST(REPLACE(t.totalValue, ',', '.') AS DECIMAL(10,2))) AS valorTotal
        FROM 
            tour t
        $where
        GROUP BY 
            t.country, t.currency
        ORDER BY 
            $orderBy DESC
        LIMIT $offset, $limit
    ";

    $result = mysqli_query($mysqli, $query);
    if (!$result) {
        throw new Exception(mysqli_error($mysqli));
    }

    $rows = [];
    $index = $offset + 1;
    while ($row = mysqli_fetch_assoc($result)) {
        $pax = (int) $row['totalPax'];
        $valor = (float) $row['valorTotal'];

        $row['index'] = $index++;
        $row['paxPercent'] = $totalPaxGeral > 0 ? round(($pax / $totalPaxGeral) * 100, 2) : 0;
        $row['valorPercent'] = $valorTotalGeral > 0 ? round(($valor / $valorTotalGeral) * 100, 2) : 0;

        $rows[] = $row;
    }

    mysqli_commit($mysqli);
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    mysqli_rollback($mysqli);
    echo json_encode(['error' => true, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
