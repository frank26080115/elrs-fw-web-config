<?php

function getAbsolutePath($relativePath) {
    // Get the current working directory
    $currentDir = getcwd();
    
    // Combine the current directory with the relative path
    $absolutePath = realpath($currentDir . DIRECTORY_SEPARATOR . $relativePath);
    
    return $absolutePath;
}

?>