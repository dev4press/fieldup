<?php

header('Content-Type: text/plain; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Use POST to upload files.\n";
    exit;
}

$files = $_FILES['files'] ?? null;
$captions = $_POST['file_captions'] ?? [];
if (!is_array($captions)) {
    $captions = [];
}

if (!is_array($files) || !isset($files['name']) || !is_array($files['name'])) {
    http_response_code(400);
    echo "No files were received.\n";
    exit;
}

foreach ($files['name'] as $index => $name) {
    $error = $files['error'][$index] ?? UPLOAD_ERR_NO_FILE;
    if ($error === UPLOAD_ERR_OK) {
        echo "Received: " . basename((string) $name) . "\n";
        $caption = $captions[$index] ?? '';
        echo "Caption: " . (is_string($caption) ? $caption : '') . "\n";
    } else {
        echo "Upload error for item " . (int) $index . ": " . $error . "\n";
    }
}