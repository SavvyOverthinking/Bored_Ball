# 🚀 Implementation Roadmap

## ✅ Completed (Already in Repo)

### Infrastructure
- [x] CI/CD workflows (`.github/workflows/ci.yml`, `pages.yml`)
- [x] ESLint + Prettier setup
- [x] TypeScript configuration
- [x] Node 20 requirement (`.nvmrc`, `package.json` engines)
- [x] MIT License
- [x] Professional README

### Game Core
- [x] Phaser 3 + React + TypeScript architecture
- [x] Outlook-styled visual design
- [x] 52-week progression system
- [x] Multi-hit block system (Boss: 3, Team/1:1: 2, Lunch/Personal: 1)
- [x] Physics effects per meeting type
- [x] Max 3 balls limit
- [x] 36 meetings with 15-min slots & double bookings

### New Systems (Just Added)
- [x] Constants system (`src/game/constants.ts`)
- [x] Theme system (`src/game/theme.ts`) - Outlook/Google/Default
- [x] Ball pooling (`src/game/BallPool.ts`)
- [x] Deterministic paddle physics helpers
- [x] Utility functions for time/duration
- [x] Sprite atlas structure (`public/sprites/`)

---

## 🔨 Priority 1: Physics Polish (Next PR)

### Deterministic Paddle Bounce
**File:** `src/game/MainScene.ts`

```typescript
// In ballHitPaddle()
private ballHitPaddle(ball: any, paddle: any) {
  const angle = calculatePaddleBounceAngle(ball.x, paddle.x, PHYSICS.PADDLE_WIDTH);
  const speed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
  const clampedSpeed = Phaser.Math.Clamp(speed, PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
  
  ball.body.setVelocity(
    Math.sin(angle) * clampedSpeed,
    -Math.cos(angle) * clampedSpeed
  );
}
```

### Global Velocity Clamping
**File:** `src/game/MainScene.ts`

```typescript
// In setupCollisions()
this.physics.world.on('collide', (obj1: any) => {
  if (obj1?.body && 'velocity' in obj1.body) {
    const v = new Phaser.Math.Vector2(obj1.body.velocity.x, obj1.body.velocity.y);
    const clamped = clampVelocity(v);
    obj1.body.setVelocity(clamped.x, clamped.y);
  }
});
```

### Integrate Ball Pool
**Replace:** Manual ball array management  
**With:** `BallPool` instance

```typescript
// create()
this.ballPool = new BallPool(this);
const ball = this.ballPool.spawn(x, y, vx, vy);

// update()
this.ballPool.killIfOffscreen();

// Team meeting split
for (let i = 0; i < PHYSICS.SPLIT_COUNT; i++) {
  const angle = Phaser.Math.DegToRad(Phaser.Math.Between(-25, 25));
  const v = clampVelocity(/* rotated velocity */);
  this.ballPool.spawn(ball.x, ball.y, v.x, v.y);
}
```

---

## 📊 Priority 2: Duration-Aware Layout

### Update Meeting Schema
**Status:** ✅ Already using `startTime`/`endTime` in `mockCalendar.json`

### Calculate Block Heights by Duration
**File:** `src/game/calendarGenerator.ts`

```typescript
import { minutesBetween } from './utils';

function calculateBlockDimensions(meeting: Meeting) {
  const duration = minutesBetween(meeting.startTime, meeting.endTime);
  const totalMinutes = (WORK_HOURS.END - WORK_HOURS.START) * 60;
  
  // Height based on actual duration, min 20px for visibility
  const blockHeight = Math.max(20, (duration / totalMinutes) * gridHeight);
  
  return { x, y, width, height: blockHeight };
}
```

### Visual Differences
- 15-min meetings: ~20-25px tall
- 30-min meetings: ~40-50px tall
- 45-min meetings: ~60-70px tall
- 60-min meetings: ~80-90px tall

---

## 🎨 Priority 3: Spritesheet Integration

### Load Atlas
**File:** `src/game/MainScene.ts`

```typescript
preload() {
  // Check if sprites exist
  if (this.textures.exists('ui')) return;
  
  this.load.atlas(
    'ui',
    '/sprites/outlook_sprites.png',
    '/sprites/outlook_sprites.json'
  );
}

create() {
  // Optional: Use sprite background
  if (this.textures.exists('ui')) {
    this.add.image(450, 300, 'ui', 'bg_grid');
  }
}
```

### Dynamic Block Sprites
```typescript
// In createBlocks()
const duration = minutesBetween(blockData.startTime, blockData.endTime);
const spriteKey = getEventKeyByDuration(duration);

if (this.textures.exists('ui')) {
  const block = this.add.image(x, y, 'ui', spriteKey);
  block.setTint(parseInt(blockData.color.replace('#', '0x')));
} else {
  // Fallback to current rectangle rendering
}
```

---

## 🎮 Priority 4: UX & Accessibility

### Keyboard Controls
**File:** `src/game/MainScene.ts`

```typescript
private setupKeyboardControls() {
  this.input.keyboard?.on('keydown-SPACE', () => {
    if (this.scene.isPaused()) {
      this.scene.resume();
    } else {
      this.scene.pause();
    }
  });

  this.input.keyboard?.on('keydown-R', () => {
    this.scene.restart();
  });

  this.input.keyboard?.on('keydown-M', () => {
    this.sound.mute = !this.sound.mute;
  });
}
```

### In-Game Legend
```typescript
private createLegend() {
  const legend = this.add.text(CANVAS.WIDTH - 12, 70,
    'Space: Pause • R: Restart • M: Mute\n' +
    '1:1 +10% • Team Split • Boss Fast • Lunch Slow • Personal Reset',
    {
      fontSize: '10px',
      color: '#605e5c',
      fontFamily: 'Segoe UI, Inter',
      align: 'right',
      lineSpacing: 4
    }
  ).setOrigin(1, 0).setAlpha(0.7).setDepth(200);
}
```

### Reduced Motion Support
```typescript
// In create()
if (prefersReducedMotion()) {
  // Reduce base speed
  PHYSICS.BASE_SPEED = 200;
  PHYSICS.MAX_SPEED = 500;
  
  // Disable particle effects (when added)
  this.particlesEnabled = false;
}
```

---

## 📦 Suggested PR Order

### PR #1: `physics-polish`
**Changes:**
- Integrate `BallPool`
- Deterministic paddle bounce
- Global velocity clamping
- Update `physicsModifiers.ts` to use pool

**Tests:**
- [ ] Ball speed never exceeds MAX_SPEED
- [ ] Paddle bounce is consistent and predictable
- [ ] No FPS drops with 3 balls active
- [ ] Split balls respect max count

### PR #2: `duration-layout`
**Changes:**
- Update `calendarGenerator.ts` to use duration
- Import `minutesBetween` from utils
- Render blocks with accurate heights
- Update mock data if needed

**Tests:**
- [ ] 15-min meetings are small
- [ ] 60-min meetings are tall
- [ ] Blocks align with time grid
- [ ] No visual gaps

### PR #3: `outlook-spritesheet`
**Changes:**
- Add sprite loading in `preload()`
- Conditional sprite vs. rectangle rendering
- Tint sprites by meeting type
- Document sprite generation process

**Tests:**
- [ ] Game works with or without sprites
- [ ] Sprites load correctly
- [ ] Tinting applies properly
- [ ] Fallback to rectangles if sprites missing

### PR #4: `ux-controls`
**Changes:**
- Add keyboard event listeners
- Create in-game legend
- Implement pause/resume
- Add reduced motion support
- Sound mute toggle (prep for future audio)

**Tests:**
- [ ] Space pauses/resumes
- [ ] R restarts level
- [ ] M toggles mute flag
- [ ] Legend visible and readable
- [ ] Reduced motion detected and applied

---

## 🔮 Future Enhancements

### Sound System
- [ ] Paddle bounce sound
- [ ] Block destroy sound
- [ ] Power-up pickup
- [ ] Background music

### Particles & Polish
- [ ] Block destruction particles
- [ ] Ball trail effect
- [ ] Screen shake on boss hit
- [ ] Combo counter

### Calendar API Integration
- [ ] Google Calendar OAuth2 PKCE
- [ ] Microsoft Graph (Outlook)
- [ ] Real-time event sync
- [ ] Custom meeting import

### Gameplay Depth
- [ ] Power-ups (wide paddle, slow ball, shield)
- [ ] Difficulty scaling per week
- [ ] Boss fight weeks (weeks 13, 26, 39, 52)
- [ ] Achievement system

---

## 📊 Current Status

| Category | Status | Files |
|----------|--------|-------|
| Infrastructure | ✅ Complete | CI/CD, linting, typing |
| Core Game | ✅ Complete | 52 weeks, multi-hit, effects |
| Ball Pooling | ✅ Ready | `BallPool.ts` created |
| Physics Helpers | ✅ Ready | `constants.ts` updated |
| Duration Utils | ✅ Ready | `utils.ts` created |
| Theme System | ✅ Ready | `theme.ts` created |
| **Integration** | ⏳ Next | Wire new systems into MainScene |
| Sprites | 📋 Pending | Need PNG generation |
| UX Controls | 📋 Pending | Keyboard, legend, a11y |

---

## 🎯 Next Actions

1. **Create PR #1: Physics Polish**
   - Branch: `feature/physics-polish`
   - Integrate BallPool, deterministic bounce, velocity clamping
   - Target: **This Week**

2. **Create PR #2: Duration Layout**
   - Branch: `feature/duration-layout`
   - Calculate heights from meeting duration
   - Target: **This Week**

3. **Generate Sprite Assets**
   - Export PNGs per design guide
   - Run TexturePacker
   - Target: **Next Week**

4. **Create PR #3: UX Controls**
   - Branch: `feature/ux-controls`
   - Keyboard, legend, accessibility
   - Target: **Next Week**

---

**Repository:** https://github.com/SavvyOverthinking/Bored_Ball  
**Current Branch:** `main`  
**Last Commit:** `649b032` - Production improvements

