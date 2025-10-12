# Splash Screen Setup Instructions

## 📸 Save the Splash Image

You need to save the retro arcade splash screen image to your project.

### Steps:

1. **Right-click on the image** you shared (the "Calendar Breakout" retro arcade poster)
2. **Save it as:** `splash.jpg`
3. **Location:** Save it in the `public/` folder of your project

**Full path should be:** `C:\Users\hamak\OneDrive\Documents\GitHub\Bored_Ball\public\splash.jpg`

### Quick PowerShell Command (if image is in Downloads):

```powershell
# If the image is in your Downloads folder, run this from your project root:
Copy-Item "$env:USERPROFILE\Downloads\splash.jpg" "public\splash.jpg"
```

---

## ✨ What's Implemented

### Splash Screen Flow:
1. **Game Start:** Splash screen appears
2. **Click Splash:** Hides splash, shows 3-2-1 countdown
3. **After Countdown:** Instructions appear "Click to launch!"
4. **Click Again:** Ball launches and game starts

### Week Transitions:
- After clearing Week 1, splash screen shows again
- Same flow: Click → Countdown → Launch
- Gives players breathing room between weeks

### Features:
- ✅ Splash screen scales to fit game area
- ✅ 3-2-1 countdown with retro arcade styling
- ✅ Gold text with orange stroke
- ✅ No paddle movement during countdown
- ✅ Click anywhere on splash to start countdown
- ✅ Works for both initial game and week transitions

---

## 🎮 Testing Locally

Once you've saved the image:

```bash
pnpm run dev
# or
npm run dev
```

Open `http://localhost:3000` and you should see:
1. Splash screen immediately
2. Click it to see 3-2-1 countdown
3. Click to launch ball
4. Clear all blocks
5. Splash appears again for Week 2!

---

## 🚨 Troubleshooting

### "Failed to load texture 'splash'" error
- Make sure the image is saved as `public/splash.jpg`
- Check the filename is exactly `splash.jpg` (lowercase)
- The image must be in the `public/` folder, not `public/sprites/`

### Image doesn't display
- Check browser console for errors
- Try hard refresh (Ctrl+Shift+R)
- Verify image path in browser: `http://localhost:3000/splash.jpg`

### Countdown doesn't start
- Make sure you're clicking directly on the splash image
- Check browser console for JavaScript errors

---

## 📝 Code Changes Made

Modified files:
- `src/game/MainScene.ts` - Added splash screen and countdown logic

New properties:
- `splashImage` - The splash screen image
- `countdownText` - The 3-2-1 countdown text
- `isCountingDown` - State flag to prevent input during countdown

New methods:
- `createSplashScreen()` - Initialize splash and countdown elements
- `showSplashScreen()` - Display splash at game/week start
- `hideSplashAndStartCountdown()` - Transition from splash to countdown
- `startCountdown()` - Run 3-2-1 countdown sequence

---

## 🎨 Customization

### Change Countdown Style
Edit the `createSplashScreen()` method in `MainScene.ts`:

```typescript
this.countdownText = this.add.text(width / 2, height / 2, '', {
  fontFamily: 'Impact, Arial Black, sans-serif',  // Change font
  fontSize: '120px',                              // Change size
  color: '#FFD700',                               // Change color
  stroke: '#FF6600',                              // Change outline
  strokeThickness: 8,                             // Change thickness
});
```

### Change Countdown Speed
Modify the timer delay in `startCountdown()`:

```typescript
const countdownTimer = this.time.addEvent({
  delay: 1000,  // Change to 500 for faster, 1500 for slower (milliseconds)
  repeat: 2,
  // ...
});
```

---

Once you save the image, commit everything and push:

```bash
git add public/splash.jpg src/game/MainScene.ts
git commit -m "FEATURE: Add splash screen and 3-2-1 countdown for game start and week transitions"
git push origin main
```

