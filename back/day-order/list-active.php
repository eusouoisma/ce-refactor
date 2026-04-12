<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
    mysqli_begin_transaction($mysqli);

    try {
        // Filtrar apenas dayOrders válidas
        $query = "
            SELECT 
                do.*, 
                DATE_FORMAT(do.date, '%d/%m/%Y') as formatedDate 
            FROM 
                dayOrder do
            WHERE 
                EXISTS (
                    SELECT 1 
                    FROM tour 
                    WHERE 
                        tour.dayOrderId = do.id 
                        AND tour.tourHour != '' 
                        AND tour.status NOT IN ('Cancelado', 'Bloqueio') 
                        AND tour.canceled = 0
                )
            ORDER BY 
                do.date ASC
        ";

        $result = mysqli_query($mysqli, $query);
        if (!$result) {
            throw new Exception(mysqli_error($mysqli));
        }

        $rows = [];
        while ($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
            $rows[] = $row;
        }

        mysqli_commit($mysqli);
        $response = json_encode($rows, JSON_UNESCAPED_UNICODE);
        
        echo $response;

    } catch (Exception $e) {
        mysqli_rollback($mysqli);
        $response = new \stdClass();
        $response->message = $e->getMessage();
        $response->error = true;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    }
?>
