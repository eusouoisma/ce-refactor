<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
   
    $query = "SELECT DISTINCT `customers`.id, customerName FROM `customers` INNER JOIN `customerContacts` ON `customers`.id = `customerContacts`.`customerId` WHERE customerContacts.deleted = '0'";
    $result = mysqli_query($mysqli, $query);
    $customers = [];
    while($customer = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $customerId = $customer['id'];
        $queryCustomer = "SELECT * FROM customerContacts WHERE customerId = $customerId AND deleted = '0' ";
        $resultCustomer = mysqli_query($mysqli, $queryCustomer);
        $customerContacts = [];
        while($customerContact = mysqli_fetch_array($resultCustomer, MYSQLI_ASSOC)) {
            $customerContacts[] = $customerContact;
        }
        $customerData = new \stdClass();
        $customerData -> name = $customer['customerName'];
        $customerData -> contacts = $customerContacts;
        $customers[] = $customerData;
    }

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($customers, JSON_UNESCAPED_UNICODE);

    echo $response;

?>