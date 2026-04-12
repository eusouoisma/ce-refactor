<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';

    $id = $_GET['day_order_id'];

    mysqli_begin_transaction($mysqli);

    try {

        //  Check if guides are alteready inserted in dayOrder employees list. If not, insert them
        $query = "SELECT DISTINCT ceGuide FROM `tour` WHERE ceGuide != '' AND dayOrderId = '$id' AND status != 'Cancelado' AND canceled = 0";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        while($guides = mysqli_fetch_array($result, MYSQLI_ASSOC)['ceGuide']){
            $guides = explode(",", $guides);
            foreach($guides as $guide){
                $guide = trim($guide);
                if($guide == "") break;
                $query = "SELECT name FROM dayOrderEmployee WHERE dayOrderId = '$id' AND DELETED = '0' AND name = '$guide' AND function = 'Guia'";
                $resultGuide = mysqli_query($mysqli, $query);
                if(!$resultGuide){
                    throw new Exception(mysqli_error($mysqli));
                }
                if(mysqli_num_rows($resultGuide) == 0){
                    $query = "INSERT INTO `dayOrderEmployee`(`dayOrderId`, `function`, `name`, `prevision`, `arrival`, `departure`, `phone`, `comments`) VALUES ('$id','Guia','$guide','','','','','')";
                    $resultInserEmployee = mysqli_query($mysqli, $query);
                    if(!$resultInserEmployee){
                        throw new Exception(mysqli_error($mysqli));
                    }
                }
            }
        }

        //Delete guides that are not associated to one tour
        $query = "SELECT GROUP_CONCAT(DISTINCT ceGuide) as guides FROM `tour` WHERE ceGuide != '' AND dayOrderId = '$id' AND status != 'Cancelado' AND canceled = 0";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        $allGuides = mysqli_fetch_array($result, MYSQLI_ASSOC)['guides'];
        $allGuides = array_map('trim', explode(",", $allGuides));
        $allGuides = "'" . implode("','", $allGuides) . "'";
        $query = "DELETE FROM dayOrderEmployee WHERE dayOrderId = '$id' AND function = 'Guia' AND name NOT IN($allGuides)";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }


        $query = "SELECT `name`,`autoInserted` FROM `dayOrder` WHERE `id` = '$id'";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        $dayOrderResult = mysqli_fetch_array($result, MYSQLI_ASSOC);
        $autoInserted = $dayOrderResult['autoInserted'];
        $name = $dayOrderResult['name'];
        if($autoInserted == "0" && ($name == 'Tour Principal' || $name == 'Regular')){
            //  Check if fixed employees are alteready inserted in dayOrder employees list. If not, insert them
            $query = "SELECT * FROM `dayOrderEmployeesList` WHERE `type` = 'Fixo'";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
            while($employee = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            $employeeNname = $employee['name'];
            $function = $employee['function'];
            $query = "SELECT name, function FROM dayOrderEmployee WHERE dayOrderId = '$id' AND DELETED = '0' AND name = '$employeeNname' AND function = '$function'";
            $resultEmployee = mysqli_query($mysqli, $query);
            if(!$resultEmployee){
                throw new Exception(mysqli_error($mysqli));
            }
            if(mysqli_num_rows($resultEmployee) == 0){
                $query = "INSERT INTO `dayOrderEmployee`(`dayOrderId`, `function`, `name`, `prevision`, `arrival`, `departure`, `phone`, `comments`) VALUES ('$id','$function','$employeeNname','','','','','')";
                $resultInsertEmployee = mysqli_query($mysqli, $query);
                if(!$resultInsertEmployee){
                    throw new Exception(mysqli_error($mysqli));
                }
            }
            }
            
            $query = "UPDATE `dayOrder` SET `autoInserted`='1' WHERE id = '$id'";
            $result = mysqli_query($mysqli, $query);
            if(!$result){
                throw new Exception(mysqli_error($mysqli));
            }
        } 
        

        $query = "SELECT *, DATE_FORMAT(date, '%d/%m/%Y') as formatedDate FROM dayOrder WHERE id = '$id'";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        $orderDay = mysqli_fetch_array($result, MYSQLI_ASSOC);
        $orderDayId = $orderDay['id'];

        $date = $orderDay['date'];
        $query = "SELECT * FROM `dayOrder` WHERE date = DATE_SUB('$date', INTERVAL 1 DAY)";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        if(mysqli_num_rows($result) > 0){
            $prev = mysqli_fetch_array($result, MYSQLI_ASSOC);
            $orderDay['prev'] = $prev['id'];
        }
        $query = "SELECT * FROM `dayOrder` WHERE date = DATE_ADD('$date', INTERVAL 1 DAY)";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        if(mysqli_num_rows($result) > 0){
            $next = mysqli_fetch_array($result, MYSQLI_ASSOC);
            $orderDay['next'] = $next['id'];
        }

        $query = "SELECT dayOrderEmployee.*, dayOrderEmployeesFunctions.orderNumber FROM dayOrderEmployee INNER JOIN dayOrderEmployeesFunctions ON dayOrderEmployee.function = dayOrderEmployeesFunctions.name WHERE dayOrderId = '$orderDayId' AND DELETED = '0' ORDER BY dayOrderEmployeesFunctions.orderNumber";
        $result = mysqli_query($mysqli, $query);
        if(!$result){
            throw new Exception(mysqli_error($mysqli));
        }
        $employees = [];
        while ($employee = mysqli_fetch_array($result, MYSQLI_ASSOC)){
            $employees[] = $employee;
        }
    
        mysqli_commit($mysqli);

        $response = new \stdClass();
        $response->error = false;
        $response->infos = $orderDay;
        $response->employees = $employees;
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