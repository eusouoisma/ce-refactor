<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    mysqli_begin_transaction($mysqli);

    try {

    $id = $_GET['id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $lastEditBy = $data['lastEditBy'];
     
    $query = "UPDATE tour SET lateCheck = 1, lastEditBy = '$lastEditBy' WHERE id = '$id' ";
    $result = mysqli_query($mysqli, $query);

    if(!$result){
        throw new Exception(mysqli_error($mysqli));
    }

    mysqli_commit($mysqli);

    $response = new \stdClass();
    $response->error = false;
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