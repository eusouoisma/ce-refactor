<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $comission_id = $_GET['comission_id'];
   
    $query = "SELECT * FROM comissions WHERE id = '$comission_id' ";
      
    $result = mysqli_query($mysqli, $query);
    $data = mysqli_fetch_array($result, MYSQLI_ASSOC);

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($data, JSON_UNESCAPED_UNICODE);

    echo $response;

?>