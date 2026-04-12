<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $date = $_GET['date'];
    $hour = $_GET['hour'];

    $query = "SELECT client, companionName, companionContact FROM `tour` WHERE `tourDate` = '$date' AND `tourHour` = '$hour' AND `status` != 'Cancelado' AND `canceled` = '0'";
    $result = mysqli_query($mysqli, $query);

    $clients = [];
    while($data = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $client = new \stdClass();
        $client->client = $data['client'];
        $client->companionName = $data['companionName'];
        $client->companionContact = $data['companionContact'];
        $clients[] = $client;
    }

    $response = new \stdClass();
    if($result){
        $response->error = false;
        $response->clients = $clients;
    } else {
       $response->error = true;
    }

    $response = json_encode($response, JSON_UNESCAPED_UNICODE);

    echo $response;

?>