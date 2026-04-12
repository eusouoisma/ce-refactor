<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $customerType = $data['customerType'];
    $customerName = $data['customerName'];
    $createdBy = $data['createdBy'];
    $lastEditBy = $data['lastEditBy'];
    $contacts = $data['contacts'];

    mysqli_begin_transaction($mysqli);

    try {
        $query = "INSERT INTO `customers`(`customerName`, `customerType`, `createdBy`, `lastEditBy`) VALUES ('$customerName','$customerType','$createdBy','$lastEditBy')";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        $id = mysqli_insert_id($mysqli);

        foreach($contacts as $contact) {
            $contactName = $contact['name'];
            $contactContact = $contact['contact'];
            $contactOffice = $contact['office'];
            $contactEmail = $contact['email'];
    
            $query = "INSERT INTO `customerContacts`(`customerId`, `contactName`, `contactContact`, `contactOffice`, `contactEmail`, `createdBy`, `lastEditBy`) VALUES ('$id','$contactName','$contactContact','$contactOffice','$contactEmail','$createdBy','$lastEditBy')";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
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