<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';
    
    echo "opa";
    
     mysqli_begin_transaction($mysqli);

    try {


    $query = "SELECT * FROM tour WHERE 1";
    $result = mysqli_query($mysqli, $query);
    if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $activity = $row['activity'];
        $id = $row['id'];
        $query = "SELECT * FROM product WHERE name = '$activity'";
        $resultProduct = mysqli_query($mysqli, $query);
        if(!$resultProduct){
            throw new Exception(mysqli_error($mysqli));
        }
        $duration = mysqli_fetch_array($resultProduct, MYSQLI_ASSOC)['duration'];
        
        $queryUpdate = "UPDATE tour SET duration = '$duration' WHERE id = '$id'";
        $resultUpdate = mysqli_query($mysqli, $queryUpdate);
        if(!$resultUpdate){
            throw new Exception(mysqli_error($mysqli));
        }
    }
    
     mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response->data = $rows;
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