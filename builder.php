<?php
$url = 'http://localhost:5000/builder';
// Get the incoming POST data
$data = json_decode(file_get_contents('php://input'), true);

// Function to check if the Flask server is running
function isServerRunning($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return $httpCode === 200;
}

// Check if the Flask server is running
if (!isServerRunning($url)) {
    // Start the Flask server in the background
    exec('nohup python3 builder.py > /dev/null 2>&1 &');
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

// Check for errors
if ($response === false) {
    echo 'Curl error: ' . curl_error($ch);
} else {
    echo 'Response from server: ' . $response;
}

// Close cURL session
curl_close($ch);
?>
