<?php
header('Content-Type: application/json');

// Read incoming data (current stack and proposed new circle color)
$input = json_decode(file_get_contents('php://input'), true);

$stack = $input['stack'] ?? [];
$newCircle = $input['newCircle'] ?? null;

$response = [
    'canPlace' => false,
    'message' => ''
];

if ($newCircle === null) {
    $response['message'] = 'No circle provided.';
    echo json_encode($response);
    exit;
}

// Check if stack is empty
if (empty($stack)) {
    $response['canPlace'] = true;
    echo json_encode($response);
    exit;
}

//Ensure the first in and first out
$topCircle = $stack[0];


//Stacking game rules
$rules = [
    'R' => [], // Red cannot have anything above it.
    'G' => ['R', 'G', 'B'], // Green allows anything on top.
    'B' => ['R'] // Blue only allows red above it.
];

// Check if stacking process follows the rules or not
if (isset($rules[$topCircle])) {
    if (in_array($newCircle, $rules[$topCircle]) || in_array('none', $rules[$topCircle])) {
        $response['canPlace'] = true;
    } else {
        $response['message'] = "Cannot place $newCircle on top of $topCircle.";
    }
} else {
    $response['message'] = "Invalid top circle color.";
}
echo json_encode($response);
