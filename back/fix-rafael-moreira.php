<?php
    header('Access-Control-Allow-Origin: *');

    include 'connection.php';

    mysqli_begin_transaction($mysqli);

    try {

        $query = "SELECT * FROM dayOrder WHERE 1";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        while($dayOrder = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            $dayOrderId = $dayOrder['id'];
            $query = "SELECT * FROM dayOrderEmployee WHERE dayOrderId = '$dayOrderId' AND  function = 'Produção' AND name = 'Rafael Moreira'";
            $result2 = mysqli_query($mysqli, $query);
            if(!$result2){
                throw new Exception(mysqli_error($mysqli));
            }
            if(mysqli_num_rows($result2) == 0){
                $query = "INSERT INTO `dayOrderEmployee`(`dayOrderId`, `function`, `name`, `prevision`, `arrival`, `departure`, `phone`, `comments`) VALUES ('$dayOrderId','Produção','Rafael Moreira','','','','21965179379','')";
                $result3 = mysqli_query($mysqli, $query);
                if(!$result3){
                    throw new Exception(mysqli_error($mysqli));
                }
            }
        }

        mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;

    } catch(Exception $e) {
        $response = new \stdClass();
        $response->error = true;
        $response->message = $e->getMessage();
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    } 
?>