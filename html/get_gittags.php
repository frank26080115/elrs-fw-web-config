<?php
include 'utils.php';

$giturl = 'https://github.com/ExpressLRS/ExpressLRS.git';
$repos = '../private/repos';
$directory = $repos . DIRECTORY_SEPARATOR . 'ExpressLRS';

header('Content-Type: application/json');

if (!is_dir($repos)) {
	if (mkdir($repos, 0777, true)) {
		
	}
	else {
		echo json_encode(['error' => 'mkdir failed']);
		/*
		use the following commands if permissions are missing
		sudo chmod -R 755 /var/www/html
		sudo chown -R www-data:www-data /var/www/html
		*/
		return;
	}
}

if (is_dir($directory)) {
	$lastModified = filemtime($directory);
	$currentTime = time();
	$timeDifference = $currentTime - $lastModified;
	if ($timeDifference > (1 * 24 * 60 * 60)) {
		touch($directory);
		chdir($directory);
		$command = "nohup git pull > /dev/null 2>&1 &";
		exec($command);
		echo json_encode(['error' => 'busy pull']);
		return;
	}
	chdir($directory);
	exec('git tag', $output, $returnVar);
	if ($returnVar === 0) {
		echo json_encode(['tags' => $output]);
	}
	else {
		echo json_encode(['error' => 'failed']);
	}
}
else {
	$command = "nohup git clone $giturl $directory > /dev/null 2>&1 &";
	exec($command);
	$directory = getAbsolutePath($directory);
	$command = "nohup git config --global --add safe.directory $directory > /dev/null 2>&1 &";
	exec($command);
	echo json_encode(['error' => 'busy clone']);
}
?>
