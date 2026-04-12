<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $function =  $data['function'];
    $type =  $data['type'];
    $name =  $data['name'];
    $phone =  $data['phone'];

    //Check if already exists a employee with this name and function
    $query = "SELECT * FROM `dayOrderEmployeesList` WHERE `name` = '$name' AND `function` = '$function'";
    $result = mysqli_query($mysqli, $query);
    if(mysqli_num_rows($result) != 0){
        $response = new \stdClass();
        $response->error = true;
        $response->message = "Já existe um colaborador cadastrado com esse nome e função.";
    
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
    
        echo $response;

        return;
    }
   
    $query = "INSERT INTO `dayOrderEmployeesList`(`name`, `function`, `phone`, `type`) VALUES ('$name','$function','$phone','$type')";
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