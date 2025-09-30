<?php
// IMPORTANT: Update these with your actual Strava API credentials
define('STRAVA_CLIENT_ID', '94486');
define('STRAVA_CLIENT_SECRET', '193537a85fce13aa8b91e94cef482646f50f9a5e');
define('BASE_URL', 'https://mlvbphotography.com');
define('APP_PATH', '/VintageMap');
define('REDIRECT_URI', BASE_URL . APP_PATH . '/strava-auth.php');

// Session configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.cookie_path', APP_PATH . '/');
session_start();
?>

<?php
// Add this to existing config.php
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>