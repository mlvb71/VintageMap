/**
 * VINTAGE STRAVA MAP - FIXES
 * Solutions for multiple activity loading and event listener issues
 */

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    ACTIVITY_LOAD_DELAY: 500,  // milliseconds between requests
    MAX_CONCURRENT_ACTIVITIES: 10,
    COLORS: ['#8b4513', '#2d5016', '#8b0000', '#4a5d23', '#704214']
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
    activityQueue: [],
    isProcessing: false,
    loadedActivities: new Map(),
    currentColorIndex: 0
};

// ============================================
// SEQUENTIAL ACTIVITY LOADER
// ============================================

/**
 * Main function to load multiple Strava activities sequentially
 * @param {Array<string>} activityIds - Array of Strava activity IDs
 */
async function loadStravaActivitiesSequentially(activityIds) {
    if (state.isProcessing) {
        showNotification('Already loading activities. Please wait...', 'warning');
        return;
    }

    if (activityIds.length === 0) {
        showNotification('No activities selected', 'error');
        return;
    }

    // Confirm if loading many activities
    if (activityIds.length > CONFIG.MAX_CONCURRENT_ACTIVITIES) {
        const proceed = confirm(
            `You've selected ${activityIds.length} activities. ` +
            `This may take ${Math.round(activityIds.length * CONFIG.ACTIVITY_LOAD_DELAY / 1000)} seconds. ` +
            `Continue?`
        );
        if (!proceed) return;
    }

    state.activityQueue = [...activityIds];
    state.isProcessing = true;
    
    const totalActivities = state.activityQueue.length;
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    showProgressIndicator(totalActivities);

    // Process each activity
    while (state.activityQueue.length > 0) {
        const activityId = state.activityQueue.shift();
        processedCount++;

        updateProgress(
            processedCount, 
            totalActivities, 
            `Loading activity ${processedCount}/${totalActivities}...`
        );

        try {
            await loadSingleActivity(activityId);
            successCount++;
            console.log(`✓ Activity ${activityId} loaded successfully`);
        } catch (error) {
            errorCount++;
            console.error(`✗ Failed to load activity ${activityId}:`, error);
            // Continue with next activity instead of stopping
        }

        // Add delay between requests (except for last one)
        if (state.activityQueue.length > 0) {
            await sleep(CONFIG.ACTIVITY_LOAD_DELAY);
        }
    }

    state.isProcessing = false;
    hideProgressIndicator();

    // Show summary
    if (errorCount === 0) {
        showNotification(`✓ Successfully loaded all ${successCount} activities`, 'success');
    } else {
        showNotification(
            `Loaded ${successCount} activities. ${errorCount} failed.`, 
            'warning'
        );
    }

    // Fit map bounds to show all activities
    if (successCount > 0 && typeof fitMapToActivities === 'function') {
        fitMapToActivities();
    }
}

/**
 * Load a single Strava activity
 * @param {string} activityId - Strava activity ID
 */
async function loadSingleActivity(activityId) {
    // Check if already loaded
    if (state.loadedActivities.has(activityId)) {
        console.log(`Activity ${activityId} already loaded, skipping`);
        return;
    }

    // Fetch GPX data from PHP endpoint
    const response = await fetch(`strava-gpx.php?activity_id=${activityId}`);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const gpxText = await response.text();

    // Check if response is actually GPX
    if (!gpxText.includes('<?xml') && !gpxText.includes('<gpx')) {
        throw new Error('Invalid GPX data received');
    }

    // Parse and add to map
    const activityData = await parseGPX(gpxText);
    addActivityToMap(activityId, activityData);

    // Store in loaded activities
    state.loadedActivities.set(activityId, activityData);
}

/**
 * Parse GPX data
 * @param {string} gpxText - Raw GPX XML
 * @returns {Object} Parsed activity data
 */
async function parseGPX(gpxText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxText, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('GPX parsing error');
    }

    // Extract track name
    const name = xmlDoc.querySelector('trk > name')?.textContent || 'Unnamed Activity';

    // Extract track points
    const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));
    const coordinates = trkpts.map(pt => {
        const lat = parseFloat(pt.getAttribute('lat'));
        const lon = parseFloat(pt.getAttribute('lon'));
        const ele = parseFloat(pt.querySelector('ele')?.textContent || 0);
        const time = pt.querySelector('time')?.textContent || null;
        return { lat, lon, ele, time };
    });

    if (coordinates.length === 0) {
        throw new Error('No track points found in GPX');
    }

    // Calculate statistics
    const stats = calculateStats(coordinates);

    return {
        name,
        coordinates,
        stats
    };
}

/**
 * Calculate activity statistics
 * @param {Array} coordinates - Array of coordinate objects
 * @returns {Object} Statistics
 */
function calculateStats(coordinates) {
    if (coordinates.length === 0) return {};

    let distance = 0;
    let elevationGain = 0;
    let elevationLoss = 0;

    for (let i = 1; i < coordinates.length; i++) {
        const prev = coordinates[i - 1];
        const curr = coordinates[i];

        // Calculate distance using Haversine formula
        distance += haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);

        // Calculate elevation change
        const elevChange = curr.ele - prev.ele;
        if (elevChange > 0) {
            elevationGain += elevChange;
        } else {
            elevationLoss += Math.abs(elevChange);
        }
    }

    // Get min/max elevation
    const elevations = coordinates.map(c => c.ele);
    const minElevation = Math.min(...elevations);
    const maxElevation = Math.max(...elevations);

    return {
        distance: distance / 1000, // km
        elevationGain,
        elevationLoss,
        minElevation,
        maxElevation,
        points: coordinates.length
    };
}

/**
 * Haversine distance formula
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Add activity to map
 * @param {string} activityId - Activity ID
 * @param {Object} activityData - Parsed activity data
 */
function addActivityToMap(activityId, activityData) {
    // Get color for this activity
    const color = CONFIG.COLORS[state.currentColorIndex % CONFIG.COLORS.length];
    state.currentColorIndex++;

    // Convert coordinates to map format [lat, lng]
    const latLngs = activityData.coordinates.map(c => [c.lat, c.lon]);

    // Create polyline on map (assumes Leaflet)
    if (typeof L !== 'undefined' && window.map) {
        const polyline = L.polyline(latLngs, {
            color: color,
            weight: 3,
            opacity: 0.8
        }).addTo(window.map);

        // Add popup with activity info
        const popupContent = `
            <div style="font-family: 'Courier New', monospace; color: #3d2817;">
                <strong>${activityData.name}</strong><br>
                Distance: ${activityData.stats.distance.toFixed(2)} km<br>
                Elevation: ${Math.round(activityData.stats.elevationGain)} m gain<br>
                Points: ${activityData.stats.points}
            </div>
        `;
        polyline.bindPopup(popupContent);

        // Store reference
        if (!window.activityLayers) {
            window.activityLayers = new Map();
        }
        window.activityLayers.set(activityId, polyline);
    }

    // Update elevation profile if function exists
    if (typeof updateElevationProfile === 'function') {
        updateElevationProfile(activityData);
    }
}

// ============================================
// EVENT LISTENER MANAGEMENT
// ============================================

/**
 * Attach all event listeners after DOM updates
 * Call this function after any innerHTML manipulation
 */
function attachEventListeners() {
    console.log('Attaching event listeners...');

    // Select Activities button
    attachListener('#select-activities-btn', 'click', handleSelectActivities);
    
    // Select All button
    attachListener('#select-all-btn', 'click', selectAllActivities);
    
    // Clear Selection button
    attachListener('#clear-selection-btn', 'click', clearAllActivities);
    
    // Activity checkboxes
    const checkboxes = document.querySelectorAll('.activity-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectionCount);
    });

    // Disconnect Strava button
    attachListener('#disconnect-strava-btn', 'click', disconnectStrava);

    // Load more activities button (pagination)
    attachListener('#load-more-activities', 'click', loadMoreActivities);

    // Update selection count on page load
    updateSelectionCount();
}

/**
 * Helper to attach a single event listener safely
 * @param {string} selector - CSS selector
 * @param {string} event - Event type
 * @param {Function} handler - Event handler function
 */
function attachListener(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
        // Clone to remove old listeners
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        // Add new listener
        newElement.addEventListener(event, handler);
        console.log(`✓ Attached ${event} listener to ${selector}`);
    }
}

/**
 * Handle select activities button click
 */
function handleSelectActivities() {
    const selectedCheckboxes = document.querySelectorAll('.activity-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
        showNotification('Please select at least one activity', 'error');
        return;
    }

    // Close the activity modal if it exists
    const modal = document.getElementById('strava-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Load activities
    loadStravaActivitiesSequentially(selectedIds);
}

/**
 * Select all activity checkboxes
 */
function selectAllActivities() {
    document.querySelectorAll('.activity-checkbox').forEach(cb => {
        cb.checked = true;
    });
    updateSelectionCount();
}

/**
 * Clear all activity selections
 */
function clearAllActivities() {
    document.querySelectorAll('.activity-checkbox').forEach(cb => {
        cb.checked = false;
    });
    updateSelectionCount();
}

/**
 * Update selection count display
 */
function updateSelectionCount() {
    const count = document.querySelectorAll('.activity-checkbox:checked').length;
    const countDisplay = document.getElementById('selection-count');
    if (countDisplay) {
        countDisplay.textContent = count === 0 ? 'None selected' : `${count} selected`;
    }

    // Enable/disable select button
    const selectBtn = document.getElementById('select-activities-btn');
    if (selectBtn) {
        selectBtn.disabled = count === 0;
    }
}

/**
 * Disconnect from Strava
 */
async function disconnectStrava() {
    if (!confirm('Disconnect from Strava?')) return;

    try {
        const response = await fetch('strava-disconnect.php');
        if (response.ok) {
            showNotification('Disconnected from Strava', 'success');
            // Reload page or update UI
            setTimeout(() => location.reload(), 1000);
        }
    } catch (error) {
        console.error('Disconnect error:', error);
        showNotification('Failed to disconnect', 'error');
    }
}

/**
 * Load more activities (pagination)
 */
async function loadMoreActivities() {
    // Implementation depends on your pagination logic
    console.log('Load more activities...');
}

// ============================================
// UI FEEDBACK FUNCTIONS
// ============================================

/**
 * Show progress indicator
 * @param {number} total - Total number of activities
 */
function showProgressIndicator(total) {
    // Remove existing indicator
    hideProgressIndicator();

    const progressDiv = document.createElement('div');
    progressDiv.id = 'loading-progress';
    progressDiv.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; 
                    background: rgba(139, 69, 19, 0.95); 
                    padding: 20px 25px; 
                    border-radius: 8px; 
                    color: #f5e6d3; 
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    min-width: 250px;
                    font-family: 'Courier New', monospace;">
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px;">
                ⏳ Loading Activities
            </div>
            <div id="progress-text" style="margin-bottom: 10px; font-size: 12px;">
                Preparing...
            </div>
            <div style="width: 100%; height: 8px; 
                        background: rgba(245,230,211,0.3); 
                        border-radius: 4px; 
                        overflow: hidden;">
                <div id="progress-bar" 
                     style="width: 0%; 
                            height: 100%; 
                            background: linear-gradient(90deg, #f5e6d3, #d4b896); 
                            transition: width 0.3s ease;
                            border-radius: 4px;">
                </div>
            </div>
            <div id="progress-percentage" 
                 style="margin-top: 5px; font-size: 11px; text-align: right;">
                0%
            </div>
        </div>
    `;
    document.body.appendChild(progressDiv);
}

/**
 * Update progress indicator
 * @param {number} current - Current progress
 * @param {number} total - Total items
 * @param {string} message - Progress message
 */
function updateProgress(current, total, message) {
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const progressPercentage = document.getElementById('progress-percentage');

    if (progressText) progressText.textContent = message;
    
    const percentage = Math.round((current / total) * 100);
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
}

/**
 * Hide progress indicator
 */
function hideProgressIndicator() {
    const progressDiv = document.getElementById('loading-progress');
    if (progressDiv) {
        progressDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => progressDiv.remove(), 300);
    }
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
function showNotification(message, type = 'info') {
    const colors = {
        success: '#2d5016',
        error: '#8b0000',
        warning: '#8b4513',
        info: '#4a5d23'
    };

    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };

    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.cssText = `
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: ${colors[type]}; 
        padding: 15px 20px; 
        border-radius: 6px; 
        color: #f5e6d3; 
        z-index: 10001; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: 'Courier New', monospace;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
        <span style="font-weight: bold; margin-right: 8px;">${icons[type]}</span>
        ${message}
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fit map bounds to show all loaded activities
 */
function fitMapToActivities() {
    if (!window.map || !window.activityLayers || window.activityLayers.size === 0) {
        return;
    }

    const group = L.featureGroup(Array.from(window.activityLayers.values()));
    window.map.fitBounds(group.getBounds(), { padding: [50, 50] });
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize on DOM ready
 */
function initStravaFixes() {
    console.log('Initializing Strava fixes...');

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        .activity-checkbox:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #select-activities-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(style);

    // Attach initial event listeners
    attachEventListeners();

    console.log('✓ Strava fixes initialized');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStravaFixes);
} else {
    initStravaFixes();
}

// ============================================
// EXPORT FOR EXTERNAL USE
// ============================================

// Make functions available globally
window.StravaFixes = {
    loadActivities: loadStravaActivitiesSequentially,
    attachListeners: attachEventListeners,
    showNotification,
    clearActivities: () => {
        state.loadedActivities.clear();
        if (window.activityLayers) {
            window.activityLayers.forEach(layer => window.map.removeLayer(layer));
            window.activityLayers.clear();
        }
    }
};
