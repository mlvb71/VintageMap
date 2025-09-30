<?php
require_once 'config.php';

// Handle OAuth callback
if (isset($_GET['code'])) {
    $code = $_GET['code'];
    
    // Exchange code for access token
    $ch = curl_init('https://www.strava.com/oauth/token');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'client_id' => STRAVA_CLIENT_ID,
        'client_secret' => STRAVA_CLIENT_SECRET,
        'code' => $code,
        'grant_type' => 'authorization_code'
    ]));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code === 200) {
        $data = json_decode($response, true);
        
        if (isset($data['access_token'])) {
            // Store in session
            $_SESSION['strava_access_token'] = $data['access_token'];
            $_SESSION['strava_refresh_token'] = $data['refresh_token'];
            $_SESSION['strava_athlete'] = $data['athlete'];
            $_SESSION['strava_expires_at'] = $data['expires_at'];
            
            // Success redirect
            header('Location: ' . BASE_URL . APP_PATH . '/vintagemap.html?connected=true');
            exit;
        }
    }
    
    // Error redirect
    header('Location: ' . BASE_URL . APP_PATH . '/vintagemap.html?error=auth_failed');
    exit;
}

// Generate OAuth URL
$oauth_url = 'https://www.strava.com/oauth/authorize?' . http_build_query([
    'client_id' => STRAVA_CLIENT_ID,
    'response_type' => 'code',
    'redirect_uri' => REDIRECT_URI,
    'approval_prompt' => 'auto',
    'scope' => 'activity:read_all'
]);

header('Location: ' . $oauth_url);
?>