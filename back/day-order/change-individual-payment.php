<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $paymentId =  $data['paymentId'];
    $paymentNewValue = $data['paymentNewValue'];
    
    mysqli_begin_transaction($mysqli);


    try {
        $query = "UPDATE `dayOrderPayments` SET `value`='$paymentNewValue' WHERE `id`='$paymentId'";
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