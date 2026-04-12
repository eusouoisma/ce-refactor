<?php
    date_default_timezone_set('America/Sao_Paulo');
    header('Access-Control-Allow-Origin: *');
    include '../connection.php';
        
    $token = $_GET['token'];

    mysqli_begin_transaction($mysqli);

    try {
   
        $query = "SELECT username, name, permissions, creationDate, userId FROM `users` INNER JOIN `tokens` ON `users`.id = `tokens`.`userId` WHERE `tokens`.`token` = '$token'";  
        $result = mysqli_query($mysqli, $query);

        $response = new \stdClass();
        if(mysqli_num_rows($result) > 0){

            $user = mysqli_fetch_array($result, MYSQLI_ASSOC);
            $creationTime = strtotime($user['creationDate']);
            $userId = $user['userId'];

            $currTime = strtotime("now");
            $gap = $currTime - $creationTime;
            if($gap > 14400){
                $query = "DELETE FROM `tokens` WHERE userId = '$userId'";
                $result = mysqli_query($mysqli, $query);
                $response->error = true;
                $response = json_encode($response, JSON_UNESCAPED_UNICODE);
            } else {
                $newCurrTime = date("Y-m-d H:i:s");
                $query = "UPDATE `tokens` SET `creationDate` = '$newCurrTime' WHERE userId = '$userId'";
                $result = mysqli_query($mysqli, $query);
                $response = json_encode($user, JSON_UNESCAPED_UNICODE);
            }
            mysqli_commit($mysqli);
            echo $response;

        } else {
            throw new Exception(mysqli_error($mysqli));
        }
    }  catch(Exception $e) {
        mysqli_rollback($mysqli);
        $response = new \stdClass();
        $response->message = $e->getMessage();
        $response->error = true;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    }

?>