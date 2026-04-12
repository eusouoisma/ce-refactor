<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
   
    $query = "SELECT value FROM `settings` WHERE `type` = 'accountNumber' ORDER BY `value` ASC";
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