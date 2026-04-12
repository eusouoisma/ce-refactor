<?php

    return;

    header('Access-Control-Allow-Origin: *');

    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);

    include '../connection.php';

    mysqli_begin_transaction($mysqli);

    try {

        $query = "SELECT DISTINCT tourDate FROM tour WHERE year(tourDate) >= '2024'";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            $date = $row['tourDate'];
            $dayofweek = date('w', strtotime($date));
            $query = "INSERT INTO `dayOrder` (`date`, `weekDay`,`comments`) VALUES ('$date','$dayofweek','')";
            $dayOrder = mysqli_query($mysqli, $query);
            if(!$dayOrder){
                throw new Exception(mysqli_error($mysqli));
            }
            $id = mysqli_insert_id($mysqli);
            $query = "UPDATE `tour` SET `dayOrderId` = '$id' WHERE tourDate = '$date'";
            $update = mysqli_query($mysqli, $query);
            if(!$update){
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
