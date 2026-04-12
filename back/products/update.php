<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $type = $data['type'];
    $category = $data['category'] ?? 'atividade';
    $productName = $data['productName'];
    $duration = $data['duration'];
    $variants = $data['variants'];    
    $productId = $data['productId'];
    $lastEditBy = $data['lastEditBy'];
    
    
    mysqli_begin_transaction($mysqli);

    try {
        $query = "UPDATE `product` SET `type`='$type',`category`='$category',`name`='$productName',`duration`='$duration' WHERE id = '$productId'";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        $query = "DELETE FROM `variant` WHERE productId = '$productId'";
        $result = mysqli_query($mysqli, $query);

        foreach($variants as $variant) {
            $pricingType = $variant['pricingType'];
            $priceAdult = $variant['priceAdult'];
            $priceHalf = $variant['priceHalf'];
            $priceNet = $variant['priceNet'];
            $priceBrazilian = $variant['priceBrazilian'];
            $priceFree = $variant['priceFree'];
            $priceGroup = $variant['priceGroup'];
            $paxLimit = $variant['paxLimit'];
            $priceAdultHighSeason = isset($variant['priceAdultHighSeason']) ? $variant['priceAdultHighSeason'] : 0;
            $priceHalfHighSeason = isset($variant['priceHalfHighSeason']) ? $variant['priceHalfHighSeason'] : 0;
            $priceNetHighSeason = isset($variant['priceNetHighSeason']) ? $variant['priceNetHighSeason'] : 0;
            $priceFreeHighSeason = isset($variant['priceFreeHighSeason']) ? $variant['priceFreeHighSeason'] : 0;
            $priceBrazilianHighSeason = isset($variant['priceBrazilianHighSeason']) ? $variant['priceBrazilianHighSeason'] : 0;
            $priceGroupHighSeason = isset($variant['priceGroupHighSeason']) ? $variant['priceGroupHighSeason'] : 0;
    
            $query = "INSERT INTO `variant`(`productId`, `pricingType`, `priceAdult`, `priceHalf`, `priceNet`, `priceBrazilian`, `priceFree`, `priceGroup`, `paxLimit`, `priceAdultHighSeason`, `priceHalfHighSeason`, `priceNetHighSeason`, `priceFreeHighSeason`, `priceBrazilianHighSeason`, `priceGroupHighSeason`) VALUES ('$productId','$pricingType','$priceAdult','$priceHalf','$priceNet','$priceBrazilian','$priceFree','$priceGroup','$paxLimit','$priceAdultHighSeason','$priceHalfHighSeason','$priceNetHighSeason','$priceFreeHighSeason','$priceBrazilianHighSeason','$priceGroupHighSeason')";
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