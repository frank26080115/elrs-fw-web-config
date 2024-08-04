<?php
include 'utils.php';
if (isset($_GET['file'])) {
    $file_path = $_GET['file'];
    if (file_exists($file_path) && isWithinPublicHtml($file_path)) {
        $encoded_string = binaryFileToHex($file_path);
        $response = array('encoded_str' => $encoded_string);

        header('Content-Type: application/json');

        echo json_encode($response);
    } else {
        // Handle the case where the file does not exist
        $response = array('error' => 'File not found');
        header('Content-Type: application/json');
        echo json_encode($response);
    }
} else {
    // Handle the case where the 'file' parameter is not set
    $response = array('error' => 'File parameter not specified');
    header('Content-Type: application/json');
    echo json_encode($response);
}
?>