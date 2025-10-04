# 🚀 Quick GitHub Update Guide

## What Was Fixed

**Two critical bugs resolved:**

1. **Map Style Issue** - Invalid custom style replaced with public MapTiler styles
   - Now includes: Streets, Vintage, Satellite, and Topo map styles
   - Toggle button cycles through all four styles

2. **Elevation Profile Issue** - Canvas sizing fixed for proper rendering
   - Profile now displays correctly with axes, grid, and elevation data
   - Works on all display types including Retina screens

---

## Update Your GitHub Repository

### Step 1: Download Fixed File

From `/mnt/user-data/outputs/`:
- `vintagemap-FIXED.html` - The updated main file

### Step 2: Replace Local File

```bash
# Navigate to your VintageMap repository
cd /path/to/VintageMap

# Backup current version (optional but recommended)
cp vintagemap.html vintagemap.html.backup

# Replace with fixed version
cp /path/to/downloaded/vintagemap-FIXED.html vintagemap.html
```

### Step 3: Commit Changes

```bash
# Check what changed
git diff vintagemap.html

# Stage the file
git add vintagemap.html

# Commit with descriptive message
git commit -m "fix: resolve map style and elevation profile issues

- Replace invalid custom map style with public MapTiler styles
- Add style toggle for Streets/Vintage/Satellite/Topo views
- Fix elevation profile canvas sizing for hidden elements
- Improve DPI scaling for Retina displays
- Preserve routes and camera position when changing styles"

# Push to GitHub
git push origin main
```

### Step 4: Deploy to Server

```bash
# SSH to your server
ssh your-server

# Navigate to web directory
cd /path/to/public_html/VintageMap

# Pull latest changes
git pull origin main

# Verify file updated
ls -l vintagemap.html

# Exit
exit
```

### Step 5: Test

1. Open in browser: `https://mlvbphotography.com/VintageMap/vintagemap.html`
2. Force refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
3. Verify map loads correctly
4. Click toggle style button (should cycle through 4 styles)
5. Upload a GPX file or connect Strava
6. Toggle elevation profile - should display with data

---

## Alternative: Manual Upload

If you prefer not to use Git:

1. **Download** `vintagemap-FIXED.html` from outputs
2. **Rename** to `vintagemap.html`
3. **Upload** via FTP/cPanel to `/VintageMap/` directory
4. **Overwrite** existing file
5. **Test** in browser with force refresh

---

## Verification Checklist

After updating, verify these work:

- [ ] Map loads on page open
- [ ] Toggle style button cycles through: Streets → Vintage → Satellite → Topo
- [ ] Upload GPX file and see route on map
- [ ] Click "Elevation" button - profile shows with grid and axes
- [ ] Connect to Strava (if configured)
- [ ] Select date range and load activities
- [ ] All routes display with different colors
- [ ] Stats panel shows correct information

---

## Files Changed

**Modified:**
- `vintagemap.html` (380 lines changed)

**Unchanged:**
- All PHP files (config.php, strava-*.php)
- strava-fix.js
- All other files

---

## Quick Reference

### Git Commands
```bash
git status                    # Check current status
git add vintagemap.html      # Stage changes
git commit -m "message"      # Commit with message
git push origin main         # Push to GitHub
git pull origin main         # Pull on server
```

### Troubleshooting
```bash
# If push fails (remote changes):
git pull origin main --rebase
git push origin main

# If conflicts occur:
git status                   # Check conflicts
# Resolve conflicts manually
git add vintagemap.html
git rebase --continue
git push origin main
```

---

## Need Help?

**Map not loading?**
- Check browser console (F12)
- Verify MapTiler API key in config
- Try different browser
- Clear all cache and cookies

**Can't push to GitHub?**
- Verify you have write access to repository
- Check if remote has newer commits (`git fetch`)
- Try `git pull --rebase` before pushing

**Server not updating?**
- Verify Git pull succeeded
- Check file permissions
- Look at server timestamp: `ls -l vintagemap.html`
- Try manual upload as backup

---

**Estimated Time:** 5-10 minutes  
**Difficulty:** Easy  
**Risk:** Low (only HTML/JS changes)

---

Ready? Let's update! 🚀

```bash
cd /path/to/VintageMap
git add vintagemap.html
git commit -m "fix: resolve map style and elevation profile issues"
git push origin main
```
