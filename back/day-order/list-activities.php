<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
   
    $query = "SELECT * FROM product WHERE 1";
    $result = mysqli_query($mysqli, $query);
    $rows = [];
    while($row = $data = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $rows[] = $row;
    }

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($rows, JSON_UNESCAPED_UNICODE);

    echo $response;

?>