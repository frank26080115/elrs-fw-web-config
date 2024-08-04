<?php

function getAbsolutePath($relativePath) {
	// Get the current working directory
	$currentDir = getcwd();
	
	// Combine the current directory with the relative path
	$absolutePath = realpath($currentDir . DIRECTORY_SEPARATOR . $relativePath);
	
	return $absolutePath;
}

// Function to check if the Flask server is running
function isFlaskServerRunning($url) {
	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_TIMEOUT, 2);
	curl_exec($ch);
	$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
	curl_close($ch);
	return $httpCode === 200;
}

// Function to read the last few lines of a file
function tail($file, $lines) {
	$f = fopen($file, 'rb');
	fseek($f, -1, SEEK_END);
	$pos = ftell($f);
	$buffer = '';
	$count = 0;

	while ($pos > 0 && $count < $lines) {
		$char = fgetc($f);
		if ($char === "\n") {
			$count++;
			if ($count === $lines) {
				break;
			}
		}
		$buffer = $char . $buffer;
		fseek($f, --$pos, SEEK_SET);
	}

	fclose($f);
	return $buffer;
}

?>