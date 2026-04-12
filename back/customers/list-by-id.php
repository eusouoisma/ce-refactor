<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $customer_id = $_GET['customer_id'];
   
    $query = "SELECT *, customers.id as customerId FROM customers INNER JOIN customerContacts ON customers.id = customerContacts.customerId WHERE customerContacts.deleted = '0' AND customers.id = '$customer_id'";
    
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