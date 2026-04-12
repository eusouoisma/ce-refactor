<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $months = $_GET['months'];
    $months = explode(",",$months);
    $months =  "'" . implode("','", $months) . "'";

    $year = $_GET['year'];

    $query = "SELECT *, DATE_FORMAT(dateOfRegistration, '%d/%m/%Y') as dateOfRegistrationFormated, DATE_FORMAT(tourDate, '%d/%m/%Y') as formatedTourDate, DATE_FORMAT(paymentDate, '%d/%m/%Y') as formatedPaymentDate FROM tour WHERE year = $currentYear AND MONTH(tourDate) in($months) AND YEAR(tourDate) = '$year' AND canceled = '1' ORDER BY `tour`.`tourDate` ASC, tourHour ASC";
    $result = mysqli_query($mysqli, $query);
    $rows = [];
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        //Check if tour have change requests
        $tour_id = $row['id'];
        $query = "SELECT * FROM changeRequests WHERE tourId = '$tour_id' ";
        $resultCR = mysqli_query($mysqli, $query);
        if(mysqli_num_rows($resultCR) > 0) $row['haveChangeRequests'] = true;
        else $row['haveChangeRequests'] = false;
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