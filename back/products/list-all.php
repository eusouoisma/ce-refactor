<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
   
    $query = "SELECT p.id as productId, p.name, p.type, p.category, p.duration, v.id as variantId, v.pricingType, v.priceAdult, v.priceHalf, v.priceNet, v.priceBrazilian, v.priceFree, v.priceGroup, v.paxLimit, v.priceAdultHighSeason, v.priceHalfHighSeason, v.priceNetHighSeason, v.priceFreeHighSeason, v.priceBrazilianHighSeason, v.priceGroupHighSeason FROM product p LEFT JOIN variant v ON p.id = v.productId ORDER BY p.name";
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