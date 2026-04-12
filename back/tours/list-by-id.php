<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $tour_id = $_GET['tour_id'];
   
    $query = "SELECT tour.*, comissions.id as commissionId, comissions.comissionersName, comissions.comissionersContact, comissions.comissionCurrency, comissions.comissionPrice, comissions.comissionPaid FROM tour LEFT JOIN comissions ON tour.id = comissions.tourId AND comissions.deleted = 0 WHERE tour.id = '$tour_id' ";
      
    $result = mysqli_query($mysqli, $query);
    $data = mysqli_fetch_array($result, MYSQLI_ASSOC);

    //Get Change Requests
    $query = "SELECT * FROM changeRequests WHERE tourId = '$tour_id' ";
    $result = mysqli_query($mysqli, $query);
    $rows = [];
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $rows[] = $row;
    }

    $data['changeRequests'] = $rows;

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($data, JSON_UNESCAPED_UNICODE);

    echo $response;

?>