<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $data = json_decode(file_get_contents('php://input'), true);

    $dayOrderId =  $data['dayOrderId'];
    
    mysqli_begin_transaction($mysqli);

    function differenceInHours($startdate,$enddate){
        $starttimestamp = strtotime($startdate);
        $endtimestamp = strtotime($enddate);
        $difference = abs($endtimestamp - $starttimestamp)/3600;
        return $difference;
    }

    try {
        $query = "SELECT `dayOrderEmployee`.*, `dayOrderEmployeesList`.`type` as `type` FROM `dayOrderEmployee` LEFT JOIN `dayOrderEmployeesList` ON `dayOrderEmployee`.`name` = `dayOrderEmployeesList`.`name` AND `dayOrderEmployee`.`function` = `dayOrderEmployeesList`.`function` WHERE `dayOrderId` = '$dayOrderId' AND `deleted` = '0' AND (`type` IS NULL OR `type` != 'Fixo')";
        $result = mysqli_query($mysqli, $query);

        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }

        //Deleta todos os pagamentos antigos para esse dayOrder
        $query = "DELETE FROM `dayOrderPayments` WHERE `dayOrderId` = '$dayOrderId'";
        $resultDelete = mysqli_query($mysqli, $query);
        if(!$resultDelete){
            throw new Exception(mysqli_error($mysqli));
        }

        $today = date('Y-m-d H:i:s');

        while($employee = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            $function = $employee['function'];
            $numberOfTours = $employee['numberOfTours'];
            $employeeName = $employee['name'];
            $initial = $employee['arrival'];
            $final = $employee['departure'];
            $comments = $employee['comments'];

            $dayRemuneration = 0;

            //Se for guia, calcula o salário de acordo com os tours que o guia participou
            if($function == "Guia"){
                $query = "SELECT tourDate, tourHour, activity, ceGuide FROM `tour` WHERE dayOrderId = '$dayOrderId' AND tourHour != '' AND status != 'Cancelado' AND status != 'Bloqueio' AND canceled = 0 AND ceGuide LIKE '%$employeeName%'  GROUP BY tourDate, tourHour, activity ORDER BY tourHour";
                $guideTours = mysqli_query($mysqli, $query);
                if(!$guideTours){
                    throw new Exception(mysqli_error($mysqli));
                }
                while($tour = mysqli_fetch_array($guideTours, MYSQLI_ASSOC)){
                    $activity = $tour['activity'];
                    $tourHour = $tour['tourHour'];
                    

                    $query = "SELECT SQL_NO_CACHE * FROM `dayOrderEmployeesRemunerations` 
                      INNER JOIN `dayOrderEmployeesFunctions` 
                      ON `dayOrderEmployeesRemunerations`.`functionId` = `dayOrderEmployeesFunctions`.`id` 
                      WHERE `dayOrderEmployeesFunctions`.`name` = '$function' 
                      AND `dayOrderEmployeesRemunerations`.`activity` = '$activity'";

                    $payment = mysqli_query($mysqli, $query);
                    if(mysqli_num_rows($payment) == 0){
                        throw new Exception("Não foi possível gerar os pagamentos pois a atividade ".$activity." não possui o salário cadastrado");
                    }
                    $payment = mysqli_fetch_array($payment, MYSQLI_ASSOC)['hourlyValue1'];
                    
                    $query = "INSERT INTO `dayOrderPayments`(`dayOrderId`, `function`, `employeeName`, `arrival`, `departure`, `comments`, `value`, `activity`,`tourHour`,`paymentDate` ) VALUES ('$dayOrderId','$function','$employeeName','$initial','$final','$comments','$payment','$activity','$tourHour','$today')";
                    $resultInserPayment = mysqli_query($mysqli, $query);
                    if(!$resultInserPayment){
                        throw new Exception(mysqli_error($mysqli));
                    }

                }
            }

            //Se não for guia, calcula de acordo com o salário para o tempo trabalhado
            else {
                $query = "SELECT * FROM `dayOrderEmployeesRemunerations` INNER JOIN `dayOrderEmployeesFunctions` ON `dayOrderEmployeesRemunerations`.`functionId` = `dayOrderEmployeesFunctions`.`id` WHERE `dayOrderEmployeesFunctions`.`name` = '$function'";
                $remunerationResult = mysqli_query($mysqli, $query);
                if(mysqli_num_rows($remunerationResult) == 0){
                    throw new Exception("Não foi possível gerar os pagamentos pois a função ".$function." não possui o salário cadastrado");
                }
                $remuneration = mysqli_fetch_array($remunerationResult, MYSQLI_ASSOC);
                $paymentType = $remuneration['paymentType'];
                
                $time = differenceInHours($initial, $final);

                if($paymentType == 'day'){
                    if($time <= 8) {
                        $dayRemuneration = $remuneration['hourlyValue1'];
                    } else if($time <= 10) {
                        $dayRemuneration = $remuneration['hourlyValue2'];
                    } else {
                        $dayRemuneration = $remuneration['hourlyValue3'];
                    }
                } else if($paymentType == 'hour'){
                    $dayRemuneration = $remuneration['hourlyValue1'] * $time;
                } else if($paymentType == 'special'){
                    $dayRemuneration = 0;
                }

                $query = "INSERT INTO `dayOrderPayments`(`dayOrderId`, `function`, `employeeName`, `arrival`, `departure`, `value`, `comments`, `paymentDate`) VALUES ('$dayOrderId','$function','$employeeName','$initial','$final','$dayRemuneration','$comments','$today')";
                $resultInserPayment = mysqli_query($mysqli, $query);
                if(!$resultInserPayment){
                    throw new Exception(mysqli_error($mysqli));
                }

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