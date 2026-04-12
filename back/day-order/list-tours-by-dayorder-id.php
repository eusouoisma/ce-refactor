<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $id = $_GET['id'];

    mysqli_begin_transaction($mysqli);

    try {
   
        $query = "SELECT 
    tourDate, 
    tourHour, 
    type, 
    activity, 
    MAX(duration) as duration, 
    GROUP_CONCAT(DISTINCT IF(language != '', language, NULL)) as language, 
    GROUP_CONCAT(DISTINCT IF(ceGuide != '', ceGuide, NULL)) as guides, 
    SUM(paxAdult + paxHalf + paxNet + paxFree) as paxTotal, 
    status 
FROM `tour` 
WHERE dayOrderId = '$id' 
    AND tourHour != '' 
    AND status != 'Cancelado' 
    AND status != 'Bloqueio' 
    AND canceled = 0 
    AND type != 'regular' 
    AND origin = 'office'
GROUP BY tourDate, tourHour, activity, type, status 

UNION 

SELECT 
    tourDate, 
    tourHour, 
    type, 
    activity, 
    MAX(duration) as duration, 
    GROUP_CONCAT(DISTINCT IF(language != '', language, NULL)) as language, 
    GROUP_CONCAT(DISTINCT IF(ceGuide != '', ceGuide, NULL)) as guides, 
    SUM(paxAdult + paxHalf + paxNet + paxFree) as paxTotal, 
    status 
FROM `tour` 
WHERE dayOrderId = '$id' 
    AND tourHour != '' 
    AND status != 'Cancelado' 
    AND canceled = 0 
    AND type = 'regular' 
    AND origin = 'office'
GROUP BY tourDate, tourHour, activity, type, status 

ORDER BY tourHour;
";
        $result = mysqli_query($mysqli, $query);

        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        $rows = [];
        while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            // Explode the 'guides' string into an array, remove duplicates, and then join it back into a string
            $uniqueGuides = array_unique(explode(',', $row['guides']));
            $row['guides'] = implode(',', $uniqueGuides);
            
            // Add the processed row to the $rows array
            $rows[] = $row;
        }

        mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response->data = $rows;
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