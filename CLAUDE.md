# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Calendar Breakout (Bored Ball)** - An Outlook-styled breakout game where players destroy calendar meetings across 52 weeks. Built with React, TypeScript, and Phaser 3.

**Key Architecture:** React wrapper around Phaser 3 game engine with a dual-version system (v1.0 legacy + Phase 2 enhanced).

---

## Build & Development Commands

### Development
```bash
# Phase 2 (Enhanced - Default)
npm run dev              # Port 3000
npm run dev:phase2       # Port 3003 (explicit)

# v1.0 (Legacy)
npm run dev:v1           # Port 3000

# Type checking (ALWAYS run before commits)
npm run typecheck

# Linting
npm run lint
npm run format
```

### Production Build
```bash
# Phase 2 (default)
npm run build            # Outputs to dist/index-phase2.html

# v1.0 (legacy)
npm run build:v1         # Outputs to dist/index.html

# Preview
npm run preview          # Port 4173
```

### Deployment (GitHub Pages)
**This project uses PRE-BUILT deployment** to avoid CI issues:
```bash
npm run build                          # Build locally
git add -A && git commit -m "deploy"   # Commit dist/ folder (NOT in .gitignore)
git push origin main                   # Push - GitHub Actions deploys pre-built dist/
```

### Testing Specific Weeks
Add URL parameter to test progression:
```
http://localhost:3003/Bored_Ball/?week=20
```

---

## Architecture & Code Structure

### Phase 1 vs Phase 2 System

**This repository maintains TWO versions in parallel:**

**Phase 1 (v1.0 - Legacy):**
- Entry: `index.html` → `src/main.tsx` → `src/App.tsx`
- Scene: `src/game/MainScene.ts`
- Generator: `src/game/calendarGenerator.ts`
- Features: Basic breakout gameplay, 36 static meetings

**Phase 2 (Enhanced - Current):**
- Entry: `index-phase2.html` → `src/main-phase2.tsx` → `src/App-phase2.tsx`
- Scene: `src/game/MainScenePhase2.ts` (extends `BaseCalendarScene.ts`)
- Generator: `src/game/calendarGeneratorPhase2.ts`
- Features: 52-week progression, power-ups, weekend stages, difficulty curve

**Build System:** Vite checks `VITE_PHASE2=1` env var to switch between versions.

### Critical Game Systems

#### 1. Week Progression System (Phase 2 Only)

**Location:** `src/game/calendarGeneratorPhase2.ts`

**3-Tier System:**
- **Week 1:** `generateWeek1Onboarding()` - 10 grey blocks, tutorial
- **Week 2:** `generateWeek2Basics()` - 8 blocks, introduce meeting types
- **Weeks 3-20:** `generateWeeks3to20Progressive(week)` - Progressive ramp-up
- **Weeks 21-52:** `generateWeeks21PlusCurve(week)` - Uses `levelCurve.ts` system

**CRITICAL:** Game ALWAYS starts at Week 1 (hardcoded in `CalendarBreakoutPhase2.tsx:56`). NO saved progress.

**Documentation:** See `WEEK_PROGRESSION_SYSTEM.md` for complete specification.

#### 2. Level Curve System (Phase 2)

**Location:** `src/game/levelCurve.ts`

**Provides progressive difficulty tuning:**
```typescript
export type LevelTuning = {
  week: number;
  density: number;        // 0.35 → 0.80 (Week 21 → 52)
  bossRate: number;       // 0.04 → 0.14
  teamRate: number;       // 0.10 → 0.25
  lunchRate: number;      // 0.20 → 0.10
  minBlockMins: number;   // 45 → 15 minutes
  ballMaxCount: number;   // 2 → 4 balls
  paddleScale: number;    // 1.2× → 0.85× width
  baseSpeed: number;      // 220 → 300 px/s
};
```

**Used by:** `generateWeeks21PlusCurve()` for Weeks 21-52.

#### 3. Type Safety System

**Location:** `src/game/types.ts`

**ALL game objects use strict TypeScript types - ZERO `any` types allowed.**

**Key Interfaces:**
- `PhaserBall` - Ball game objects with physics body
- `PhaserBlock` - Meeting blocks with custom data
- `PhaserPaddle` - Paddle (Rectangle | Sprite union type)
- `PowerUpContainer` - Power-up game objects
- `PowerUpScene` - Extended scene with power-up methods

**Documentation:** See `TYPE_SAFETY_IMPROVEMENTS.md` for complete guide.

**RULE:** When adding new Phaser objects, create proper type definitions instead of using `any`.

#### 4. Power-Up System (Phase 2)

**Location:** `src/game/powerups.ts`

**5 Power-ups (ONE per week):**
- ☕ Coffee - Stabilize ball speed (15s)
- 🍻 Happy Hour - Wide paddle (30s)
- 🛡️ DND - Shield (blocks 1 life loss)
- 📅 Reschedule - Clear current hour (instant)
- 🧹 Cleanup - Soften 3 meetings (instant)

**Spawning:** `MainScenePhase2.ts` spawns power-up 8-16s into each week.

**Implementation:** Power-ups call methods on `PowerUpScene` interface (defined in `types.ts`).

#### 5. Meeting Physics System

**Location:** `src/game/physicsModifiers.ts`

**Meeting Types & Effects:**
```typescript
type MeetingType = '1:1' | 'team' | 'boss' | 'lunch' | 'personal';

// Each type modifies ball physics on collision:
'1:1'      → +10% speed
'team'     → Split ball (max 3 total)
'boss'     → Speed ×1.8 (brutal)
'lunch'    → Normalize speed (relief)
'personal' → Reset bounce angle
```

**Hit Points:** Boss (3), Team/1:1 (2), Lunch/Personal (1)

#### 6. Ball Pool System

**Location:** `src/game/BallPool.ts`

**Efficient multi-ball management:**
- Spawns balls from object pool (no runtime allocation)
- Max balls enforced by `tuning.ballMaxCount`
- All balls typed as `PhaserBall`

#### 7. Weekend Bonus Stage (Phase 2)

**Location:** `src/game/WeekendStageScene.ts`

**Triggered:** Every 5th week (5, 10, 15, etc.)

**Gameplay:** Dodge falling emails for bonus points.

**Router:** `src/game/phase2Router.ts` handles week-to-scene transitions.

### React ↔ Phaser Integration

**React Side:**
- `CalendarBreakoutPhase2.tsx` creates Phaser game instance
- Initializes with `week: 1, score: 0, lives: 3`
- Passes `tuning` object to scene

**Phaser Side:**
- `MainScenePhase2.init(data)` receives week/score/lives
- Checks URL params for week override (`?week=X`)
- Calls `generateWeek(week)` to build calendar

**Key Pattern:**
```typescript
// React creates Phaser game
const game = new Phaser.Game(config);

// React starts scene with data
game.scene.start('CalendarScenePhase2', {
  week: 1,
  score: 0,
  lives: 3,
  tuning: { /* LevelTuning object */ }
});

// Phaser scene receives data
init(data: { week: number, score: number, lives: number, tuning: LevelTuning }) {
  this.currentWeek = data.week;
  // ...
}
```

---

## Important Patterns & Conventions

### Deterministic Calendar Generation

**Uses seeded RNG (`src/game/rng.ts`):**
```typescript
const rand = mulberry32(0xB0B0 + week); // Same week = same calendar
const day = Math.floor(rand() * 5);      // Deterministic
```

**Why:** Players can retry same week with consistent layout.

### Scene Restart Pattern (Phase 2)

**On loss/quit, ALWAYS restart at Week 1:**
```typescript
// MainScenePhase2.ts:403
this.scene.restart({ week: 1, score: 0, lives: 3 });
```

**NO localStorage, NO saved progress in Phase 2.**

### Collision Handler Typing

**Phaser collision callbacks don't provide typed parameters. Wrap them:**
```typescript
// WRONG (Phaser gives GameObject, not typed):
this.physics.add.collider(ball, block, this.ballHitBlock);

// CORRECT (wrap with type assertion):
this.physics.add.collider(
  ball,
  block,
  (ballObj, blockObj) => {
    this.ballHitBlock(ballObj as PhaserBall, blockObj as PhaserBlock);
  }
);
```

### Null Safety for Physics Bodies

**Physics bodies can be null - ALWAYS check:**
```typescript
const ballBody = ball.body;
if (!ballBody) return; // Early return
ballBody.setVelocity(x, y); // Safe to use
```

### Theme System

**Location:** `src/game/theme.ts`

**URL parameter:** `?theme=outlook|google|default`

**Provides:** Meeting colors, fonts, calendar styles per theme.

---

## File Organization

```
src/
├── components/
│   ├── CalendarBreakout.tsx        # Phase 1 wrapper
│   └── CalendarBreakoutPhase2.tsx  # Phase 2 wrapper (current)
├── game/
│   ├── BaseCalendarScene.ts        # Shared scene logic
│   ├── MainScene.ts                # Phase 1 scene
│   ├── MainScenePhase2.ts          # Phase 2 scene ⭐
│   ├── WeekendStageScene.ts        # Weekend bonus stage
│   ├── calendarGenerator.ts        # Phase 1 generator
│   ├── calendarGeneratorPhase2.ts  # Phase 2 generator ⭐
│   ├── levelCurve.ts               # Difficulty curve ⭐
│   ├── powerups.ts                 # Power-up system ⭐
│   ├── physicsModifiers.ts         # Meeting effects
│   ├── phase2Router.ts             # Week/weekend routing
│   ├── BallPool.ts                 # Ball pooling
│   ├── types.ts                    # Type definitions ⭐
│   ├── constants.ts                # Game balance values
│   ├── theme.ts                    # Visual themes
│   ├── soundEffects.ts             # Audio (basic)
│   ├── rng.ts                      # Seeded random
│   └── utils.ts                    # Helpers
├── config/
│   └── flags.ts                    # Feature flags
├── App.tsx                         # Phase 1 entry
├── App-phase2.tsx                  # Phase 2 entry
├── main.tsx                        # Phase 1 main
└── main-phase2.tsx                 # Phase 2 main
```

---

## Development Workflow

### Adding a New Week Feature

1. **Modify generator:** `src/game/calendarGeneratorPhase2.ts`
2. **Update progression doc:** `WEEK_PROGRESSION_SYSTEM.md`
3. **Test specific weeks:** `?week=1`, `?week=10`, `?week=20`, `?week=52`
4. **Run type check:** `npm run typecheck`
5. **Test restart behavior:** Verify Week 1 restart on loss

### Adding a New Power-Up

1. **Define in:** `src/game/powerups.ts`
2. **Add to `PowerUpKind` type**
3. **Implement method in `PowerUpScene` interface** (`types.ts`)
4. **Implement method in `MainScenePhase2`** or `BaseCalendarScene`
5. **Test spawn timing:** Power-up should appear 8-16s into week

### Adding a New Meeting Type

1. **Add to `MeetingType`:** `src/game/physicsModifiers.ts`
2. **Define physics effect:** `applyMeetingEffect()` function
3. **Add to color themes:** `src/game/theme.ts`
4. **Update type distribution:** `calendarGeneratorPhase2.ts`

### Modifying Difficulty Curve

1. **Edit:** `src/game/levelCurve.ts`
2. **Adjust interpolation formula:** `const t = (w - 20) / 32;`
3. **Test boundaries:** Week 21 (start), Week 52 (max)
4. **Update docs:** `WEEK_PROGRESSION_SYSTEM.md`

---

## Common Gotchas

### URL Week Override Takes Precedence

**If `?week=25` is in URL, init data is ignored.**
```typescript
// MainScenePhase2.init()
const urlWeek = Number(urlParams.get('week'));
if (urlWeek && /* valid */) {
  this.currentWeek = urlWeek; // Overrides data.week
}
```

### Phase 2 Requires VITE_PHASE2=1

**Without env var, Phase 1 builds instead:**
```bash
# Phase 2 build
VITE_PHASE2=1 vite build  # ✓ Correct

# Without flag
vite build                # ✗ Builds Phase 1
```

### TypeScript Strict Mode Enabled

**`tsconfig.json` has `"strict": true` - no implicit any allowed.**

**If you see type errors, define proper types in `types.ts`.**

### Phaser Uses Pixel Coordinates

**Phaser world is NOT scaled - uses raw pixels:**
- Ball speed: pixels per second (220-300 px/s)
- Block sizes: actual pixel dimensions
- Paddle scale: multiplier (1.2× = 20% wider)

### Ball Pool Must Be Initialized Before Use

**In `create()`, always:**
```typescript
this.ballPool = new BallPool(this);
this.ballPool.preAllocate(4); // Max balls expected
```

---

## Key Documentation Files

- **WEEK_PROGRESSION_SYSTEM.md** - Complete week-by-week specification
- **TYPE_SAFETY_IMPROVEMENTS.md** - Type safety guidelines
- **README.md** - User-facing documentation
- **CLAUDE.md** (this file) - Developer guidance

---

## TypeScript Configuration

**Strict mode enabled** - `tsconfig.json`:
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

**Always run before committing:**
```bash
npm run typecheck
```

---

## Node.js Version

**Required:** Node 20 LTS (see `.nvmrc`)

```bash
nvm use 20
```

**Engines specified in `package.json`:**
```json
"engines": {
  "node": ">=20"
}
```

---

## Key Game Constants

**Location:** `src/game/constants.ts`

**Physics:**
- `BASE_SPEED: 260` px/s (Phase 1)
- `MIN_SPEED: 200` px/s
- `MAX_SPEED: 700` px/s
- Ball velocity clamped after every collision

**Scoring:**
- 5 points per hit
- Bonus for destroying blocks (Boss = 30 total)

**Calendar:**
- Days: Mon-Fri (5 columns)
- Hours: 9 AM - 5 PM (8 hours, 480 minutes)
- Meeting durations: 15/30/45/60 minutes

---

## Testing Progression System

**Quick smoke test:**
```bash
# Start dev server
npm run dev:phase2

# Test in browser:
http://localhost:3003/Bored_Ball/?week=1   # Onboarding (10 grey blocks)
http://localhost:3003/Bored_Ball/?week=10  # Mid-progressive (~22 meetings)
http://localhost:3003/Bored_Ball/?week=20  # Progressive peak (~40 meetings)
http://localhost:3003/Bored_Ball/?week=21  # Curve system starts
http://localhost:3003/Bored_Ball/?week=52  # Maximum difficulty
```

**Verify in console:**
- `✅ Week X (Progressive): ...` for Weeks 3-20
- `✅ Week X (Curve): ...` for Weeks 21+

---

## Progressive Complexity Requirements

**CRITICAL:** The game MUST:
1. **Start at Week 1 every time** - No exceptions, no saved progress
2. **Progressive complexity over 20 weeks** - Weeks 1-20 ramp-up, Weeks 21-52 full difficulty

**Enforcement:**
- `CalendarBreakoutPhase2.tsx:56` - Hardcoded `week: 1`
- `MainScenePhase2.ts:403` - Restart always uses `week: 1`
- `calendarGeneratorPhase2.ts:38-39` - Range check `week >= 3 && week <= 20`

**Do not modify these without understanding the progression system.**
