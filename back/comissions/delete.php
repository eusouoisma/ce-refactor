<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $id = $_GET['id'];
    
    $query = "SELECT tourId FROM comissions WHERE id = '$id' ";
    $result = mysqli_query($mysqli, $query);
    $tourId = mysqli_fetch_array($result, MYSQLI_ASSOC)['tourId'];
     
    $query = "UPDATE comissions SET deleted = 1 WHERE id = '$id' ";
    $result = mysqli_query($mysqli, $query);
    
    $query = "UPDATE tour SET commissioned = 0 WHERE id = '$tourId' ";
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