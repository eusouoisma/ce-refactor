<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);
        
    $username = $data['username'];
    $name = $data['name'];
    $permissions = $data['permissions'];
    $password = $data['password'];
    $password = password_hash($password, PASSWORD_DEFAULT);  

    //Check if existis a user with the shame username
    $query = "SELECT username FROM users WHERE username = '$username'";
    $result = mysqli_query($mysqli, $query);
    $count = mysqli_num_rows($result);
    if($count > 0) {
        $response = new \stdClass();
        $response->error = "A user with that username already exists";
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);

        echo $response;
        return;
    }

    $query = "INSERT INTO `users`(`username`, `name`, `permissions`, `password`) VALUES ('$username','$name','$permissions','$password')";
    $result = mysqli_query($mysqli, $query);

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
        $response->error = "Something went wrong";
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>