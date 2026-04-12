<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $type = $data['type'];
    $company = $data['company'];
    $invoiceNumber = $data['invoiceNumber'];
    $status = $data['status'];
    $paymentStatus = $data['paymentStatus'];
    $accountNumber = $data['accountNumber'];
    $paymentDate = $data['paymentDate'];
    $tourDate = $data['tourDate'];
    $tourHour = $data['tourHour'];
    $activity = $data['activity'];
    $client = $data['client'];
    $clientName = $data['clientName'];
    $clientContact = $data['clientContact'];
    $orderRef = $data['orderRef'];
    $paymentMethod = $data['paymentMethod'];
    $currency = $data['currency'];
    $totalValue = $data['totalValue'];
    $netValue = $data['netValue'];
    $financialComments = $data['financialComments'];
    $commissioned = $data['commissioned'] ? '1' : '0';
    $isHighSeason = $data['isHighSeason'] ? '1' : '0';
    $adicional = $data['adicional'] ?? '';
    $dateOfRegistration = $data['dateOfRegistration'];
    $createdBy = $data['createdBy'];
    $lastEditBy = $data['lastEditBy'];
    $conversationHistory = $data['conversationHistory'];

    if($orderRef == ""){
        include '../order-ref/create.php';
        $orderRef = 'CE'.$newOrderRef;
    }
    
    
    try {
        
    //Teste para remover depois
    if(false){
            $dayofweek = date('w', strtotime($tourDate));
            $query = "INSERT INTO `dayOrder` (`date`, `name`, `weekDay`,`comments`) VALUES ('$tourDate','$activity','$dayofweek','')";
            $dayOrder = mysqli_query($mysqli, $query);
            if(!$dayOrder){
                throw new Exception(mysqli_error($mysqli));
            }
            $dayOrderId = mysqli_insert_id($mysqli);
    } else {
        $query = "SELECT id FROM dayOrder WHERE `date` = '$tourDate' AND `name` = 'Tour Principal'";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        $dayOrderId = "";
        if(mysqli_num_rows($result) > 0) {
            $dayOrderId = mysqli_fetch_array($result, MYSQLI_ASSOC)['id'];
        } else {
            $dayofweek = date('w', strtotime($tourDate));
            $query = "INSERT INTO `dayOrder` (`date`, `name`, `weekDay`,`comments`) VALUES ('$tourDate','Tour Principal','$dayofweek','')";
            $dayOrder = mysqli_query($mysqli, $query);
            if(!$dayOrder){
                throw new Exception(mysqli_error($mysqli));
            }
            $dayOrderId = mysqli_insert_id($mysqli);
        }
    }       
    
    
    $query = "INSERT INTO `tour`(`type`, `orderRef`, `activity`, `adicional`, `isHighSeason`, `tourDate`, `tourHour`, `status`, `currency`, `paymentMethod`, `totalValue`,`client`, `clientName`, `clientContact`,`commissioned`, `company`, `invoiceNumber`, `paymentStatus`, `accountNumber`, `paymentDate`, `netValue`, `financialComments`, `conversationHistory`, `year`, `dateOfRegistration`,`createdBy`,`lastEditBy`,`origin`,`dayOrderId`) VALUES ('$type','$orderRef','$activity','$adicional','$isHighSeason','$tourDate','$tourHour','$status','$currency','$paymentMethod','$totalValue','$client','$clientName','$clientContact','$commissioned','$company','$invoiceNumber','$paymentStatus','$accountNumber','$paymentDate','$netValue','$financialComments','$conversationHistory','$currentYear','$dateOfRegistration','$createdBy','$lastEditBy','financial','$dayOrderId')";
    $result = mysqli_query($mysqli, $query);
    if(!$result){
        throw new Exception(mysqli_error($mysqli));
    }

    $response = new \stdClass();
    $response->error = false;

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);
    echo $response;

    } catch(Exception $e) {
        $response = new \stdClass();
        $response->error = true;
        $response->message = $e->getMessage();
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    }

    

?>