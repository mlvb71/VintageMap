<?php
require_once 'config.php';
header('Content-Type: application/json');

echo json_encode([
    'session_id' => session_id(),
    'has_token' => isset($_SESSION['strava_access_token']),
    'athlete' => $_SESSION['strava_athlete'] ?? 'not set',
    'all_session' => $_SESSION
]);
?>