<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $months = $_GET['months'];
    $months = explode(",",$months);
    $months =  "'" . implode("','", $months) . "'";

    $year = $_GET['year'];

    $query = "SELECT *, `dayOrderPayments`.`id` AS paymentId, DATE_FORMAT(date, '%d/%m/%Y') as formatedDate, DATE_FORMAT(paymentDate, '%d/%m/%Y') as paymentDateFormated,  `dayOrderPayments`.`comments` as 'paymentComments' FROM `dayOrderPayments` INNER JOIN `dayOrder` ON `dayOrderPayments`.`dayOrderId` = `dayOrder`.`id` INNER JOIN `dayOrderEmployeesFunctions` ON `dayOrderPayments`.`function` = `dayOrderEmployeesFunctions`.`name`  WHERE YEAR(date) = '$year' AND MONTH(date) in($months) ORDER BY `dayOrder`.`date` ASC, `dayOrderEmployeesFunctions`.`orderNumber` ASC, `dayOrderPayments`.`employeeName` ASC";
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