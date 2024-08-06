<?php

function searchFilesForBuildTargets($dir, $extension, $regex, $groupIndex) {
    $dirIterator = new RecursiveDirectoryIterator($dir);
    $iterator = new RecursiveIteratorIterator($dirIterator);
    $regexIterator = new RegexIterator($iterator, '/^.+\.' . $extension . '$/i', RecursiveRegexIterator::GET_MATCH);

    $matches = array();
    foreach($regexIterator as $file) {
        $content = file_get_contents($file[0]);
        preg_match_all($regex, $content, $fileMatches);
        // Add matches from the specified group of the regex to the array
        $matches = array_merge($matches, $fileMatches[$groupIndex]);
    }

    // Remove duplicates
    $matches = array_unique($matches);

    return $matches;
}

$need_remake = false;
$cache_file = "../private/repos/env_targets.json";
if (file_exists($cache_file)) {
    $fileModTime = filemtime($cache_file);
    $currentTime = time();
    $differenceInDays = ($currentTime - $fileModTime) / (60 * 60 * 24);
    if ($differenceInDays > 3) {
        //$need_remake = true;
    }
}
else {
    $need_remake = true;
}
try {
	if ($need_remake) {
		$dir = '/var/www/private/repos/ExpressLRS/src/targets';
		if (is_dir($dir)) {
			$extension = 'ini';
			$regex = '/\\[env:([a-zA-Z0-9_]+)\\]/';
			$results = searchFilesForBuildTargets($dir, $extension, $regex, 1);
			$jsonArray = array("targets" => $results);
			file_put_contents($cache_file, json_encode($jsonArray));
			touch($cache_file);
		}
	}
}
catch (Exception $ex) {
}
if (file_exists($cache_file)) {
    // Set the content type to application/json
    header('Content-Type: application/json');
    // Read the file and output its contents
    $content = file_get_contents($cache_file);
    echo $content;
}
?>