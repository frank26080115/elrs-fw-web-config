<?php
include 'utils.php';

$giturl = 'https://github.com/ExpressLRS/targets.git';
$repos = '../private/repos';
$directory = $repos . DIRECTORY_SEPARATOR . 'targets';

header('Content-Type: application/json');

if (is_dir($directory)) {
	$fileName = 'targets.json';
	$jsonFilePath = $directory . DIRECTORY_SEPARATOR . $fileName;
	$fileExists = false;
	if (file_exists($jsonFilePath)) {
		$jsonData = file_get_contents($jsonFilePath);
		echo $jsonData;
		$fileExists = true;
	}
	$lastModified = filemtime($directory);
	$currentTime = time();
	$timeDifference = $currentTime - $lastModified;
	if ($timeDifference > (1 * 24 * 60 * 60)) {
		touch($directory);
		chdir($directory);
		$command = "nohup git pull > /dev/null 2>&1 &";
		exec($command);
	}
	if ($fileExists == false) {
		echo json_encode(['error' => "File \"$jsonFilePath\" not found"]);
	}
}
else {
	$command = "nohup git clone $giturl $directory > /dev/null 2>&1 &";
	exec($command);
	$command = "nohup git clone $giturl $directory > /dev/null 2>&1 &";
	$directory = getAbsolutePath($directory);
	$command = "nohup git config --global --add safe.directory $directory > /dev/null 2>&1 &";
	exec($command);
	echo json_encode(['error' => 'busy clone']);
}
?>