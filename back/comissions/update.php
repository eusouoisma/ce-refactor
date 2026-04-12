<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $_GET['id'];

    $orderRef = $data['orderRef'];
    $comissionersName = $data['comissionersName'];
    $comissionersContact = $data['comissionersContact'];
    $comissionCurrency = $data['comissionCurrency'];
    $comissionPrice = $data['comissionPrice'];
    $comissionPaid = $data['comissionPaid'] ? '1' : '0';
    $lastEditBy = $data['lastEditBy'];

    $query = "UPDATE `comissions` SET `orderRef`='$orderRef',`comissionersName`='$comissionersName',`comissionersContact`='$comissionersContact',`comissionCurrency`='$comissionCurrency',`comissionPrice`='$comissionPrice',`comissionPaid`='$comissionPaid',`lastEditBy` = '$lastEditBy' WHERE id = '$id'";
    
    $result = mysqli_query($mysqli, $query);

    $response = new \stdClass();
    if($result){
        $response->error = false;
    } else {
       $response->error = true;
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>