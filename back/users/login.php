<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    function token($tamanho=10, $id="", $up=false) {
        $characters = $id.'abcdefghijklmnopqrstuvwxyz0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $tamanho; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        if($up === true) {
          return strtoupper($id.$randomString);
        } else {
          return $id.$randomString;
        }
    }

    $data = json_decode(file_get_contents('php://input'), true);
        
    $username = $data['username'];
    $password = $data['password'];  

    $query = "SELECT username, id, password, permissions FROM users WHERE `username` = '$username' AND `deleted` = 0";
    $result = mysqli_query($mysqli, $query);
    $user =  mysqli_fetch_array($result, MYSQLI_ASSOC);

    if(mysqli_num_rows($result) == 0 || !password_verify($password, $user['password'])){
        $response = new \stdClass();
        $response->error = "Username or password is wrong";
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);

        echo $response;
        return;
    } else {
        $userId = $user['id'];
        $token = token(40);

        //Delete all tokens for the user if exists
        $query = "DELETE FROM `tokens` WHERE userId = '$userId'";
        $result = mysqli_query($mysqli, $query);

        //Create a token for the user
        $query = "INSERT INTO `tokens`(`userId`, `token`) VALUES ('$userId','$token')";
        $result = mysqli_query($mysqli, $query);

        if($result){
            $response = new \stdClass();
            $response->error = false;
            $response->token = $token;
            $response->permissions = $user['permissions'];
            $response = json_encode($response, JSON_UNESCAPED_UNICODE);

            echo $response;
        } else {
            $response = new \stdClass();
            $response->error = "Something went wrong";
            $response = json_encode($response, JSON_UNESCAPED_UNICODE);

            echo $response;
        }
        return;
    }
?>