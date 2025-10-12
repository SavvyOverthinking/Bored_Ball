# 🚀 Quick Fix Guide - Calendar Breakout

## If Ball is Invisible

### Quick Check:
```typescript
// In src/game/MainScene.ts - createBall() method
// Look for this (GOOD):
const ballGraphics = this.add.circle(width / 2, height - 80, 12, 0x2196F3);
this.physics.add.existing(ballGraphics);

// NOT this (BAD):
graphics.generateTexture('ball', 20, 20); // ❌ Don't use this
```

### Quick Fix:
Open browser console (F12) and check for:
- Console log: `"Ball created at: X Y Visible: true"`
- Look for a **blue circle** at the bottom of the screen

---

## If Ball Won't Relaunch

### Quick Check:
```typescript
// In src/game/MainScene.ts - createBall() method
// Make sure these lines are present:
this.physics.add.collider(ball, this.paddle, this.ballHitPaddle, undefined, this);
this.physics.add.collider(ball, this.blocks, this.ballHitBlock, undefined, this);

if (ball.body) {
  ball.body.onWorldBounds = true; // ✅ CRITICAL LINE
}
```

### Quick Fix:
- Collision setup MUST be in `createBall()`, not just `setupCollisions()`
- Every new ball needs its own collision handlers

---

## If Game Won't Start

### Check These:
1. **Port 3000 in use?**
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   ```

2. **Dependencies installed?**
   ```bash
   npm install
   ```

3. **TypeScript errors?**
   ```bash
   npm run build
   ```

4. **Dev server running?**
   ```bash
   npm run dev
   ```

---

## Common Issues & Solutions

### Issue: WebGL Warnings in Console
**Solution:** Make sure you're NOT using `generateTexture()` anywhere. Use direct shapes instead:
```typescript
// ✅ GOOD
const shape = this.add.circle(x, y, r, color);
const shape = this.add.rectangle(x, y, w, h, color);

// ❌ BAD
graphics.generateTexture('name', w, h);
```

### Issue: Ball Falls Through Paddle
**Solution:** Check collision setup in `createBall()`:
```typescript
this.physics.add.collider(ball, this.paddle, this.ballHitPaddle, undefined, this);
```

### Issue: Blocks Don't Disappear
**Solution:** Check collision setup in `createBall()`:
```typescript
this.physics.add.collider(ball, this.blocks, this.ballHitBlock, undefined, this);
```

### Issue: Ball Doesn't Bounce Off Bottom
**Solution:** This is CORRECT behavior! Bottom should be open so ball falls and you lose a life.
```typescript
this.physics.world.setBoundsCollision(true, true, true, false);
//                                     top   left  right bottom
//                                                         ^ false = open
```

---

## Quick Test Procedure

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** `http://localhost:3000`

3. **Look for:**
   - Title: "📅 Calendar Breakout"
   - Calendar grid with colored meeting blocks
   - Dark gray paddle at bottom
   - **BRIGHT BLUE BALL** attached to paddle ← Most important!

4. **Test:**
   - Move mouse → Paddle follows ✓
   - Click → Ball launches upward ✓
   - Ball hits blocks → Blocks disappear ✓
   - Ball hits paddle → Ball bounces ✓
   - Ball falls off bottom → Lose life, new ball appears ✓

---

## File Checklist

### Files That MUST Have These Changes:

#### `src/game/MainScene.ts`
- [x] `createBall()` uses `this.add.circle()`
- [x] `createBall()` sets up collisions
- [x] `createBall()` sets `ball.body.onWorldBounds = true`
- [x] `createExtraBall()` uses `this.add.circle()`
- [x] `createPaddle()` uses `this.add.rectangle()`
- [x] `createBlocks()` uses `this.add.rectangle()`
- [x] NO `generateTexture()` calls anywhere

---

## Emergency Reset

If everything is broken, reset to known good state:

```bash
# 1. Stop dev server
Ctrl+C

# 2. Kill any hanging processes
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 3. Clean rebuild
rm -r node_modules
rm -r dist
npm install

# 4. Start fresh
npm run dev
```

---

## Quick Checklist

Before reporting issues, verify:

- [ ] `npm install` completed successfully
- [ ] `npm run dev` running without errors
- [ ] Browser console (F12) shows no critical errors
- [ ] Can see colored meeting blocks
- [ ] Can see dark gray paddle at bottom
- [ ] **Can see bright blue ball** (most critical!)
- [ ] Paddle moves with mouse
- [ ] Click launches ball

If all checked ✅ → Game is working!

---

## Contact / Debug Info

When reporting issues, include:

1. Browser console screenshot (F12)
2. Network tab screenshot
3. Which step in Quick Test Procedure fails
4. Node version: `node --version`
5. NPM version: `npm --version`

---

**Last Updated:** After ball visibility & relaunch fixes  
**Status:** ✅ All systems operational  
**Play at:** http://localhost:3000

