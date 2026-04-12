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
    $lastEditBy = $data['editedBy'];

    mysqli_begin_transaction($mysqli);

    try {

        $dayofweek = date('w', strtotime($date));
        $query = "INSERT INTO `dayOrder` (`date`, `name`, `weekDay`,`comments`,`originalDayOrder`,`lastEditBy`) VALUES ('$date','$activity','$dayofweek','','$dayOrderId','$lastEditBy')";
        $dayOrder = mysqli_query($mysqli, $query);
        if(!$dayOrder){
            throw new Exception(mysqli_error($mysqli));
        }
        $id = mysqli_insert_id($mysqli);
        $query = "UPDATE `tour` SET `dayOrderId` = '$id' WHERE tourDate = '$date' AND tourHour = '$hour' AND activity = '$activity' AND language = '$language'"; 
        $update = mysqli_query($mysqli, $query);
        if(!$update){
            throw new Exception(mysqli_error($mysqli));
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