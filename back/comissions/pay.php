<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $_GET['id'];
    $lastEditBy = $_GET['lastEditBy'];

    $query = "UPDATE `comissions` SET `comissionPaid` = '1', `lastEditBy` = '$lastEditBy' WHERE id = '$id'";
    
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