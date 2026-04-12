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

// Array para armazenar mensagens de log
$debugLogs = [];
$debugLogs[] = "Iniciando análise de tours regulares para o período de $startDate a $endDate";

mysqli_begin_transaction($mysqli);

try {
    // Consultar os preços do tour Regular do banco de dados
    $priceQuery = "
        SELECT p.id, p.name, v.priceAdult, v.priceHalf, v.priceFree, v.priceNet
        FROM product p
        JOIN variant v ON p.id = v.productId
        WHERE (p.name = 'Regular' OR p.type = 'Regular')
        AND v.pricingType = 'person'
        LIMIT 1
    ";
    
    $priceResult = mysqli_query($mysqli, $priceQuery);
    if (!$priceResult || mysqli_num_rows($priceResult) == 0) {
        throw new Exception("Não foi possível encontrar os preços do tour Regular");
    }
    
    $priceInfo = mysqli_fetch_assoc($priceResult);
    $PRECO_ADULTO = (float)$priceInfo['priceAdult'];
    $PRECO_MEIA = (float)$priceInfo['priceHalf'];
    $PRECO_CORTESIA = (float)$priceInfo['priceFree'];
    $PRECO_NET = (float)$priceInfo['priceNet'];
    
    $debugLogs[] = "Preços consultados do banco: Adulto=R$" . $PRECO_ADULTO .
                   ", Meia=R$" . $PRECO_MEIA .
                   ", Cortesia=R$" . $PRECO_CORTESIA .
                   ", Net=R$" . $PRECO_NET;

    $where = "WHERE t.status = 'Confirmado' AND t.canceled = 0 AND t.activity = 'Regular'";

    if ($startDate && $endDate) {
        $where .= " AND STR_TO_DATE(t.tourDate, '%Y-%m-%d') BETWEEN '$startDate' AND '$endDate'";
    }

    // Consulta para lista completa de tours regulares
    $query = "
        SELECT 
            t.id,
            t.activity,
            t.orderRef,
            t.paxAdult,
            t.paxHalf,
            t.paxFree,
            t.paxNet,
            t.totalValue,
            t.tourDate
        FROM 
            tour t
        $where
        ORDER BY t.tourDate
    ";

    $debugLogs[] = "Executando consulta de tours: $query";

    $result = mysqli_query($mysqli, $query);
    if (!$result) {
        throw new Exception(mysqli_error($mysqli));
    }

    // Inicializar contadores
    $paxAdult = 0;
    $paxHalf = 0;
    $paxFree = 0;
    $paxNet = 0;
    $valorAdult = 0;
    $valorHalf = 0;
    $valorFree = 0;
    $valorNet = 0;
    $totalValue = 0;
    $calculatedTotalValue = 0;
    
    $tours = [];
    $tourCount = 0;
    $toursWithMissingValue = 0;

    // Processar cada tour e calcular valores
    while ($row = mysqli_fetch_assoc($result)) {
        $tourCount++;
        $tours[] = $row;
        
        $tourId = $row['id'];
        $tourRef = $row['orderRef'] ?? 'N/A';
        
        // Tratar valores nulos ou vazios
        $currentPaxAdult = !empty($row['paxAdult']) ? (int)$row['paxAdult'] : 0;
        $currentPaxHalf = !empty($row['paxHalf']) ? (int)$row['paxHalf'] : 0;
        $currentPaxFree = !empty($row['paxFree']) ? (int)$row['paxFree'] : 0;
        $currentPaxNet = !empty($row['paxNet']) ? (int)$row['paxNet'] : 0;
        $currentTotalValue = !empty($row['totalValue']) ? (float)$row['totalValue'] : null;
        
        // Calcular valores baseados nos preços consultados
        $currentValorAdult = $currentPaxAdult * $PRECO_ADULTO;
        $currentValorHalf = $currentPaxHalf * $PRECO_MEIA;
        $currentValorFree = $currentPaxFree * $PRECO_CORTESIA; // Geralmente zero
        $currentValorNet = $currentPaxNet * $PRECO_NET;
        
        // Calcular o valor total baseado nos preços
        $currentCalculatedValue = $currentValorAdult + $currentValorHalf + $currentValorFree + $currentValorNet;
        
        // Acumular contadores
        $paxAdult += $currentPaxAdult;
        $paxHalf += $currentPaxHalf;
        $paxFree += $currentPaxFree;
        $paxNet += $currentPaxNet;
        $valorAdult += $currentValorAdult;
        $valorHalf += $currentValorHalf;
        $valorFree += $currentValorFree;
        $valorNet += $currentValorNet;
        $calculatedTotalValue += $currentCalculatedValue;
        
        // Se o totalValue do tour estiver vazio, usar o valor calculado
        if ($currentTotalValue === null || $currentTotalValue === 0) {
            $toursWithMissingValue++;
            $totalValue += $currentCalculatedValue;
            $debugLogs[] = "Tour #$tourId (Ref: $tourRef) - Valor armazenado vazio, usando calculado: R$" . number_format($currentCalculatedValue, 2);
        } else {
            $totalValue += $currentTotalValue;
            
            // Verificar discrepância entre valor calculado e armazenado
            $discrepancy = abs($currentCalculatedValue - $currentTotalValue);
            if ($discrepancy > 1) {
                $debugLogs[] = "Tour #$tourId (Ref: $tourRef) - Discrepância: Calculado=R$" . number_format($currentCalculatedValue, 2) . 
                                " vs Armazenado=R$" . number_format($currentTotalValue, 2) . 
                                " (diferença de R$" . number_format($discrepancy, 2) . ")";
            }
        }
    }
    
    $totalPax = $paxAdult + $paxHalf + $paxFree + $paxNet;
    
    $debugLogs[] = "Total de tours encontrados: $tourCount";
    $debugLogs[] = "Tours com valor vazio/nulo: $toursWithMissingValue";
    $debugLogs[] = "Total Pessoas: Adulto=$paxAdult, Meia=$paxHalf, Cortesia=$paxFree, Net=$paxNet, Total=$totalPax";
    $debugLogs[] = "Valor Total Armazenado: R$" . number_format($totalValue, 2);
    $debugLogs[] = "Valor Total Calculado: R$" . number_format($calculatedTotalValue, 2);
    
    // Se há discrepância significativa entre o valor total calculado e o armazenado
    if (abs($calculatedTotalValue - $totalValue) > 10 && $calculatedTotalValue > 0) {
        $fatorAjuste = $totalValue / $calculatedTotalValue;
        $debugLogs[] = "Discrepância total detectada! Aplicando fator de ajuste: " . number_format($fatorAjuste, 4);
        
        $valorAdult *= $fatorAjuste;
        $valorHalf *= $fatorAjuste;
        $valorFree *= $fatorAjuste;
        $valorNet *= $fatorAjuste;
        
        $debugLogs[] = "Valores ajustados: Adulto=R$" . number_format($valorAdult, 2) . 
                         ", Meia=R$" . number_format($valorHalf, 2) . 
                         ", Cortesia=R$" . number_format($valorFree, 2) . 
                         ", Net=R$" . number_format($valorNet, 2);
    }
    
    // Calcular percentuais de pax
    $percentAdult = $totalPax > 0 ? ($paxAdult / $totalPax) * 100 : 0;
    $percentHalf = $totalPax > 0 ? ($paxHalf / $totalPax) * 100 : 0;
    $percentFree = $totalPax > 0 ? ($paxFree / $totalPax) * 100 : 0;
    $percentNet = $totalPax > 0 ? ($paxNet / $totalPax) * 100 : 0;
    
    $debugLogs[] = "Percentuais de pax: Adulto=" . number_format($percentAdult, 2) . 
                     "%, Meia=" . number_format($percentHalf, 2) . 
                     "%, Cortesia=" . number_format($percentFree, 2) . 
                     "%, Net=" . number_format($percentNet, 2) . "%";
    
    // Calcular percentuais de valor
    $percentValorAdult = $totalValue > 0 ? ($valorAdult / $totalValue) * 100 : 0;
    $percentValorHalf = $totalValue > 0 ? ($valorHalf / $totalValue) * 100 : 0;
    $percentValorFree = $totalValue > 0 ? ($valorFree / $totalValue) * 100 : 0;
    $percentValorNet = $totalValue > 0 ? ($valorNet / $totalValue) * 100 : 0;
    
    $debugLogs[] = "Percentuais de valor: Adulto=" . number_format($percentValorAdult, 2) . 
                     "%, Meia=" . number_format($percentValorHalf, 2) . 
                     "%, Cortesia=" . number_format($percentValorFree, 2) . 
                     "%, Net=" . number_format($percentValorNet, 2) . "%";
    
    $response = [
        'paxAdult' => $paxAdult,
        'paxHalf' => $paxHalf,
        'paxFree' => $paxFree,
        'paxNet' => $paxNet,
        'totalPax' => $totalPax,
        'percentAdult' => $percentAdult,
        'percentHalf' => $percentHalf,
        'percentFree' => $percentFree,
        'percentNet' => $percentNet,
        'valorAdult' => $valorAdult,
        'valorHalf' => $valorHalf,
        'valorFree' => $valorFree,
        'valorNet' => $valorNet,
        'totalValor' => $totalValue,
        'percentValorAdult' => $percentValorAdult,
        'percentValorHalf' => $percentValorHalf,
        'percentValorFree' => $percentValorFree,
        'percentValorNet' => $percentValorNet,
        'debug' => $debugLogs
    ];

    mysqli_commit($mysqli);
    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    mysqli_rollback($mysqli);
    echo json_encode([
        'error' => true, 
        'message' => $e->getMessage(),
        'debug' => $debugLogs
    ], JSON_UNESCAPED_UNICODE);
}
?> 