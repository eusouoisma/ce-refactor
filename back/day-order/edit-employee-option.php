<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $function =  $data['function'];
    $type =  $data['type'];
    $name =  $data['name'];
    $phone =  $data['phone'];
    $id = $data['id'];
   
    $query = "UPDATE `dayOrderEmployeesList` SET `name`='$name',`function`='$function',`phone`='$phone',`type`='$type' WHERE `id`='$id'";
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