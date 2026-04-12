<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';
    
    echo "opa";


    $query = "SELECT * FROM tour WHERE 1";
    $result = mysqli_query($mysqli, $query);
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
        $guide = $row['ceGuide'];
        $id = $row['id'];
        if(substr($guide, 0, 1) == " "){
            $guide = substr($guide, 1);
            $query = "UPDATE tour SET `ceGuide` = '$guide' WHERE `id` = '$id'";
            $resultUpdate = mysqli_query($mysqli, $query);            
        }
        
        else if($guide == " "){
            $guide = NULL;
            $query = "UPDATE tour SET `ceGuide` = '$guide' WHERE `id` = '$id'";
            $resultUpdate = mysqli_query($mysqli, $query);            
        }
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