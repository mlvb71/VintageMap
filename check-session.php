<?php
require_once 'config.php';

// Set proper headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . BASE_URL);
header('Access-Control-Allow-Credentials: true');

// CSRF token validation
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check CSRF token if present
$headers = getallheaders();
$csrfToken = $headers['X-CSRF-Token'] ?? '';

if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Validate session
if (!isset($_SESSION['strava_access_token'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit;
}

// Check if token is expired
if (isset($_SESSION['strava_expires_at']) && time() > $_SESSION['strava_expires_at']) {
    // Try to refresh token
    if (isset($_SESSION['strava_refresh_token'])) {
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
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code === 200) {
            $data = json_decode($response, true);
            if (isset($data['access_token'])) {
                $_SESSION['strava_access_token'] = $data['access_token'];
                $_SESSION['strava_refresh_token'] = $data['refresh_token'];
                $_SESSION['strava_expires_at'] = $data['expires_at'];
                
                echo json_encode([
                    'status' => 'ok',
                    'refreshed' => true,
                    'expires_at' => $data['expires_at']
                ]);
                exit;
            }
        }
        
        // Refresh failed
        session_destroy();
        http_response_code(401);
        echo json_encode(['error' => 'Token refresh failed']);
        exit;
    }
    
    // No refresh token available
    session_destroy();
    http_response_code(401);
    echo json_encode(['error' => 'Session expired']);
    exit;
}

// Session is valid
echo json_encode([
    'status' => 'ok',
    'expires_at' => $_SESSION['strava_expires_at'] ?? null,
    'athlete' => isset($_SESSION['strava_athlete']) ? [
        'id' => $_SESSION['strava_athlete']['id'] ?? null,
        'firstname' => $_SESSION['strava_athlete']['firstname'] ?? null,
        'lastname' => $_SESSION['strava_athlete']['lastname'] ?? null
    ] : null
]);
?>