<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $id = $_GET['id'];
     
    $query = "DELETE FROM `dayOrderEmployeesFunctions` WHERE id = '$id' ";
    $result = mysqli_query($mysqli, $query);

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>