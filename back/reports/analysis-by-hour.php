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
$selectedDay = $data['day'] ?? 'ALL'; // default é ALL se não vier nada

$daysMap = [
    'SEG' => 'Monday',
    'TER' => 'Tuesday',
    'QUA' => 'Wednesday',
    'QUI' => 'Thursday',
    'SEX' => 'Friday',
    'SAB' => 'Saturday',
    'DOM' => 'Sunday'
];

$mysqlDay = ($selectedDay !== 'ALL') ? ($daysMap[$selectedDay] ?? null) : null;

if ($selectedDay !== 'ALL' && !$mysqlDay) {
    echo json_encode(['error' => true, 'message' => 'Dia inválido']);
    exit();
}

mysqli_begin_transaction($mysqli);

try {
    $where = "WHERE t.status = 'Confirmado' AND t.canceled = 0";

    $activities = $data['activities'] ?? [];

    // Verificar se a única atividade selecionada é "Regular"
    $onlyRegular = (count($activities) === 1 && $activities[0] === 'Regular');

    if (!empty($activities) && is_array($activities)) {
        $escapedActivities = array_map(fn($a) => "'" . mysqli_real_escape_string($mysqli, $a) . "'", $activities);
        $where .= " AND t.activity IN (" . implode(',', $escapedActivities) . ")";
    }
    
    if ($mysqlDay) {
        $where .= " AND DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = '$mysqlDay'";
    }

    if ($startDate && $endDate) {
        $where .= " AND STR_TO_DATE(t.tourDate, '%Y-%m-%d') BETWEEN '$startDate' AND '$endDate'";
    }

    // Log para debugging
    $debug = [
        'filtros' => [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'day' => $selectedDay,
            'mysqlDay' => $mysqlDay,
            'activities' => $activities,
            'onlyRegular' => $onlyRegular
        ],
        'where' => $where
    ];

    // Definir o agrupamento baseado na atividade
    if ($onlyRegular) {
        // Se for apenas "Regular", não agrupar (manter horário exato)
        $horaSelect = "t.tourHour AS hora";
        
        // Não inicializamos horas vazias aqui pois queremos apenas os horários exatos
        $horas = [];
    } else {
        // Para outras atividades, agrupar por hora como antes
        $horaSelect = "CONCAT(LPAD(HOUR(STR_TO_DATE(t.tourHour, '%H:%i')), 2, '0'), ':00') AS hora";
        
        // Gera as horas cheias entre 08:00 e 21:00
        $horas = [];
        for ($h = 8; $h <= 21; $h++) {
            $hora = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
            $horas[$hora] = 0;
        }
    }

    $query = "
        SELECT
          $horaSelect,
          SUM(CAST(IFNULL(t.paxAdult, 0) AS UNSIGNED) + 
              CAST(IFNULL(t.paxHalf, 0) AS UNSIGNED) + 
              CAST(IFNULL(t.paxFree, 0) AS UNSIGNED) +
              CAST(IFNULL(t.paxNet, 0) AS UNSIGNED)) AS totalPax
        FROM tour t
        $where
        GROUP BY hora
        " . (!$onlyRegular ? "HAVING hora BETWEEN '08:00' AND '21:00'" : "") . "
        ORDER BY hora ASC
    ";

    $debug['query'] = $query;

    $result = mysqli_query($mysqli, $query);
    if (!$result) {
        throw new Exception(mysqli_error($mysqli));
    }

    $totalGeral = 0;
    while ($row = mysqli_fetch_assoc($result)) {
        if ($onlyRegular) {
            // Adiciona diretamente ao array de resultados sem agrupar
            $horas[$row['hora']] = (int)$row['totalPax'];
        } else {
            // Adiciona ao bucket de horas correspondente
            $horas[$row['hora']] = (int)$row['totalPax'];
        }
        $totalGeral += (int)$row['totalPax'];
    }

    $debug['totalGeral'] = $totalGeral;

    $res = [];
    foreach ($horas as $hora => $total) {
        $res[] = [
            'hora' => $hora,
            'total' => $total
        ];
    }

    mysqli_commit($mysqli);
    echo json_encode([
        'data' => $res,
        'debug' => $debug
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    mysqli_rollback($mysqli);
    echo json_encode(['error' => true, 'message' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>
