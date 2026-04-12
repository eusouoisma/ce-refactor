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
$hour = $_GET['hour'] ?? '';

if (!$date || !$hour) {
    echo json_encode(['error' => true, 'message' => 'Parâmetros obrigatórios não informados.']);
    exit();
}

mysqli_begin_transaction($mysqli);

try {
    $query = "
        SELECT 
            t.id,
            t.orderRef,
            t.client,
            t.ceGuide,
            t.clientName,
            t.paxAdult,
            t.paxHalf,
            t.paxFree,
            t.paxNet,
            t.paxBrazilian,
            t.paymentMethod,
            t.totalValue,
            t.paymentStatus,
            t.commissioned,
            t.comments,
            t.status,
            t.tourDate,
            t.tourHour,
            t.activity,
            t.language,
            t.local,
            t.clientContact,
            t.country,
            t.emailSubject,
            t.companionName,
            t.companionContact,
            t.dateOfRegistration,
            t.createdBy,
            t.lastEditBy,
            t.financialComments,
            t.year,
            t.origin,
            t.dayOrderId
        FROM tour t
        WHERE t.status = 'Confirmado' 
            AND t.type = 'regular'
            AND t.tourDate = ?
            AND t.tourHour = ?
            AND t.canceled = 0
        ORDER BY t.id ASC
    ";

    $stmt = mysqli_prepare($mysqli, $query);
    mysqli_stmt_bind_param($stmt, "ss", $date, $hour);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $rows = [];
    $n = 1;
    while ($row = mysqli_fetch_assoc($result)) {
        // Calcular o total somando todos os tipos de pax
        $totalPax = intval($row['paxAdult']) + intval($row['paxHalf']) + intval($row['paxFree']) + intval($row['paxNet']) + intval($row['paxBrazilian']);
        
        $rows[] = [
            'n' => $n++,
            'guideAgency' => $row['client'],
            'adulto' => intval($row['paxAdult']),
            'net' => intval($row['paxNet']),
            'brasileiro' => intval($row['paxBrazilian']),
            'meia' => intval($row['paxHalf']),
            'free' => intval($row['paxFree']),
            'total' => $totalPax,
            'nomePax' => $row['clientName'],
            'guia' => $row['companionName'],
            'paymentMethod' => $row['paymentMethod'],
            'valorTotal' => $row['totalValue'],
            'comissao' => ($row['commissioned'] == 1 || $row['commissioned'] == '1') ? 'Sim' : 'Não',
            'statusPgto' => $row['paymentStatus'],
            'obs' => $row['comments'],
        ];
    }

    mysqli_commit($mysqli);
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    mysqli_rollback($mysqli);
    echo json_encode(['error' => true, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
} 