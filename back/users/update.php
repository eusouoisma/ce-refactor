<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);
        
    $username = $data['username'];
    $name = $data['name'];
    $token = $data['token'];
    $password = $data['password'];
    $passwordCript = password_hash($password, PASSWORD_DEFAULT);  

    //Get user id with this token
    $query = "SELECT userId FROM `tokens` WHERE token = '$token'";
    $result = mysqli_query($mysqli, $query);
    $userId = mysqli_fetch_array($result, MYSQLI_ASSOC)['userId'];

    if($password != ""){
         //Update user
        $query = "UPDATE `users` SET `username`='$username',`name`='$name',`password`='$passwordCript' WHERE id='$userId'";
        $result = mysqli_query($mysqli, $query);
    } else {
         //Update user
        $query = "UPDATE `users` SET `username`='$username',`name`='$name' WHERE id='$userId'";
        $result = mysqli_query($mysqli, $query);
    }

   

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
        $response->error = "Something went wrong";
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>