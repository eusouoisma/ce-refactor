<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $tour_id = $_GET['tour_id'];
   
    $query = "SELECT * FROM changeRequests WHERE tourId = '$tour_id' ";
      
    $result = mysqli_query($mysqli, $query);
    $rows = [];
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $rows[] = $row;
    }

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($rows, JSON_UNESCAPED_UNICODE);

    echo $response;

?>