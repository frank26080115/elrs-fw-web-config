<?php
// Get the parameter from the URL
$param = urldecode($_GET['file']);

// Specify the directories to search
$dirs = ['/var/www/private/repos/targets', '/var/www/private/repos/ExpressLRS/src/hardware', '/var/www/private/repos/shrew/src/hardware'];

// Recursive function to search for the JSON file
function searchJsonFile($dirs, $param) {
	foreach ($dirs as $dir) {
		if (is_dir($dir)) {
			$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
			foreach ($iterator as $file) {
				if ($file->isFile() && $file->getFilename() == $param) {
					return $file->getPathname();
				}
			}
		}
	}
	return null;
}

// Search for the JSON file
$jsonFile = searchJsonFile($dirs, $param);

if ($jsonFile !== null) {
    // If the JSON file is found, read its contents
    $json = file_get_contents($jsonFile);

    // Set the Content-Type header to application/json
    header('Content-Type: application/json');

    // Output the JSON
    echo $json;
} else {
    // If the JSON file is not found, output an error message
    header("HTTP/1.0 404 Not Found");
    echo "404 Not Found";
}
?>