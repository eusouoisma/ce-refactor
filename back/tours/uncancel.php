<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $id = $_GET['id'];

    $data = json_decode(file_get_contents('php://input'), true);
    $lastEditBy = $data['lastEditBy'];
     
    $query = "UPDATE tour SET canceled = 0, lastEditBy = '$lastEditBy' WHERE id = '$id' ";
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