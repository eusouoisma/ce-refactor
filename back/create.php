<?php
    
    header('Access-Control-Allow-Origin: *');
    include '../connection.php';

    $query = "SELECT value from settings WHERE type = 'orderRefCount'";
    $result = mysqli_query($mysqli, $query);
    $row = mysqli_fetch_array($result, MYSQLI_ASSOC);

    $newOrderRef = $row['value'] + 1;
    $newOrderRef = str_pad($newOrderRef, 4 , '0' , STR_PAD_LEFT);

    $query = "UPDATE settings SET value = '$newOrderRef' WHERE type = 'orderRefCount'";
    $result = mysqli_query($mysqli, $query);

?>