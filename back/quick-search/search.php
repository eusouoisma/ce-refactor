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
    $reservas = [];
    $clientes = [];

    if (!empty($reserva)) {
        $query = "
            SELECT DISTINCT 
                orderRef as value,
                orderRef as label
            FROM tour
            WHERE orderRef LIKE ?
            AND status = 'Confirmado'
            AND canceled = 0
            ORDER BY orderRef ASC
            LIMIT 10
        ";

        $stmt = mysqli_prepare($mysqli, $query);
        if (!$stmt) {
            throw new Exception("Erro ao preparar query de reservas: " . mysqli_error($mysqli));
        }

        $searchReserva = "%{$reserva}%";
        mysqli_stmt_bind_param($stmt, "s", $searchReserva);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Erro ao executar query de reservas: " . mysqli_stmt_error($stmt));
        }

        $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) {
            $reservas[] = $row;
        }
    }

    if (!empty($cliente)) {
        $query = "
            SELECT DISTINCT 
                client as value,
                client as label
            FROM tour
            WHERE LOWER(client) LIKE LOWER(?)
            AND status = 'Confirmado'
            AND canceled = 0
            ORDER BY client ASC
            LIMIT 10
        ";

        $stmt = mysqli_prepare($mysqli, $query);
        if (!$stmt) {
            throw new Exception("Erro ao preparar query de clientes: " . mysqli_error($mysqli));
        }

        $searchCliente = "%{$cliente}%";
        mysqli_stmt_bind_param($stmt, "s", $searchCliente);
        
        if (!mysqli_stmt_execute($stmt)) {
            throw new Exception("Erro ao executar query de clientes: " . mysqli_stmt_error($stmt));
        }

        $result = mysqli_stmt_get_result($stmt);
        while ($row = mysqli_fetch_assoc($result)) {
            $clientes[] = $row;
        }
    }

    mysqli_commit($mysqli);
    echo json_encode([
        'reservas' => $reservas,
        'clientes' => $clientes
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    mysqli_rollback($mysqli);
    error_log("Erro na busca rápida: " . $e->getMessage());
    echo json_encode([
        'error' => true, 
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ], JSON_UNESCAPED_UNICODE);
}
?> 