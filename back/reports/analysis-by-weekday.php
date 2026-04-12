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
$selectedDay = $data['day'] ?? null; // Pode ser nulo se todos os dias forem selecionados
$applyDayFilter = $data['applyDayFilter'] ?? false; // Novo parâmetro para decidir se aplica filtro de dia

// Mapeamento de abreviações dos dias para dias da semana em português
$daysMap = [
    'DOM' => 'Sunday',
    'SEG' => 'Monday', 
    'TER' => 'Tuesday',
    'QUA' => 'Wednesday',
    'QUI' => 'Thursday',
    'SEX' => 'Friday',
    'SAB' => 'Saturday'
];

$mysqlDay = $selectedDay ? ($daysMap[$selectedDay] ?? null) : null;

if ($selectedDay && !$mysqlDay && $selectedDay !== 'ALL') {
    echo json_encode(['error' => true, 'message' => 'Dia inválido']);
    exit();
}

mysqli_begin_transaction($mysqli);

try {
    $where = "WHERE t.status = 'Confirmado' AND t.canceled = 0";

    $activities = $data['activities'] ?? [];
    if (!empty($activities) && is_array($activities)) {
        $escapedActivities = array_map(fn($a) => "'" . mysqli_real_escape_string($mysqli, $a) . "'", $activities);
        $where .= " AND t.activity IN (" . implode(',', $escapedActivities) . ")";
    }

    // Aplica o filtro de dia da semana apenas se o parâmetro applyDayFilter for true
    if ($applyDayFilter && $mysqlDay) {
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
            'applyDayFilter' => $applyDayFilter,
            'activities' => $activities
        ],
        'where' => $where
    ];

    // Inicializar array com dias da semana
    $diasSemana = [
        'DOM' => 0,
        'SEG' => 0,
        'TER' => 0,
        'QUA' => 0,
        'QUI' => 0,
        'SEX' => 0,
        'SAB' => 0
    ];

    // Consulta para contar o total de ingressos por dia da semana
    $query = "
        SELECT
            CASE 
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Sunday' THEN 'DOM'
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Monday' THEN 'SEG'
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Tuesday' THEN 'TER'
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Wednesday' THEN 'QUA'
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Thursday' THEN 'QUI'
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Friday' THEN 'SEX'
                WHEN DAYNAME(STR_TO_DATE(t.tourDate, '%Y-%m-%d')) = 'Saturday' THEN 'SAB'
            END AS dia_semana,
            SUM(CAST(IFNULL(t.paxAdult, 0) AS UNSIGNED) + 
                CAST(IFNULL(t.paxHalf, 0) AS UNSIGNED) + 
                CAST(IFNULL(t.paxFree, 0) AS UNSIGNED) +
                CAST(IFNULL(t.paxNet, 0) AS UNSIGNED)) AS total_pax
        FROM tour t
        $where
        GROUP BY dia_semana
        ORDER BY 
            CASE dia_semana
                WHEN 'DOM' THEN 1
                WHEN 'SEG' THEN 2
                WHEN 'TER' THEN 3
                WHEN 'QUA' THEN 4
                WHEN 'QUI' THEN 5
                WHEN 'SEX' THEN 6
                WHEN 'SAB' THEN 7
            END
    ";

    $debug['query'] = $query;

    $result = mysqli_query($mysqli, $query);
    if (!$result) {
        throw new Exception(mysqli_error($mysqli));
    }

    $res = [];
    $totalGeral = 0;
    
    while ($row = mysqli_fetch_assoc($result)) {
        if (isset($row['dia_semana']) && isset($row['total_pax'])) {
            $res[] = [
                'dia' => $row['dia_semana'],
                'total' => (int)$row['total_pax']
            ];
            $totalGeral += (int)$row['total_pax'];
        }
    }
    
    $debug['totalGeral'] = $totalGeral;

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