<?php
$start_time = microtime(true);

include 'utils.php';
?>

<!DOCTYPE html>
<html>
<head>
    <title>Server Info</title>
</head>
<body>
<fieldset><legend>Current Server Time</legend>
<pre><?php
$current_time = date('Y-m-d H:i:s');
echo "Current server time: " . $current_time;
?>
</pre>
</fieldset>
<fieldset><legend>Python Flask Backend</legend>
<pre><?php
$url = 'http://localhost:5000/';
if (isFlaskServerRunning($url . "test")) {
	echo "Server is running.";

	// Initialize cURL session
	$ch = curl_init($url . "builder");

	// Set cURL options
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(array("action" => "report")));

	// Execute cURL request
	$response = curl_exec($ch);
	curl_close($ch);
	echo "\r\n";
	if ($response === false) {
		echo "Server did not respond";
	}
	else {
		$data = json_decode($response, true);
		if ($data === null) {
			echo "Server response is unusual: " . $response;
		}
		else {
			// Check if a specific key exists and echo the value
			$keyToCheck = 'report';
			if (isset($data[$keyToCheck])) {
				echo "Server report: " . $data[$keyToCheck];
			} else {
				echo "Server report is missing, full response: " . $response;
			}
		}
	}
}
else {
	echo "Server is not running.";
}

$logFile = '../private/logs/builder.log'; // Adjust the path as needed

// Number of lines to display
$linesToShow = 10;

// Display the last few lines of the log file
if (file_exists($logFile)) {
	echo "\r\nLogs:\r\n";
	echo htmlspecialchars(tail($logFile, $linesToShow));
} else {
	echo "\r\nLogs:\r\n";
	echo "Log file not found.";
}
?></pre>
</fieldset>
<fieldset><legend>Apache Server Error Log Messages</legend>
	<pre><?php
		showLogFile('/var/log/apache2/error.log');
		?>
	</pre>
</fieldset>
<fieldset><legend>Apache Server Access Log Messages</legend>
	<pre><?php
		showLogFile('/var/log/apache2/access.log');
		?>
	</pre>
</fieldset>
<fieldset><legend>PHP Error Log Messages</legend>
	<pre><?php
		//phpinfo();
		//echo "\r\n";
		// Get the path to the PHP error log file
		$logFile = ini_get('error_log');
		echo "Log file location: " . $logFile . "\r\n";
		showLogFile($logFile);
		?>
	</pre>
</fieldset>
<fieldset><legend>Server Process List</legend>
	<pre><?php
echo 'exec whoami: ' . exec('whoami') . "\r\n";
echo 'posix uid: ' . posix_getpwuid(posix_geteuid())['name'];
?></pre>
	<pre><?php
		// Execute the 'ps aux' command and store the output
		$output = shell_exec('ps aux');
		// Display the output
		echo htmlspecialchars($output);
		?>
	</pre>
</fieldset>
<fieldset><legend>Server RAM Usage</legend>
	<pre><?php
		// Function to get memory information
		function getMemoryInfo() {
			$data = file('/proc/meminfo');
			$meminfo = [];
			foreach ($data as $line) {
				list($key, $val) = explode(':', $line);
				$meminfo[$key] = trim($val);
			}
			return $meminfo;
		}

		// Get memory information
		$meminfo = getMemoryInfo();

		// Display memory information
		echo "Total RAM: " . $meminfo['MemTotal'] . "\n";
		echo "Free RAM: " . $meminfo['MemFree'] . "\n";
		echo "Available RAM: " . $meminfo['MemAvailable'] . "\n";
		echo "Buffers: " . $meminfo['Buffers'] . "\n";
		echo "Cached: " . $meminfo['Cached'] . "\n";
		echo "Swap Total: " . $meminfo['SwapTotal'] . "\n";
		echo "Swap Free: " . $meminfo['SwapFree'] . "\n";
		?>
	</pre>
</fieldset>
<fieldset><legend>Server Disk Usage</legend>
	<pre><?php
		// Execute the 'df -h' command to get disk usage information
		$output = shell_exec('df -h');
		// Display the output
		echo htmlspecialchars($output);
		?>
	</pre>
</fieldset>
<fieldset><legend>Server Network Usage</legend>
	<pre><?php
		$output = shell_exec('vnstat 2>&1');
		echo htmlspecialchars($output);
		?>
	</pre>
</fieldset>
<fieldset><legend>FW Directory File List</legend>
	<pre><?php
		// Specify the directory you want to list
		$directory = 'fw'; // Adjust the path as needed

		// Check if the directory exists
		if (is_dir($directory)) {
			// Execute the 'ls -l' command to get detailed file information
			$output = shell_exec('ls ' . escapeshellarg($directory));
			// Display the output
			echo htmlspecialchars($output);
		} else {
			echo "Directory not found.";
		}
		?>
	</pre>
</fieldset>
<fieldset><legend>PlatformIO</legend>
	<pre><?php
		$output = shell_exec('/var/www/private/piovenv/piovenv/bin/pio --version 2>&1');
		echo $output;
		echo "\r\n";
		$output = shell_exec('/var/www/private/piovenv/piovenv/bin/pio pkg list --global 2>&1');
		echo $output;
		$output = shell_exec('/var/www/private/piovenv/piovenv/bin/pio system info 2>&1');
		echo "\r\n";
		echo $output;
		?></pre>
</fieldset>
<fieldset><legend>Page Render Time</legend>
	<pre><?php
		$end_time = microtime(true);
		$execution_time = $end_time - $start_time;
		$formatted_execution_time = number_format($execution_time, 3);
		echo "Execution time: " . $formatted_execution_time . " seconds";
	?>
	</pre>
</fieldset>
</body>
</html>