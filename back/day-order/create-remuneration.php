<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $functionId =  $data['functionId'];
    $paymentType = $data['paymentType'];
    $activity = $data['activity'];
    $hourlyValue1 = $data['hourlyValue1'];
    $hourlyValue2 = $data['hourlyValue2'];
    $hourlyValue3 = $data['hourlyValue3'];

    mysqli_begin_transaction($mysqli);

    try {
   
        $query = "INSERT INTO `dayOrderEmployeesRemunerations`(`functionId`, `paymentType`, `activity`, `hourlyValue1`, `hourlyValue2`, `hourlyValue3`) VALUES ('$functionId','$paymentType','$activity','$hourlyValue1','$hourlyValue2','$hourlyValue3')";
        $result = mysqli_query($mysqli, $query);

        if(!$result){
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