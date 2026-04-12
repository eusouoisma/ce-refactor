<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $ids = $_GET['ids']; // IDs separados por vírgula (ex: "1,2,3,4")

    $data = json_decode(file_get_contents('php://input'), true);
    $cancelReason = $data['cancelReason'];
    $lastEditBy = $data['lastEditBy'];
    
    // Converter string de IDs em array
    $idArray = explode(',', $ids);
    
    // Remover espaços em branco e filtrar IDs vazios
    $idArray = array_filter(array_map('trim', $idArray));
    
    $response = new \stdClass();
    
    if (empty($idArray)) {
        $response->error = true;
        $response->message = "Nenhum ID válido fornecido";
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Construir a query para atualizar múltiplas tours
    $placeholders = implode(',', array_fill(0, count($idArray), '?'));
    $query = "UPDATE tour SET canceled = 1, cancelReason = ?, lastEditBy = ? WHERE id IN ($placeholders)";
    
    // Preparar statement para evitar SQL injection
    $stmt = mysqli_prepare($mysqli, $query);
    
    if ($stmt) {
        // Criar array de parâmetros: cancelReason, lastEditBy + todos os IDs
        $params = array_merge([$cancelReason, $lastEditBy], $idArray);
        
        // Criar string de tipos ('ss' + 'i' para cada ID)
        $types = 'ss' . str_repeat('i', count($idArray));
        
        mysqli_stmt_bind_param($stmt, $types, ...$params);
        
        if (mysqli_stmt_execute($stmt)) {
            $affectedRows = mysqli_stmt_affected_rows($stmt);
            $response->error = false;
            $response->message = "Tours canceladas com sucesso";
            $response->affectedRows = $affectedRows;
            $response->canceledIds = $idArray;
        } else {
            $response->error = true;
            $response->message = "Erro ao cancelar tours: " . mysqli_stmt_error($stmt);
        }
        
        mysqli_stmt_close($stmt);
    } else {
        $response->error = true;
        $response->message = "Erro ao preparar statement: " . mysqli_error($mysqli);
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>
