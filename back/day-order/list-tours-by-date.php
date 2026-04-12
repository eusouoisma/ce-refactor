<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $date = $_GET['date'];

    mysqli_begin_transaction($mysqli);

    try {
   
        $query = "SELECT tourDate, tourHour, type, activity, language, SUM(paxAdult + paxHalf + paxNet + paxFree) as paxTotal FROM `tour` WHERE tourDate = '$date' GROUP BY tourDate, tourHour, activity, language ORDER BY tourHour";
        $result = mysqli_query($mysqli, $query);

        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        $rows = [];
        while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            $rows[] = $row;
        }

        mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response->data = $rows;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;

    } catch(Exception $e) {
        mysqli_rollback($mysqli);
        $response = new \stdClass();
        $response->message = $e->getMessage();
        $response->error = true;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    }


?>