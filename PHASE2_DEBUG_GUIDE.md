# Phase 2 Debugging Guide

## Issues Fixed (Latest Commit: 7387883)

### 1. ✅ Scene Initialization
- **Problem:** Scene wasn't receiving tuning data on first load
- **Fix:** Added explicit initialization in `CalendarBreakoutPhase2.tsx` with proper tuning
- **Verify:** Check browser console for `✅ Using provided tuning for week X`

### 2. ✅ Week Display
- **Problem:** Week number wasn't updating in UI
- **Fix:** Re-enabled `updateWeek()` method with proper text lookup
- **Verify:** Top-left corner should show "Week: X / 52" and update when changing weeks

### 3. ✅ Random Calendar
- **Problem:** Calendar looked the same as v1.0
- **Fix:** Ensured `generateWeek()` is called with proper week number
- **Verify:** Check console for meeting generation stats

---

## How to Verify Phase 2 is Working

### Open Browser Console (F12)

You should see these logs when the game loads:

```
🎮 Phase 2 initialized: { scenes: [...], features: [...] }
🎮 Phase 2 Scene Init - Data received: { week: 1, tuning: {...}, ... }
✅ Using provided tuning for week 1
📈 Week 1 Tuning Applied: { density: 0.35, ... }
📊 Expected: 35% density, 2 max balls, 220 px/s speed
✨ Phase 2: Generated X meetings for week 1
📊 Render stats: X blocks (including Y in double-bookings)
🎨 Meeting types: Boss=X, Team=Y, Lunch=Z
📅 Week UI updated: 1 / 52
```

### Check Random Calendar

**Week 1 (Gentle):**
- Should see ~20-25 meetings (35% density)
- Most blocks should be tall (45+ minute meetings)
- Very few Boss meetings (red, 4% rate)
- Lots of Lunch breaks (yellow, 20% rate)

**Week 10 (Moderate):**
```
http://localhost:3003/Bored_Ball/?week=10
```
- Should see ~35-40 meetings (50% density)
- Some double-booked meetings (side-by-side)
- More Boss meetings visible

**Week 25 (Hard):**
```
http://localhost:3003/Bored_Ball/?week=25
```
- Should see ~50+ meetings (65% density)
- Many double-bookings
- Lots of Boss meetings (red blocks)
- Smaller blocks (30-minute meetings)

### Check Week Display

1. Load game → Should say "Week: 1 / 52" (top-left)
2. Complete week → Should advance to "Week: 2 / 52"
3. Use URL param `?week=25` → Should show "Week: 25 / 52"

### Check Cheat Codes

**During Gameplay:**

| Cheat | Expected Result | Console Log |
|-------|-----------------|-------------|
| `Ctrl+Shift+↑` | Jump to next week | `DEV: Jumping to Week X` |
| `Ctrl+Shift+↓` | Jump to previous week | `DEV: Jumping to Week X` |
| `Ctrl+Shift+L` | Add 1 life | `DEV: +1 Life (X total)` |
| `Ctrl+Shift+B` | Spawn extra ball | `DEV: Extra ball spawned` |

**Toast Should Appear:**
- Bottom-center of screen
- Dark gray background
- White text
- Fades out after 2 seconds

### Check Weekend Bonus Stage

**Every 5th Week:**
- Week 5, 10, 15, 20, 25, 30, 35, 40, 45, 50

**To Test:**
1. Go to week 5: `http://localhost:3003/Bored_Ball/?week=5`
2. Complete the calendar
3. Should see: **"WEEKEND BONUS STAGE"** scene
4. 30-second timer should count down
5. Emails should fall from top
6. Dodge with paddle
7. Success → Bonus points → Return to week 6

**Console Logs:**
```
🌴 Week 5 - WEEKEND BONUS STAGE!
```

---

## Troubleshooting

### ❌ "Calendar looks the same as v1.0"

**Check Console For:**
- ✅ `Generated X meetings for week 1` ← Should be ~20-25 for week 1
- ✅ `Meeting types: Boss=X, Team=Y, Lunch=Z` ← Stats should match tuning

**If you see:**
- ⚠️ `No tuning provided! Using fallback` ← Scene init issue
- ⚠️ Meeting count ~40+ for week 1 ← Not using Phase 2 generator

**Fix:**
- Hard refresh: `Ctrl+Shift+R`
- Clear cache and reload
- Check that URL is `/Bored_Ball/` (not just `/`)

### ❌ "Week number doesn't change"

**Check Console For:**
- ✅ `Week UI updated: X / 52`

**If missing:**
- Week text element not found (DOM issue)
- Hard refresh page

### ❌ "Cheat codes don't work"

**Check:**
1. Game must be **actively playing** (not paused, not on splash)
2. Hold `Ctrl+Shift` then press arrow key
3. Look for toast notification (bottom-center)
4. Check console for `DEV: Jumping to Week X`

**Common Issues:**
- Keys pressed too fast (hold Ctrl+Shift, then press arrow)
- Game not in focus (click game first)
- Pointer locked (press ESC first)

### ❌ "Weekend stage doesn't appear"

**Check Week Number:**
- Must be week 5, 10, 15, 20, 25, 30, 35, 40, 45, or 50
- Try: `?week=5` and complete the calendar

**Console Should Show:**
- `🌴 Week 5 - WEEKEND BONUS STAGE!`

**If Not Working:**
- Check `WeekendStageScene` is registered
- Check router `isBonusWeek()` function
- Hard refresh

---

## Current URLs for Testing

```bash
# Week 1 (Gentle)
http://localhost:3003/Bored_Ball/

# Week 5 (First weekend bonus)
http://localhost:3003/Bored_Ball/?week=5

# Week 10 (Moderate, second bonus)
http://localhost:3003/Bored_Ball/?week=10

# Week 25 (Hard)
http://localhost:3003/Bored_Ball/?week=25

# Week 52 (Brutal)
http://localhost:3003/Bored_Ball/?week=52
```

---

## Expected Differences vs v1.0

| Feature | v1.0 | Phase 2 |
|---------|------|---------|
| **Calendar** | Static ~40 meetings | Random 20-60 meetings |
| **Week 1** | Same difficulty | Gentle (35% density) |
| **Week 52** | Same difficulty | Brutal (80% density) |
| **Double bookings** | None | Yes (week 4+, ~6% rate) |
| **Weekend bonus** | No | Yes (every 5th week) |
| **Power-ups** | No | Yes (1 per week) |
| **Cheat codes** | No | Yes (Ctrl+Shift+Arrows) |
| **URL params** | No | Yes (?week=X) |

---

## Next Steps

1. ✅ Open http://localhost:3003/Bored_Ball/
2. ✅ Open browser console (F12)
3. ✅ Verify console logs match expected output
4. ✅ Check week display updates
5. ✅ Try URL param: `?week=10`
6. ✅ Try cheat codes during play
7. ✅ Go to week 5 and complete to see weekend bonus

**If issues persist after refresh:**
- Share console log output
- Specify which feature isn't working
- Include week number and URL used

