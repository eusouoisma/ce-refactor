<?php
    
    header('Access-Control-Allow-Origin: *');
    include 'connection.php';

    $query = "SELECT aux.*, customers.id FROM `aux` INNER JOIN customers ON aux.nomeEmpresa = customers.customerName WHERE 1";
    $result = mysqli_query($mysqli, $query);
    while($row = mysqli_fetch_array($result, MYSQLI_ASSOC)){
        $customerId = $row['id'];
        $contactName = $row['contato'];
        $contactContact = $row['telefone'];
        $contactOffice = $row['cargo'];
        $contactEmail = $row['email'];
        $query2 = "INSERT INTO `customerContacts`(`customerId`, `contactName`, `contactContact`, `contactOffice`, `contactEmail`, `createdBy`, `lastEditBy`) VALUES ('$customerId','$contactName','$contactContact','$contactOffice','$contactEmail','Akiva','Akiva')";
        $result2 = mysqli_query($mysqli, $query2);
        if($result2){
            echo "Ok<br/>";
        }
    }
    

?>