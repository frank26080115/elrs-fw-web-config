<?php
include 'utils.php';

try
{
$url = 'http://localhost:5000/builder';
// Get the incoming POST data
$data = json_decode(file_get_contents('php://input'), true);

// Check if the Flask server is running
if (!isFlaskServerRunning($url)) {
    // Start the Flask server in the background
    exec('nohup python3 /var/www/private/builder.py > /dev/null 2>&1 &');
    sleep(2); // Give the server some time to start
}

// Initialize cURL session
$ch = curl_init($url);

// Set cURL options
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));

// Execute cURL request
$response = curl_exec($ch);
curl_close($ch);

header('Content-Type: application/json');

if ($response === false) {
    $response = json_encode(array("error" => "Internal server cURL/Flask error"));
}
if (json_decode($response) === null) {
    $response = json_encode(array("error" => "Internal server Python/Flask error"));
}
echo $response;
}
catch (Exception $e) {
    $response = json_encode(array("error" => "Internal server cURL/Flask exception: " . $e->getMessage()));
    echo $response;
}

?>
