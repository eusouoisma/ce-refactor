<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'];
    $type = $data['type'];
    $date = $data['date'];
    $hour = $data['hour'];
    $activity = $data['activity'];
    $groups = $data['groups'];

    mysqli_begin_transaction($mysqli);

    try {
        if($type == 'regular'){
            $query = "DELETE FROM `numberOfGroups` WHERE `date` = '$date' AND `hour` = '$hour' AND `activity` = '$activity'";
            $result = mysqli_query($mysqli, $query);
            
            $query = "INSERT INTO `numberOfGroups`(`date`, `hour`, `activity`, `groups`) VALUES ('$date','$hour','$activity','$groups')";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
        }
        else {
            $query = "UPDATE `tour` SET `numberOfGroups` = '$groups' WHERE `id` = '$id'";
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