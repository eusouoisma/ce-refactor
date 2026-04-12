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
    $where = "WHERE t.status = 'Confirmado' AND t.canceled = 0 AND t.activity = 'Regular'";

    if ($startDate && $endDate) {
        $where .= " AND STR_TO_DATE(t.tourDate, '%Y-%m-%d') BETWEEN '$startDate' AND '$endDate'";
    }

    // Consulta para lista completa de tours regulares
    $query = "
        SELECT 
            t.id,
            t.activity,
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

    $debugLogs[] = "Executando consulta: $query";

    $result = mysqli_query($mysqli, $query);
    if (!$result) {
        throw new Exception(mysqli_error($mysqli));
    }

    // Consulta para obter o produto e suas variantes
    $productQuery = "
        SELECT p.id, p.name, v.priceAdult, v.priceHalf, v.priceFree, v.priceNet
        FROM product p
        JOIN variant v ON p.id = v.productId
        WHERE p.name = 'Regular' OR p.type = 'Regular'
        AND v.pricingType = 'default'
        LIMIT 1
    ";
    
    $productResult = mysqli_query($mysqli, $productQuery);
    $productInfo = null;
    
    if ($productResult && mysqli_num_rows($productResult) > 0) {
        $productInfo = mysqli_fetch_assoc($productResult);
        $debugLogs[] = "Preços base encontrados para o tour Regular: Adulto=R$".$productInfo['priceAdult'].
                        ", Meia=R$".$productInfo['priceHalf'].
                        ", Cortesia=R$".$productInfo['priceFree'].
                        ", Net=R$".$productInfo['priceNet'];
    } else {
        $debugLogs[] = "Nenhum produto/variante 'Regular' encontrado no banco de dados.";
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
    
    $tours = [];
    $tourCount = 0;

    // Processar cada tour e calcular valores
    while ($row = mysqli_fetch_assoc($result)) {
        $tourCount++;
        $tours[] = $row;
        
        $tourId = $row['id'];
        $currentPaxAdult = (int)$row['paxAdult'];
        $currentPaxHalf = (int)$row['paxHalf'];
        $currentPaxFree = (int)$row['paxFree'];
        $currentPaxNet = (int)$row['paxNet'];
        $currentTotalValue = (float)$row['totalValue'];
        
        $paxAdult += $currentPaxAdult;
        $paxHalf += $currentPaxHalf;
        $paxFree += $currentPaxFree;
        $paxNet += $currentPaxNet;
        $totalValue += $currentTotalValue;
        
        // Calcular valores baseados nos preços de referência se disponíveis
        if ($productInfo) {
            $currentValorAdult = $currentPaxAdult * (float)$productInfo['priceAdult'];
            $currentValorHalf = $currentPaxHalf * (float)$productInfo['priceHalf'];
            $currentValorFree = $currentPaxFree * (float)$productInfo['priceFree'];
            $currentValorNet = $currentPaxNet * (float)$productInfo['priceNet'];
            
            $valorAdult += $currentValorAdult;
            $valorHalf += $currentValorHalf;
            $valorFree += $currentValorFree;
            $valorNet += $currentValorNet;
            
            $debugLogs[] = "Tour #$tourId - Calculado: Adulto=$currentPaxAdult→R$".number_format($currentValorAdult, 2).
                             ", Meia=$currentPaxHalf→R$".number_format($currentValorHalf, 2).
                             ", Cortesia=$currentPaxFree→R$".number_format($currentValorFree, 2).
                             ", Net=$currentPaxNet→R$".number_format($currentValorNet, 2).
                             ", Total Calculado=R$".number_format($currentValorAdult+$currentValorHalf+$currentValorFree+$currentValorNet, 2).
                             " vs Total Armazenado=R$".number_format($currentTotalValue, 2);
        }
    }
    
    $debugLogs[] = "Total de tours encontrados: $tourCount";
    $debugLogs[] = "Total Pessoas: Adulto=$paxAdult, Meia=$paxHalf, Cortesia=$paxFree, Net=$paxNet, Total=".($paxAdult+$paxHalf+$paxFree+$paxNet);
    
    $totalPax = $paxAdult + $paxHalf + $paxFree + $paxNet;
    $totalValorCalculado = $valorAdult + $valorHalf + $valorFree + $valorNet;
    
    $debugLogs[] = "Valor Total Armazenado: R$".number_format($totalValue, 2);
    $debugLogs[] = "Valor Total Calculado: R$".number_format($totalValorCalculado, 2);
    
    // Se há discrepância entre o valor calculado e o valor armazenado
    if (abs($totalValorCalculado - $totalValue) > 1 && $totalValorCalculado > 0) {
        $fatorAjuste = $totalValue / $totalValorCalculado;
        $debugLogs[] = "Discrepância detectada! Aplicando fator de ajuste: $fatorAjuste";
        
        $valorAdult *= $fatorAjuste;
        $valorHalf *= $fatorAjuste;
        $valorFree *= $fatorAjuste;
        $valorNet *= $fatorAjuste;
        
        $debugLogs[] = "Valores ajustados: Adulto=R$".number_format($valorAdult, 2).
                         ", Meia=R$".number_format($valorHalf, 2).
                         ", Cortesia=R$".number_format($valorFree, 2).
                         ", Net=R$".number_format($valorNet, 2);
    }
    
    // Se não conseguirmos calcular valores baseados nos preços ou se o valor total for zero
    if ($totalValorCalculado == 0 && $totalValue > 0 && $totalPax > 0) {
        $debugLogs[] = "Não foi possível calcular valores por tipo. Usando distribuição proporcional.";
        
        // Calcular valores por tipo de pax (distribuição proporcional do valor total)
        // Para paxFree (cortesia), o valor será 0
        $valorFree = 0;
        
        // Calcular total de pax que pagam (excluindo cortesia)
        $totalPaxPagantes = $paxAdult + $paxHalf + $paxNet;
        
        // Se não houver pax pagantes, os valores serão 0
        if ($totalPaxPagantes > 0) {
            // Assumindo que Adulto paga 100%, Meia paga 50% e Net tem valor específico
            $paxAdultEquivalente = $paxAdult;
            $paxHalfEquivalente = $paxHalf * 0.5; // Meia entrada = metade do valor
            $paxNetEquivalente = $paxNet * 0.7;   // Net = 70% do valor (ajuste conforme regra do negócio)
            
            $totalPaxEquivalente = $paxAdultEquivalente + $paxHalfEquivalente + $paxNetEquivalente;
            
            if ($totalPaxEquivalente > 0) {
                $valorUnitarioBase = $totalValue / $totalPaxEquivalente;
                
                $valorAdult = $valorUnitarioBase * $paxAdultEquivalente;
                $valorHalf = $valorUnitarioBase * $paxHalfEquivalente;
                $valorNet = $valorUnitarioBase * $paxNetEquivalente;
                
                $debugLogs[] = "Distribuição proporcional: Base unitária=R$".number_format($valorUnitarioBase, 2).
                                 ", Adulto=R$".number_format($valorAdult, 2).
                                 ", Meia=R$".number_format($valorHalf, 2).
                                 ", Cortesia=R$0.00, Net=R$".number_format($valorNet, 2);
            } else {
                // Caso excepcional se o cálculo de equivalentes resultar em 0
                $valorAdult = $totalValue * ($paxAdult / $totalPaxPagantes);
                $valorHalf = $totalValue * ($paxHalf / $totalPaxPagantes);
                $valorNet = $totalValue * ($paxNet / $totalPaxPagantes);
                
                $debugLogs[] = "Distribuição simples proporcional ao número de pax: ".
                                 "Adulto=R$".number_format($valorAdult, 2).
                                 ", Meia=R$".number_format($valorHalf, 2).
                                 ", Cortesia=R$0.00, Net=R$".number_format($valorNet, 2);
            }
        } else {
            $valorAdult = 0;
            $valorHalf = 0;
            $valorNet = 0;
            $debugLogs[] = "Nenhum pax pagante encontrado.";
        }
    }
    
    // Calcular percentuais de pax
    $percentAdult = $totalPax > 0 ? ($paxAdult / $totalPax) * 100 : 0;
    $percentHalf = $totalPax > 0 ? ($paxHalf / $totalPax) * 100 : 0;
    $percentFree = $totalPax > 0 ? ($paxFree / $totalPax) * 100 : 0;
    $percentNet = $totalPax > 0 ? ($paxNet / $totalPax) * 100 : 0;
    
    $debugLogs[] = "Percentuais de pax: Adulto=".number_format($percentAdult, 2).
                     "%, Meia=".number_format($percentHalf, 2).
                     "%, Cortesia=".number_format($percentFree, 2).
                     "%, Net=".number_format($percentNet, 2)."%";
    
    // Calcular percentuais de valor
    $percentValorAdult = $totalValue > 0 ? ($valorAdult / $totalValue) * 100 : 0;
    $percentValorHalf = $totalValue > 0 ? ($valorHalf / $totalValue) * 100 : 0;
    $percentValorFree = $totalValue > 0 ? ($valorFree / $totalValue) * 100 : 0;
    $percentValorNet = $totalValue > 0 ? ($valorNet / $totalValue) * 100 : 0;
    
    $debugLogs[] = "Percentuais de valor: Adulto=".number_format($percentValorAdult, 2).
                     "%, Meia=".number_format($percentValorHalf, 2).
                     "%, Cortesia=".number_format($percentValorFree, 2).
                     "%, Net=".number_format($percentValorNet, 2)."%";
    
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