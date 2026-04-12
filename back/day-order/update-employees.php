<?php
    header('Access-Control-Allow-Origin: *');

    include '../connection.php';
    include '../currentYear.php';

    $data = json_decode(file_get_contents('php://input'), true);
    
    $employees = $data['employees'];
    $dayOrderId = $data['dayOrderId'];
    $dayOrderComments = $data['comments'];
    $lastEditBy = $data['lastEditBy'];

    mysqli_begin_transaction($mysqli);

    try {
        foreach($employees as $employee) {
            $id = $employee['id'];
            $function = $employee['function'];
            $name = $employee['name'];
            $prevision = $employee['prevision'];
            $arrival = $employee['arrival'];
            $departure = $employee['departure'];
            $phone = $employee['phone'];
            $comments = $employee['comments'];
            $deleted = $employee['deleted'] ? '1' : '0';

            if($deleted == "1" || $function == ""){
                $query = "DELETE FROM `dayOrderEmployee` WHERE id = '$id'";
                $result = mysqli_query($mysqli, $query);
                if(!$result){
                    throw new Exception(mysqli_error($mysqli));
                }
            } else {
                $query = "UPDATE `dayOrderEmployee` SET `function`='$function',`name`='$name',`prevision`='$prevision',`arrival`='$arrival',`departure`='$departure',`phone`='$phone',`comments`='$comments',`deleted`='$deleted' WHERE id = '$id'";
                $result = mysqli_query($mysqli, $query);
                if(!$result){
                    throw new Exception(mysqli_error($mysqli));
                }
            }          
        }

        $query = "UPDATE dayOrder SET comments = '$dayOrderComments', lastEditBy = '$lastEditBy' WHERE id = '$dayOrderId' ";
        $result = mysqli_query($mysqli, $query);

         //Delete all employees on db where no have function name
         $query = "DELETE FROM `dayOrderEmployee` WHERE `function` = ''";
         $result = mysqli_query($mysqli, $query);
         if(!$result){
             throw new Exception(mysqli_error($mysqli));
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