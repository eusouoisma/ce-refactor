<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $dayOrderId =  $data['dayOrderId'];
    $editedBy = $data['editedBy'];
    $employee = $data['employee'];

    $func = $employee['function'];
    $name = $employee['name'];
    $phone = $employee['phone'];

    $query = "UPDATE `dayOrder` SET `lastEditBy` = '$editedBy' WHERE `id` = '$dayOrderId'";
    $result = mysqli_query($mysqli, $query);
   
    $query = "INSERT INTO `dayOrderEmployee`(`dayOrderId`, `function`, `name`, `prevision`, `arrival`, `departure`, `phone`, `comments`) VALUES ('$dayOrderId','$func','$name','','','','$phone','')";
    $result = mysqli_query($mysqli, $query);

    $response = new \stdClass();
    if($result){
        $response->error = false;
        $response->data = mysqli_insert_id($mysqli);
    } else {
       $response->error = true;
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>