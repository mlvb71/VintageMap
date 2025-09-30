<?php
require_once 'config.php';

// Clear session
session_destroy();

// Redirect back
header('Location: ' . BASE_URL . '/vintagemap.html');
?>