<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . BASE_URL);
header('Access-Control-Allow-Credentials: true');

// Check authentication
if (!isset($_SESSION['strava_access_token'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Check if token is expired
if (isset($_SESSION['strava_expires_at']) && time() > $_SESSION['strava_expires_at']) {
    // Token expired, need to refresh
    $ch = curl_init('https://www.strava.com/oauth/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'client_id' => STRAVA_CLIENT_ID,
        'client_secret' => STRAVA_CLIENT_SECRET,
        'grant_type' => 'refresh_token',
        'refresh_token' => $_SESSION['strava_refresh_token']
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    if (isset($data['access_token'])) {
        $_SESSION['strava_access_token'] = $data['access_token'];
        $_SESSION['strava_refresh_token'] = $data['refresh_token'];
        $_SESSION['strava_expires_at'] = $data['expires_at'];
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Token refresh failed']);
        exit;
    }
}

$access_token = $_SESSION['strava_access_token'];
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = isset($_GET['per_page']) ? min((int)$_GET['per_page'], 200) : 30;
$after = isset($_GET['after']) ? (int)$_GET['after'] : null;
$before = isset($_GET['before']) ? (int)$_GET['before'] : null;

// Build query parameters
$params = [
    'page' => $page,
    'per_page' => $per_page
];
if ($after) $params['after'] = $after;
if ($before) $params['before'] = $before;

// Fetch activities from Strava
$ch = curl_init('https://www.strava.com/api/v3/athlete/activities?' . http_build_query($params));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code($http_code);
    echo json_encode(['error' => 'Strava API error', 'code' => $http_code]);
    exit;
}

echo $response;
?>