<?php
require_once 'config.php';

// CRITICAL: Clean output buffer to prevent whitespace before XML
if (ob_get_level()) {
    ob_clean();
}

header('Content-Type: application/gpx+xml');
header('Access-Control-Allow-Origin: ' . BASE_URL);
header('Access-Control-Allow-Credentials: true');

if (!isset($_SESSION['strava_access_token']) || !isset($_GET['id'])) {
    http_response_code(401);
    exit;
}

$access_token = $_SESSION['strava_access_token'];
$activity_id = (int)$_GET['id'];

// First get activity details
$ch = curl_init("https://www.strava.com/api/v3/activities/{$activity_id}");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$activity_response = curl_exec($ch);
curl_close($ch);

$activity = json_decode($activity_response, true);
if (!$activity) {
    http_response_code(404);
    exit;
}

// Get activity streams (GPS data)
$ch = curl_init("https://www.strava.com/api/v3/activities/{$activity_id}/streams?" . http_build_query([
    'keys' => 'latlng,altitude,time,distance',
    'key_by_type' => true
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    http_response_code($http_code);
    exit;
}

$streams = json_decode($response, true);

if (!$streams || !isset($streams['latlng'])) {
    http_response_code(404);
    exit;
}

// Convert to GPX format
$start_date = new DateTime($activity['start_date']);
$gpx = '<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Vintage Strava Maps" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>' . htmlspecialchars($activity['name']) . '</name>
    <time>' . $start_date->format('c') . '</time>
  </metadata>
  <trk>
    <name>' . htmlspecialchars($activity['name']) . '</name>
    <type>' . htmlspecialchars($activity['type']) . '</type>
    <trkseg>';

$latlngs = $streams['latlng']['data'];
$altitudes = isset($streams['altitude']['data']) ? $streams['altitude']['data'] : [];
$times = isset($streams['time']['data']) ? $streams['time']['data'] : [];

foreach ($latlngs as $i => $latlng) {
    $point_time = clone $start_date;
    if (isset($times[$i])) {
        $point_time->add(new DateInterval('PT' . $times[$i] . 'S'));
    }
    
    $gpx .= '
      <trkpt lat="' . $latlng[0] . '" lon="' . $latlng[1] . '">';
    
    if (isset($altitudes[$i])) {
        $gpx .= '
        <ele>' . $altitudes[$i] . '</ele>';
    }
    
    $gpx .= '
        <time>' . $point_time->format('c') . '</time>';
    
    $gpx .= '
      </trkpt>';
}

$gpx .= '
    </trkseg>
  </trk>
</gpx>';

header('Content-Disposition: inline; filename="activity_' . $activity_id . '.gpx"');
echo $gpx;
exit;
