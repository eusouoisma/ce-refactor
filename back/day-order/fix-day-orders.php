<?php
return;
// Configuração do banco de dados
$host = 'localhost';
$dbname = 'u658162899_sistemace';
$user = 'u658162899_sistemace';
$pass = ';8jA|mXn';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Buscar tours sem dayOrderId a partir de 1º de março de 2025
    $query = "SELECT t.* FROM tour t LEFT JOIN dayOrder d ON t.dayOrderId = d.id WHERE d.id IS NULL AND t.tourDate >= '2025-02-01' ORDER BY t.tourDate ASC";
    $stmt = $pdo->query($query);
    $tours = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($tours)) {
        echo "\n\nNenhum tour encontrado com dayOrderId NULL a partir de 2025-03-01.\n\n";
    }

    // Cache para armazenar os DayOrders criados e reutilizá-los
    $createdDayOrders = [];

    foreach ($tours as $tour) {
        $tourId = $tour['id'];
        $tourDate = $tour['tourDate'];
        $originalDayOrderId = $tour['dayOrderId'];

        echo "\n====================================================\n";
        echo "Tour ID: $tourId\n";
        echo "Data: $tourDate\n";
        echo "Original DayOrderId: " . ($originalDayOrderId ?? 'NULL') . "\n\n";

        // Verificar se já existe um DayOrder criado nesta execução para essa data
        if (isset($createdDayOrders[$tourDate])) {
            $newDayOrderId = $createdDayOrders[$tourDate];
            echo "→ Usando o DayOrder recém-criado com ID $newDayOrderId para o Tour ID $tourId\n";
        } else {
            // Verificar se já existe um DayOrder no banco para essa data chamado 'Tour Principal'
            $checkDayOrderQuery = "SELECT id FROM dayOrder WHERE date = :date AND name = 'Tour Principal'";
            $checkStmt = $pdo->prepare($checkDayOrderQuery);
            $checkStmt->execute(['date' => $tourDate]);
            $existingDayOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if ($existingDayOrder) {
                $newDayOrderId = $existingDayOrder['id'];
                echo "✅ Atualizando o Tour ID $tourId para usar o DayOrder existente com ID $newDayOrderId\n";
            } else {
                // Criar um novo DayOrder e usar o originalDayOrderId se disponível
                $newDayOrderId = $originalDayOrderId ?: null;

                // Inserir um novo DayOrder no banco
                $insertDayOrderQuery = "INSERT INTO dayOrder (date, name, weekDay, comments, passed, autoInserted, originalDayOrder, lastEditBy) 
                                        VALUES (:date, 'Tour Principal', 'N/A', 'Criado automaticamente', 0, 1, :originalDayOrder, 'Sistema')";
                $insertStmt = $pdo->prepare($insertDayOrderQuery);
                $insertStmt->execute([
                    'date' => $tourDate,
                    'originalDayOrder' => $newDayOrderId
                ]);

                // Pegar o ID recém-criado
                $newDayOrderId = $pdo->lastInsertId();
                echo "⚠️ Criado um novo DayOrder com ID $newDayOrderId para a data $tourDate\n";

                // Armazena no cache para reutilização
                $createdDayOrders[$tourDate] = $newDayOrderId;
            }
        }

        // Atualizar o Tour com o novo DayOrderId
        $updateTourQuery = "UPDATE tour SET dayOrderId = :dayOrderId WHERE id = :tourId";
        $updateStmt = $pdo->prepare($updateTourQuery);
        $updateStmt->execute([
            'dayOrderId' => $newDayOrderId,
            'tourId' => $tourId
        ]);

        echo "✅ Tour ID $tourId atualizado para usar o DayOrder ID $newDayOrderId\n";
        echo "====================================================\n\n";
    }

} catch (PDOException $e) {
    echo "\n\n❌ Erro de conexão ou SQL: " . $e->getMessage() . "\n\n";
}
?>
