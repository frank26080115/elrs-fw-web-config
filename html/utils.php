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
	$buffer = '';
	try {
		$f = fopen($file, 'rb');
		if ($f)
		{
			fseek($f, -1, SEEK_END);
			$pos = ftell($f);
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
		}
		else {
			$buffer = "Unable to read file \"" . $file ."\"";
		}
	}
	catch (Exception $e) {
		$buffer = "Unable to read file \"" . $file ."\" due to error: " . $e->getMessage();
	}
	return $buffer;
}

function binaryFileToHex($filePath) {
	// Read the binary file content
	$binaryContent = file_get_contents($filePath);

	// Convert the binary content to a hexadecimal string
	$hexString = bin2hex($binaryContent);

	return $hexString;
}

// Function to check if a file path is within the public HTML folder
function isWithinPublicHtml($filePath) {
	$publicHtmlFolder = "/var/www/html";

	// Get the absolute paths
	$absoluteFilePath = realpath($filePath);
	$absolutePublicHtmlFolder = realpath($publicHtmlFolder);

	// Check if the file path starts with the public HTML folder path
	if ($absoluteFilePath && $absolutePublicHtmlFolder && strpos($absoluteFilePath, $absolutePublicHtmlFolder) === 0) {
		return true;
	} else {
		return false;
	}
}

function showLogFile($logFile) {
	// Number of lines to display
	$linesToShow = 10;

	// Display the last few lines of the log file
	if (file_exists($logFile)) {
		try {
			echo htmlspecialchars(tail($logFile, $linesToShow));
		}
		catch (Exception $e) {
			echo 'Error exception while trying to read log file "' . $logFile . '": ',  $e->getMessage(), "\n";
		}
	} else {
		echo "Log file not found. Try this: sudo tail -f " . $logFile;
	}
}

?>