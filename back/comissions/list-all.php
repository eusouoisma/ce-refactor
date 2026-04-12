<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $months = $_GET['months'];
    $months = explode(",",$months);
    $months =  "'" . implode("','", $months) . "'";

    $year = $_GET['year'];
   
    $query = "SELECT comissions.*, DATE_FORMAT(tour.tourDate, '%d/%m/%Y') as tourDateFormated FROM `comissions` INNER JOIN tour ON comissions.tourId = tour.id WHERE tour.canceled = '0' AND comissions.deleted = '0' AND tour.year = $currentYear AND MONTH(tour.tourDate) in($months) AND YEAR(tour.tourDate) = '$year'";
    $result = mysqli_query($mysqli, $query);
    $rows = [];
    while($row = $data = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
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