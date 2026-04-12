<?php
header('Access-Control-Allow-Origin: *');

include '../connection.php';
include '../currentYear.php';

$id = $_GET['id'];

$data = json_decode(file_get_contents('php://input'), true);

// Função para escapar todas as variáveis
function escape_variables($conn, $data) {
    foreach ($data as $key => $value) {
        if (is_array($value)) {
            $data[$key] = escape_variables($conn, $value); // Recursivamente escapa arrays
        } else {
            $data[$key] = mysqli_real_escape_string($conn, $value);
        }
    }
    return $data;
}

// Escapando variáveis
$data = escape_variables($mysqli, $data);

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
$status = $data['status']; 
$paxAdult = $data['paxAdult']; 
$paxHalf = $data['paxHalf']; 
$paxFree = $data['paxFree']; 
$paxNet = $data['paxNet']; 
$paxBrazilian = $data['paxBrazilian'];
$currency = $data['currency']; 
$paymentMethod = $data['paymentMethod']; 
$totalValue = $data['totalValue']; 
$numberOfGroups = $data['numberOfGroups'];
$ceGuide = implode(",", $data['ceGuide']); 
$clientName = $data['clientName']; 
$clientContact = $data['clientContact']; 
$country = $data['country']; 
$emailSubject = $data['emailSubject']; 
$companionName = $data['companionName']; 
$companionContact = $data['companionContact']; 
$comments = $data['comments']; 
$commissioned = $data['commissioned'] ? '1' : '0';
$isHighSeason = $data['isHighSeason'] ? '1' : '0';
$adicional = $data['adicional'] ?? '';
$commissionId = $data['commissionId'];
$comissionersName = $data['comissionersName'];
$comissionersContact = $data['comissionersContact'];
$comissionCurrency = $data['comissionCurrency'];
$comissionPrice = $data['comissionPrice'];
$comissionPaid = $data['comissionPaid'] ? '1' : '0';
$comissionByPercentage = $data['comissionByPercentage'];
$comissionPercentage = $data['comissionPercentage'];
$changeRequests = escape_variables($mysqli, $data['changeRequests']);
$lastEditBy = $data['lastEditBy'];
$dateOfRegistration = $data['dateOfRegistration'];
$conversationHistory = $data['conversationHistory'];

try {
    // Check if tourDate changed
    $query = "SELECT tourDate, dayOrderId FROM `tour` WHERE id = '$id'";
    $result = mysqli_query($mysqli, $query);
    $tour = mysqli_fetch_array($result, MYSQLI_ASSOC);
    $currentTourDate = $tour['tourDate'];
    $currentDayOrderId = $tour['dayOrderId'];

    if ($tourDate != $currentTourDate) {
        // Update DayOrderId
        // Check if exists a day order to this tour. If yes, update the dayOrderId, if not, create a day order, and update the dayOrderId
        $query = "SELECT dayOrderId FROM tour WHERE tourDate = '$tourDate' AND type = 'regular'";
        $result = mysqli_query($mysqli, $query);
        $dayOrderId = "";
        if (mysqli_num_rows($result) > 0) {
            $dayOrderId = mysqli_fetch_array($result, MYSQLI_ASSOC)['dayOrderId'];
        } else {
            $query = "SELECT dayOrderId FROM tour WHERE tourDate = '$tourDate'";
            $result = mysqli_query($mysqli, $query);
            if (mysqli_num_rows($result) > 0) {
                $dayOrderId = mysqli_fetch_array($result, MYSQLI_ASSOC)['dayOrderId'];
            } else {
                $dayofweek = date('w', strtotime($tourDate));
                $query = "INSERT INTO `dayOrder` (`date`, `name`, `weekDay`,`comments`) VALUES ('$tourDate','Tour Principal','$dayofweek','')";
                $dayOrder = mysqli_query($mysqli, $query);
                $dayOrderId = mysqli_insert_id($mysqli);
            }
        }
    } else {
        $dayOrderId = $currentDayOrderId;
    }
    
    // Função para verificar se é um tour regular e se a data ainda não passou
    function isTourRegularAndDateNotPassed($type, $tourDate) {
        if ($type !== "regular") return false;
        
        // Definir timezone para São Paulo (Brasil)
        date_default_timezone_set('America/Sao_Paulo');
        $today = date('Y-m-d');
        
        return $tourDate >= $today;
    }
    
    // Determina se deve incluir totalValue e paymentMethod no UPDATE principal
    $includeFinancialFields = isTourRegularAndDateNotPassed($type, $tourDate);
    
    if ($includeFinancialFields) {
        // Para tours regulares que ainda não passaram, inclui totalValue e paymentMethod no UPDATE
        $query = "UPDATE `tour` SET `type`='$type',`orderRef`='$orderRef',`platform`='$platform',`activity`='$activity',`adicional`='$adicional',`duration`='$duration',`tourDate`='$tourDate',`tourHour`='$tourHour',`local`='$local',`status`='$status',`language`='$language',`paxAdult`='$paxAdult',`paxHalf`='$paxHalf',`paxFree`='$paxFree',`paxNet`='$paxNet',`paxBrazilian`='$paxBrazilian',`numberOfGroups`='$numberOfGroups',`ceGuide`='$ceGuide',`client`='$client',`clientName`='$clientName',`clientContact`='$clientContact',`country`='$country',`emailSubject`='$emailSubject',`companionName`='$companionName',`companionContact`='$companionContact',`commissioned`='$commissioned',`comments`='$comments', `conversationHistory`='$conversationHistory', `lastEditBy` = '$lastEditBy', `dayOrderId` = '$dayOrderId', `currency`='$currency', `paymentMethod`='$paymentMethod', `totalValue`='$totalValue', `isHighSeason`='$isHighSeason' WHERE `id` = '$id'";
    } else {
        // Para outros casos, exclui os campos financeiros do UPDATE principal
        $query = "UPDATE `tour` SET `type`='$type',`orderRef`='$orderRef',`platform`='$platform',`activity`='$activity',`adicional`='$adicional',`duration`='$duration',`tourDate`='$tourDate',`tourHour`='$tourHour',`local`='$local',`status`='$status',`language`='$language',`paxAdult`='$paxAdult',`paxHalf`='$paxHalf',`paxFree`='$paxFree',`paxNet`='$paxNet',`paxBrazilian`='$paxBrazilian',`numberOfGroups`='$numberOfGroups',`ceGuide`='$ceGuide',`client`='$client',`clientName`='$clientName',`clientContact`='$clientContact',`country`='$country',`emailSubject`='$emailSubject',`companionName`='$companionName',`companionContact`='$companionContact',`commissioned`='$commissioned',`comments`='$comments', `conversationHistory`='$conversationHistory', `lastEditBy` = '$lastEditBy', `dayOrderId` = '$dayOrderId', `isHighSeason`='$isHighSeason' WHERE `id` = '$id'";
    }
    
    $result = mysqli_query($mysqli, $query);
    if (!$result) {
        throw new Exception(mysqli_error($mysqli));
    }

    $query = "DELETE FROM `changeRequests` WHERE tourId = '$id'";
    $result = mysqli_query($mysqli, $query);

    foreach ($changeRequests as $changeRequest) {
        $type = $changeRequest['type'];
        $name = $changeRequest['name'];
        $oldValue = $changeRequest['oldValue'];
        $newValue = $changeRequest['newValue'];
        $tourId = $id;
        $createdBy = $lastEditBy;

        $query = "INSERT INTO `changeRequests`(`type`, `name`, `oldValue`, `newValue`, `tourId`, `createdBy`) VALUES ('$type','$name','$oldValue','$newValue','$tourId','$createdBy')";
        $result = mysqli_query($mysqli, $query);
        if (!$result) {
            throw new Exception(mysqli_error($mysqli));
        }
    }
    
    if ($commissioned == "1") {
        $query = "SELECT id FROM `comissions` WHERE id = '$commissionId'";
        $result = mysqli_query($mysqli, $query);
        if (mysqli_num_rows($result) == 0) {
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

} catch (Exception $e) {
    mysqli_rollback($mysqli);
    $response = new \stdClass();
    $response->error = true;
    $response->message = $e->getMessage();
    $response = json_encode($response, JSON_UNESCAPED_UNICODE);
    echo $response;
}
?>
