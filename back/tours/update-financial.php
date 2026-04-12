<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $id = $_GET['id'];

    $data = json_decode(file_get_contents('php://input'), true);

    $type = mysqli_real_escape_string($mysqli, $data['type']);
    $company = mysqli_real_escape_string($mysqli, $data['company']);
    $invoiceNumber = mysqli_real_escape_string($mysqli, $data['invoiceNumber']);
    $status = mysqli_real_escape_string($mysqli, $data['status']);
    $paymentStatus = mysqli_real_escape_string($mysqli, $data['paymentStatus']);
    $accountNumber = mysqli_real_escape_string($mysqli, $data['accountNumber']);
    $paymentDate = mysqli_real_escape_string($mysqli, $data['paymentDate']);
    $tourDate = mysqli_real_escape_string($mysqli, $data['tourDate']);
    $tourHour = mysqli_real_escape_string($mysqli, $data['tourHour']);
    $activity = mysqli_real_escape_string($mysqli, $data['activity']);
    $platform = mysqli_real_escape_string($mysqli, $data['platform']);
    $client = mysqli_real_escape_string($mysqli, $data['client']);
    $clientName = mysqli_real_escape_string($mysqli, $data['clientName']);
    $clientContact = mysqli_real_escape_string($mysqli, $data['clientContact']);
    $orderRef = mysqli_real_escape_string($mysqli, $data['orderRef']);
    $paymentMethod = mysqli_real_escape_string($mysqli, $data['paymentMethod']);
    $currency = mysqli_real_escape_string($mysqli, $data['currency']);
    $totalValue = mysqli_real_escape_string($mysqli, $data['totalValue']);
    $netValue = mysqli_real_escape_string($mysqli, $data['netValue']);
    $comments = mysqli_real_escape_string($mysqli, $data['comments']);
    $financialComments = mysqli_real_escape_string($mysqli, $data['financialComments']);
    $commissioned = $data['commissioned'] ? '1' : '0';
    $isHighSeason = $data['isHighSeason'] ? '1' : '0';
    $adicional = mysqli_real_escape_string($mysqli, $data['adicional'] ?? '');
    $commissionId = mysqli_real_escape_string($mysqli, $data['commissionId']);
    $comissionersName = mysqli_real_escape_string($mysqli, $data['comissionersName']);
    $comissionersContact = mysqli_real_escape_string($mysqli, $data['comissionersContact']);
    $comissionCurrency = mysqli_real_escape_string($mysqli, $data['comissionCurrency']);
    $comissionPrice = mysqli_real_escape_string($mysqli, $data['comissionPrice']);
    $comissionPaid = $data['comissionPaid'] ? '1' : '0';
    $changeRequests = $data['changeRequests'];
    $lastEditBy = mysqli_real_escape_string($mysqli, $data['lastEditBy']);
    $conversationHistory = mysqli_real_escape_string($mysqli, $data['conversationHistory']);

    try {
    

    //Check if tourDate changed
    $query = "SELECT tourDate, dayOrderId FROM `tour` WHERE id = '$id'";
    $result = mysqli_query($mysqli, $query);
    $tour = mysqli_fetch_array($result, MYSQLI_ASSOC);
    $currentTourDate = $tour['tourDate'];
    $currentDayOrderId = $tour['dayOrderId'];
    if($tourDate != $currentTourDate) {
        //Update DayOrderId
        //Check if exists a day order to this tour. If yes, update the dayOrderId, if not, create a day order, and update the dayOrderId
        $query = "SELECT dayOrderId FROM tour WHERE tourDate = '$tourDate' AND type = 'regular'";
        $result = mysqli_query($mysqli, $query);
        $dayOrderId = "";
        if(mysqli_num_rows($result) > 0) {
            $dayOrderId = mysqli_fetch_array($result, MYSQLI_ASSOC)['dayOrderId'];
        } else {
            $dayofweek = date('w', strtotime($tourDate));
            $query = "INSERT INTO `dayOrder` (`date`, `name`, `weekDay`,`comments`) VALUES ('$tourDate','Tour Principal','$dayofweek','')";
            $dayOrder = mysqli_query($mysqli, $query);
            $dayOrderId = mysqli_insert_id($mysqli);
        }
    } else {
        $dayOrderId = $currentDayOrderId;
    }

    $query = "UPDATE `tour` SET `type`='$type',`orderRef`='$orderRef',`activity`='$activity',`adicional`='$adicional',`isHighSeason`='$isHighSeason',`tourDate`='$tourDate',`tourHour`='$tourHour',`status`='$status',`currency`='$currency',`paymentMethod`='$paymentMethod',`totalValue`='$totalValue',`platform`='$platform',`client`='$client',`clientName`='$clientName',`clientContact`='$clientContact',`commissioned`='$commissioned',`company`='$company',`invoiceNumber`='$invoiceNumber',`paymentStatus`='$paymentStatus',`accountNumber`='$accountNumber',`paymentDate`='$paymentDate',`netValue`='$netValue',`financialComments`='$financialComments',`comments`='$comments',`conversationHistory`='$conversationHistory',`lastEditBy` = '$lastEditBy', `dayOrderId` = '$dayOrderId' WHERE `id` = '$id'";
    $result = mysqli_query($mysqli, $query);
    if(!$result){
        throw new Exception(mysqli_error($mysqli));
    }

    foreach($changeRequests as $changeRequest) {
        $approve = $changeRequest['approve'];
        $reprove = $changeRequest['reprove'];
        $type = $changeRequest['type'];
        $newValue = $changeRequest['newValue'];
        $tourId = $changeRequest['tourId'];
        $id = $changeRequest['id'];

        if($approve){
            $query = "UPDATE `tour` SET `$type`='$newValue' WHERE id = '$tourId'";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
            $query = "DELETE FROM `changeRequests` WHERE id = '$id'";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
        } if ($reprove) {
            $query = "DELETE FROM `changeRequests` WHERE id = '$id'";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
        }
    }
    
    if($commissioned == "1"){
        $query = "SELECT id FROM `comissions` WHERE id = '$commissionId'";
        $result = mysqli_query($mysqli,$query);
        if(mysqli_num_rows($result) == 0){
             $query = "INSERT INTO `comissions`(`tourId`,`orderRef`, `comissionersName`, `comissionersContact`, `comissionCurrency`, `comissionPrice`, `comissionPaid`, `createdBy`, `lastEditBy`, `year`,`dateOfRegistration`) VALUES ('$id','$orderRef','$comissionersName','$comissionersContact','$comissionCurrency','$comissionPrice','$comissionPaid', '$lastEditBy', '$lastEditBy', '$currentYear', '$dateOfRegistration')";
             $result = mysqli_query($mysqli, $query);
        } else {
            $query = "UPDATE `comissions` SET `comissionersName`='$comissionersName',`comissionersContact`='$comissionersContact',`comissionCurrency`='$comissionCurrency',`comissionPrice`='$comissionPrice',`comissionPaid`='$comissionPaid',`lastEditBy`='$lastEditBy' WHERE id = '$commissionId'";
             $result = mysqli_query($mysqli, $query);
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
        $response->error = true;
        $response->message = $e->getMessage();
        $response = json_encode($response, JSON_UNESCAPED_UNICODE);
        echo $response;
    }
?>