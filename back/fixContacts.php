<?php
return;
// Conexão com o banco de dados
$pdo = new PDO('mysql:host=localhost;dbname=u658162899_sistemace', 'u658162899_sistemace', ';8jA|mXn');

// Passo 1: Consulta para encontrar todas as tours cujo dayOrderId não existe em dayOrder
$sqlTours = "
    SELECT t.*
    FROM tour t
    LEFT JOIN dayOrder d ON t.dayOrderId = d.id
    WHERE d.id IS NULL AND t.dayOrderId != '0' AND t.status != 'Cancelado' AND t.status != 'Bloqueio'
";
$stmtTours = $pdo->query($sqlTours);
$tours = $stmtTours->fetchAll(PDO::FETCH_ASSOC);

// Array para armazenar os dayOrderIds já processados
$processedDayOrders = [];

// Processar cada tour
foreach ($tours as $tour) {
    // Verificar se dayOrder já deveria existir, mas não existe
    $dayOrderId = $tour['dayOrderId'];

    // Verificar se já foi processado
    if (in_array($dayOrderId, $processedDayOrders)) {
        continue; // Pula para a próxima iteração, pois essa dayOrder já foi criada
    }
    

    // Marcar como processado
    $processedDayOrders[] = $dayOrderId;

    // Obter o nome da dayOrder com base nas regras fornecidas
    $sqlCheckRegularTour = "SELECT COUNT(*) as count FROM tour WHERE dayOrderId = :dayOrderId AND type = 'regular'";
    $stmtCheck = $pdo->prepare($sqlCheckRegularTour);
    $stmtCheck->execute(['dayOrderId' => $dayOrderId]);
    $regularCount = $stmtCheck->fetch(PDO::FETCH_ASSOC)['count'];

    // Definir o nome e outros campos para dayOrder
    $dayOrderName = $regularCount > 0 ? 'Tour Principal' : $tour['activity'];
    $dayOrderDate = $tour['tourDate'];
    $weekDay = date('w', strtotime($dayOrderDate)); // 0 é Domingo, 1 é Segunda, etc.

    // Criar a dayOrder com o mesmo id da que deveria existir
    $sqlInsertDayOrder = "
        INSERT INTO dayOrder (`id`, `date`, `name`, `weekDay`, `comments`, `passed`, `autoInserted`, `originalDayOrder`, `lastEditBy`)
        VALUES (:id, :date, :name, :weekDay, '', 0, 1, :originalDayOrder, 'Ismael')
    ";
    $stmtInsertDayOrder = $pdo->prepare($sqlInsertDayOrder);

    // Verificar se é Tour Principal
    $originalDayOrder = ($dayOrderName === 'Tour Principal') ? $tour['id'] : null;

    // Executar a inserção com o mesmo ID
    $stmtInsertDayOrder->execute([
        'id' => $dayOrderId,
        'date' => $dayOrderDate,
        'name' => $dayOrderName,
        'weekDay' => $weekDay,
        'originalDayOrder' => $originalDayOrder
    ]);

    echo "DayOrder ID $dayOrderId criada com sucesso!<br/>";
}

echo "Processo concluído com sucesso!";
?>
