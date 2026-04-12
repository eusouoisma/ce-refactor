<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    mysqli_begin_transaction($mysqli);

    try {

        $months = $_GET['months'];
        $months = explode(",",$months);
        $months =  "'" . implode("','", $months) . "'";

        $year = $_GET['year'];

        $query = "SELECT tour.id, status, tourDate, DATE_FORMAT(tourDate, '%d/%m/%Y') as formatedTourDate, tourHour, type, tour.activity, MAX(duration) as duration, GROUP_CONCAT(DISTINCT IF(language != '', language, NULL)) as language, GROUP_CONCAT(DISTINCT IF(ceGuide != '', ceGuide, NULL)) as guides, SUM(IF(`status` != 'Cancelado', paxAdult + paxHalf + paxNet + paxFree + paxBrazilian, 0)) as paxTotal, SUM(paxAdult + paxHalf + paxNet + paxFree + paxBrazilian) as paxTotalInitial, client, `numberOfGroups` as `groups` FROM `tour` WHERE tourHour != '' AND canceled = 0 AND type != 'regular' AND origin = 'office' AND MONTH(tourDate) IN ($months) AND YEAR(tourDate) = '$year' GROUP BY tour.id UNION SELECT tour.id, status, tourDate, DATE_FORMAT(tourDate, '%d/%m/%Y') as formatedTourDate, tourHour, type, tour.activity, MAX(duration) as duration, GROUP_CONCAT(DISTINCT IF(language != '', language, NULL)) as language, GROUP_CONCAT(DISTINCT IF(ceGuide != '', ceGuide, NULL)) as guides, SUM(IF(`status` != 'Cancelado', paxAdult + paxHalf + paxNet + paxFree + paxBrazilian, 0)) as paxTotal, SUM(paxAdult + paxHalf + paxNet + paxFree + paxBrazilian) as paxTotalInitial, client, numberOfGroups.groups as `groups` FROM `tour` LEFT JOIN numberOfGroups ON numberOfGroups.date = tour.tourDate AND numberOfGroups.hour = tour.tourHour AND numberOfGroups.activity = tour.activity WHERE tourHour != '' AND canceled = 0 AND type = 'regular' AND origin = 'office' AND MONTH(tourDate) IN ($months) AND YEAR(tourDate) = '$year' GROUP BY tourDate, tourHour, tour.activity  
        ORDER BY `tourDate` ASC, `tourHour` ASC";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
       $tours = [];
        while($data = mysqli_fetch_array($result, MYSQLI_ASSOC)) {
            // Explode the 'guides' string into an array, remove duplicates, and then join it back into a string
            $uniqueGuides = array_unique(explode(',', $data['guides']));
            $data['guides'] = implode(',', $uniqueGuides);
            
            // Adiciona o dado processado ao array $tours
            $tours[] = $data;
        }

        $response = new \stdClass();
        if($result){
            $response->error = false;
        } else {
        $response->error = true;
        }

        $response = json_encode($tours, JSON_UNESCAPED_UNICODE);

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