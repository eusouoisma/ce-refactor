<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $type = $data['type'];
    $orderRef = $data['orderRef']; 
    $platform = $data['platform']; 
    $tourDate = $data['tourDate']; 
    $tourHour = $data['tourHour']; 
    $activity = $data['activity']; 
    $duration = $data['duration'];
    $local = $data['local']; 
    $language = $data['language']; 
    $client = $data['client'];
    $newCustomerType = $data['newCustomerType'];
    $status = $data['status']; 
    $paxAdult = $data['paxAdult']; 
    $paxHalf = $data['paxHalf']; 
    $paxFree = $data['paxFree']; 
    $paxNet = $data['paxNet']; 
    $paxBrazilian = $data['paxBrazilian'];
    $currency = $data['currency']; 
    $paymentMethod = $data['paymentMethod']; 
    $paymentStatus = $data['paymentStatus']; 
    $totalValue = $data['totalValue']; 
    $numberOfGroups = $data['numberOfGroups'];
    $ceGuide = $data['ceGuide'];
    $ceGuide = implode(",",$ceGuide);
    $clientName = $data['clientName']; 
    $clientContact = $data['clientContact']; 
    $country = $data['country']; 
    $emailSubject = $data['emailSubject']; 
    $companionName = $data['companionName']; 
    $companionContact = $data['companionContact']; 
    $isHighSeason = $data['isHighSeason'] ? '1' : '0';
    $adicional = $data['adicional'] ?? '';
    $commissioned = $data['commissioned'] ? '1' : '0';
    $comissionersName = $data['comissionersName'];
    $comissionersContact = $data['comissionersContact'];
    $comissionCurrency = $data['comissionCurrency'];
    $comissionPrice = $data['comissionPrice'];
    $comissionPaid = $data['comissionPaid'] ? '1' : '0';
    $comments = $data['comments']; 
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
            $dayOrderId = mysqli_insert_id($mysqli);
        } else {
            $query = "SELECT id FROM dayOrder WHERE `date` = '$tourDate' AND `name` = 'Tour Principal'";
            $result = mysqli_query($mysqli, $query);
            $dayOrderId = "";
            if(mysqli_num_rows($result) > 0) {
                $dayOrderId = mysqli_fetch_array($result, MYSQLI_ASSOC)['id'];
            } else {
                $dayofweek = date('w', strtotime($tourDate));
                $query = "INSERT INTO `dayOrder` (`date`, `name`, `weekDay`,`comments`) VALUES ('$tourDate','Tour Principal','$dayofweek','')";
                $dayOrder = mysqli_query($mysqli, $query);
                $dayOrderId = mysqli_insert_id($mysqli);
            }
        }       
        
        $query = "INSERT INTO `tour`(`type`, `orderRef`, `platform`, `activity`, `adicional`, `duration`, `tourDate`, `tourHour`, `local`, `status`, `language`, `client`, `paxAdult`, `paxHalf`, `paxFree`, `paxNet`, `paxBrazilian`, `currency`, `paymentMethod`, `totalValue`, `numberOfGroups`, `ceGuide`, `clientName`, `clientContact`, `country`, `emailSubject`, `companionName`, `companionContact`, `commissioned`, `comments`,`conversationHistory`,`paymentStatus`,`financialComments`,`year`,`dateOfRegistration`,`createdBy`,`lastEditBy`, `origin`, `dayOrderId`, `isHighSeason`) VALUES ('$type','$orderRef','$platform','$activity','$adicional','$duration','$tourDate','$tourHour','$local','$status','$language','$client','$paxAdult','$paxHalf','$paxFree','$paxNet','$paxBrazilian','$currency','$paymentMethod','$totalValue','$numberOfGroups','$ceGuide','$clientName','$clientContact','$country','$emailSubject','$companionName','$companionContact','$commissioned','$comments','$conversationHistory','$paymentStatus','','$currentYear','$dateOfRegistration','$createdBy','$lastEditBy','office','$dayOrderId','$isHighSeason')";
        $result = mysqli_query($mysqli, $query);
        $id = mysqli_insert_id($mysqli);

        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        if($commissioned == "1"){
            $query = "INSERT INTO `comissions`(`tourId`,`orderRef`, `comissionersName`, `comissionersContact`, `comissionCurrency`, `comissionPrice`, `comissionPaid`, `createdBy`, `lastEditBy`, `year`,`dateOfRegistration`) VALUES ('$id','$orderRef','$comissionersName','$comissionersContact','$comissionCurrency','$comissionPrice','$comissionPaid', '$createdBy', '$lastEditBy', '$currentYear', '$dateOfRegistration')";
            $result = mysqli_query($mysqli, $query);
        }

        //Check if customer exists in customer list. If not exists, insert then
        $query = "SELECT * FROM `customers` WHERE `customerName` = '$client' ";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        if(mysqli_num_rows($result) < 1){
            $query = "INSERT INTO `customers`(`customerName`, `customerType`, `createdBy`, `lastEditBy`) VALUES ('$client','$newCustomerType','$createdBy','$lastEditBy')";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
            $customerId = mysqli_insert_id($mysqli);
            $query = "INSERT INTO `customerContacts`(`customerId`, `contactName`, `contactContact`,`contactOffice`, `contactEmail`, `createdBy`, `lastEditBy`) VALUES ('$customerId','$clientName','','','$clientContact','$createdBy','$lastEditBy')";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
        } else {
            $customerId = mysqli_fetch_array($result, MYSQLI_ASSOC)['id'];
            //Check if contact name exists in contact list
            $query = "SELECT * FROM `customers` INNER JOIN `customerContacts` ON `customers`.`id` = `customerContacts`.`customerId` WHERE `customers`.`customerName` = '$client' AND `customerContacts`.`contactName` = '$clientName'";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
            if(mysqli_num_rows($result) < 1){
                $query = "INSERT INTO `customerContacts`(`customerId`, `contactName`, `contactContact`, `contactOffice`, `contactEmail`, `createdBy`, `lastEditBy`) VALUES ('$customerId','$clientName','','','$clientContact','$createdBy','$lastEditBy')";
                $result = mysqli_query($mysqli, $query);
                if(!$result){
                    throw new Exception(mysqli_error($mysqli));
                }
            }
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