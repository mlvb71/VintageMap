# VintageMap Fix - Quick Reference

## 🎯 What's Fixed

| Issue | Before | After |
|-------|--------|-------|
| Map Style | ❌ Invalid custom ID - map won't load | ✅ 4 public styles with toggle button |
| Elevation | ❌ Empty canvas - sizing fails | ✅ Full profile with axes and grid |

## 📦 Files to Update

**Download from outputs:**
- `vintagemap-FIXED.html`

**Rename and replace:**
- `vintagemap-FIXED.html` → `vintagemap.html`

## ⚡ Update Commands

```bash
# Local repository
cd /path/to/VintageMap
cp vintagemap-FIXED.html vintagemap.html
git add vintagemap.html
git commit -m "fix: map style and elevation profile issues"
git push origin main

# Server
ssh your-server
cd /path/to/VintageMap
git pull origin main
```

## ✅ Test Checklist

1. Map loads on page open
2. Toggle button cycles through 4 styles
3. Upload GPX - route displays
4. Click "Elevation" - profile shows correctly
5. Connect Strava (if configured)

## 🔧 Key Changes

### Map Styles (Line ~377)
```javascript
// OLD
MAP_STYLE: 'https://api.maptiler.com/maps/INVALID/style.json'

// NEW  
MAP_STYLES: {
  streets: '...streets/style.json',
  vintage: '...toner/style.json',
  satellite: '...hybrid/style.json',
  topo: '...outdoor/style.json'
}
```

### Elevation Profile (Line ~697)
```javascript
// NEW - Reliable sizing
const wasHidden = elements.elevationProfile.style.display === 'none';
if (wasHidden) elements.elevationProfile.style.display = 'block';

void canvas.offsetHeight;  // Force reflow

const container = elements.elevationProfile;
const containerRect = container.getBoundingClientRect();
const canvasWidth = (containerRect.width > 0 ? containerRect.width : 600) - 40;

const dpr = window.devicePixelRatio || 1;
canvas.width = canvasWidth * dpr;
canvas.height = canvasHeight * dpr;
ctx.scale(dpr, dpr);
```

## 📝 Commit Message

```
fix: resolve map style and elevation profile issues

- Replace invalid custom map style with public MapTiler styles
- Add style toggle for Streets/Vintage/Satellite/Topo views
- Fix elevation profile canvas sizing for hidden elements
- Improve DPI scaling for Retina displays
- Preserve routes and camera position when changing styles
```

## 🚨 Important Notes

- **No PHP files changed** - all backend code unchanged
- **Backward compatible** - all existing features work
- **Clear cache** after deploying - Ctrl+Shift+R / Cmd+Shift+R
- **Test locally first** if possible

## 🆘 Quick Troubleshooting

**Map blank?**
→ Clear cache, check console (F12)

**Elevation empty?**
→ Verify activities have elevation data, toggle off/on

**Can't push to Git?**
→ `git pull --rebase` then `git push`

---

**Ready to Deploy:** ✅  
**Time Required:** 5-10 minutes  
**Risk Level:** Low  

---

💡 **Tip:** Test with a single GPX file before connecting Strava to verify basic functionality.
