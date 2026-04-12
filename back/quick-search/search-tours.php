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

$reserva = $data['reserva'] ?? '';
$cliente = $data['cliente'] ?? '';

mysqli_begin_transaction($mysqli);

try {
    $query = "
        SELECT 
            t.id,
            t.orderRef,
            t.client,
            t.clientName,
            t.clientContact,
            t.paxAdult,
            t.paxHalf,
            t.paxFree,
            t.paxNet,
            t.paxBrazilian,
            t.tourDate,
            t.tourHour,
            t.status,
            t.canceled,
            t.paymentStatus,
            t.totalValue,
            t.paymentMethod,
            t.comments,
            t.type,
            t.activity,
            t.local,
            t.language,
            t.currency,
            t.ceGuide,
            t.country,
            t.companionName,
            t.companionContact,
            t.commissioned,
            t.company,
            t.invoiceNumber,
            t.accountNumber,
            t.paymentDate,
            t.netValue,
            t.financialComments,
            t.duration,
            t.year,
            t.dateOfRegistration,
            t.cancelReason,
            t.lateCheck,
            t.lastEditBy,
            t.createdBy,
            t.origin,
            t.dayOrderId,
            t.platform,
            t.emailSubject,
            (t.paxAdult + t.paxHalf + t.paxFree + t.paxNet + t.paxBrazilian) as totalPax,
            CASE 
                WHEN t.type = 'regular' THEN ''
                ELSE t.numberOfGroups
            END as numberOfGroups,
            CASE 
                WHEN WEEKDAY(t.tourDate) = 0 THEN 'Segunda'
                WHEN WEEKDAY(t.tourDate) = 1 THEN 'Terça'
                WHEN WEEKDAY(t.tourDate) = 2 THEN 'Quarta'
                WHEN WEEKDAY(t.tourDate) = 3 THEN 'Quinta'
                WHEN WEEKDAY(t.tourDate) = 4 THEN 'Sexta'
                WHEN WEEKDAY(t.tourDate) = 5 THEN 'Sábado'
                WHEN WEEKDAY(t.tourDate) = 6 THEN 'Domingo'
            END as weekDay,
            DATE_FORMAT(t.dateOfRegistration, '%d/%m/%Y %H:%i') as dateOfRegistrationFormated
        FROM tour t
        WHERE t.status = 'Confirmado' 
        AND t.canceled = 0
    ";

    $params = [];
    $types = "";

    if (!empty($reserva)) {
        $query .= " AND t.orderRef LIKE ?";
        $params[] = "%{$reserva}%";
        $types .= "s";
    }

    if (!empty($cliente)) {
        $query .= " AND (LOWER(t.client) LIKE LOWER(?) OR LOWER(t.clientName) LIKE LOWER(?))";
        $params[] = "%{$cliente}%";
        $params[] = "%{$cliente}%";
        $types .= "ss";
    }

    $query .= " ORDER BY t.tourDate DESC, t.tourHour DESC";

    $stmt = mysqli_prepare($mysqli, $query);
    
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }
    
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $tours = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Formatação dos dados
        $row['tourDate'] = date('d/m/Y', strtotime($row['tourDate']));
        $row['tourHour'] = date('H:i', strtotime($row['tourHour']));
        
        $tours[] = $row;
    }

    mysqli_commit($mysqli);
    echo json_encode([
        'tours' => $tours
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    mysqli_rollback($mysqli);
    echo json_encode(['error' => true, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?> 