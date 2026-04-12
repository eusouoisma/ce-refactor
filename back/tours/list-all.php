<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $months = $_GET['months'];
    $months = explode(",",$months);
    $months =  "'" . implode("','", $months) . "'";

    $year = $_GET['year'];

    $query = "SELECT tour.*, IF(`tour`.`type` = 'regular', `numberOfGroups`.`groups`, `tour`.`numberOfGroups`) as groups, DATE_FORMAT(dateOfRegistration, '%d/%m/%Y') as dateOfRegistrationFormated, DATE_FORMAT(tourDate, '%d/%m/%Y') as formatedTourDate, DATE_FORMAT(paymentDate, '%d/%m/%Y') as formatedPaymentDate FROM tour LEFT JOIN numberOfGroups ON numberOfGroups.date = tour.tourDate AND numberOfGroups.hour = tour.tourHour AND numberOfGroups.activity = tour.activity WHERE year = $currentYear AND MONTH(tourDate) in($months) AND YEAR(tourDate) = '$year' AND canceled = '0' AND origin = 'office' ORDER BY `tour`.`tourDate` ASC, tourHour ASC";
    $result = mysqli_query($mysqli, $query);
    $rows = [];
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        //Check if tour have change requests
        $tour_id = $row['id'];
        $query = "SELECT * FROM changeRequests WHERE tourId = '$tour_id' ";
        $resultCR = mysqli_query($mysqli, $query);
        if(mysqli_num_rows($resultCR) > 0) $row['haveChangeRequests'] = true;
        else $row['haveChangeRequests'] = false;

        //Check if tour is comissioned
        $query = "SELECT * FROM comissions WHERE tourId = '$tour_id' AND deleted = '0'";
        $resultCM = mysqli_query($mysqli, $query);
        if(mysqli_num_rows($resultCM) > 0) $row['comissioned'] = true;
        else $row['comissioned'] = false;
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