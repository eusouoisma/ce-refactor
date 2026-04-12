<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
   
    $query = "SELECT value FROM `settings` WHERE `type` = 'CurrentYear'";
    $result = mysqli_query($mysqli, $query);
    $row = mysqli_fetch_array($result, MYSQLI_ASSOC);

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($row['value'], JSON_UNESCAPED_UNICODE);

    echo $response;

?>