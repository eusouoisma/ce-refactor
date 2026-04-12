<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $activity = $data['activity'];
    $hour = $data['hour'];
    $date = $data['date'];
    $language = $data['language'];
    $dayOrderId = $data['dayOrderId'];

    mysqli_begin_transaction($mysqli);

    try {

        $query = "SELECT `originalDayOrder` FROM  `dayOrder` WHERE `id` = '$dayOrderId'";
        $originalDayOrder = mysqli_query($mysqli, $query);
        $originalDayOrder = mysqli_fetch_array($originalDayOrder, MYSQLI_ASSOC)['originalDayOrder']; 

        if(!$originalDayOrder || $originalDayOrder == 0 || $originalDayOrder == '0'){
            $query = "SELECT dayOrderId FROM tour WHERE tourDate = '$date' AND type = 'regular' and dayOrderId != '$dayOrderId'";
            $result = mysqli_query($mysqli, $query);
            if(mysqli_num_rows($result) > 0) {
                $originalDayOrder = mysqli_fetch_array($result, MYSQLI_ASSOC)['dayOrderId'];
            } else {
                $query = "SELECT dayOrderId FROM tour WHERE tourDate = '$date' AND type != 'regular' AND dayOrderId != '$dayOrderId'";
                $result = mysqli_query($mysqli, $query);
                if(mysqli_num_rows($result) > 0) {
                    $originalDayOrder = mysqli_fetch_array($result, MYSQLI_ASSOC)['dayOrderId'];
                } else {
                    mysqli_commit($mysqli);

                    $response = new \stdClass();
                    $response->error = true;
                    $response->message = 'Esse tour já está na ordem do dia principal.';
                    $response->original = $originalDayOrder;
                    $response = json_encode($response, JSON_UNESCAPED_UNICODE);
                    echo $response;

                    return;
                }
            }
        }
        
        
        // $query = "DELETE FROM `dayOrder` WHERE `id` = '$dayOrderId'";
        // $deleteDayOrder = mysqli_query($mysqli, $query);
        // if(!$deleteDayOrder){
        //     throw new Exception(mysqli_error($mysqli));
        // }
        $query = "UPDATE `tour` SET `dayOrderId` = '$originalDayOrder' WHERE tourDate = '$date' AND tourHour = '$hour' AND activity = '$activity' AND language = '$language'"; 
        $update = mysqli_query($mysqli, $query);
        if(!$update){
            throw new Exception(mysqli_error($mysqli));
        }

        mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response->original = $originalDayOrder;
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