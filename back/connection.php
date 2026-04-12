<?php
    // ini_set('display_errors', 0);  

    $servername = "localhost";
    $username = "root";
    $password = "";
    $banco = "u658162899_sistemace";

    // Create connection
    $mysqli = new mysqli($servername, $username, $password, $banco);
    if (!$mysqli->set_charset("utf8mb4")) {
        die("Erro ao configurar charset: " . $mysqli->error);
    }
    // Check connection
    if ($mysqli->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    } 
?>
