<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $guides =  $data['guide'];
    $tourHour = $data['tourHour'];
    $activity = $data['activity'];
    $language = $data['language'];
    $dayOrderId = $data['dayOrderId'];
    
    mysqli_begin_transaction($mysqli);


    try {
        $query = "DELETE FROM `dayOrderAssociateGuidesInTours` WHERE `dayOrderId` = '$dayOrderId' AND `tourHour` = '$tourHour' AND `activity` = '$activity' AND `language` = '$language'";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        foreach($guides as $guide){
            $query = "INSERT INTO `dayOrderAssociateGuidesInTours`(`dayOrderId`, `tourHour`, `activity`, `language`, `guide`) VALUES ('$dayOrderId','$tourHour','$activity','$language','$guide')";
            $result = mysqli_query($mysqli, $query);

            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
        }
        
        mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;

    } catch(Exception $e) {
        mysqli_rollback($mysqli);
        $response = new \stdClass();
        $response->message = $e->getMessage();
        $response->error = true;
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    }

?>