# Calendar Breakout - Project Handoff Document

## Project Overview

**Project Name:** Calendar Breakout (Bored_Ball)  
**Repository:** https://github.com/Savvyoverthinking/Bored_Ball  
**Tech Stack:** React + TypeScript + Phaser 3 + Vite  
**Purpose:** A Breakout-style arcade game themed around destroying calendar meetings. Office-friendly stealth game with ESC-quit functionality.

## Current Status

### ✅ WORKING LOCALLY
- Game runs perfectly on `localhost:3001` via `npm run dev`
- All features implemented and tested locally
- No TypeScript errors
- Build completes successfully locally

### ❌ FAILING ON GITHUB ACTIONS
- GitHub Pages deployment workflows continuously fail
- Error occurs during `npm install` step
- Rollup optional dependencies issue

---

## Project Structure

```
Bored_Ball/
├── src/
│   ├── game/
│   │   ├── MainScene.ts           # Core game logic
│   │   ├── BallPool.ts            # Ball management system
│   │   ├── calendarGenerator.ts   # Calendar grid generation
│   │   ├── physicsModifiers.ts    # Meeting type effects
│   │   ├── soundEffects.ts        # Web Audio API sound
│   │   ├── constants.ts           # Game constants
│   │   ├── theme.ts               # Theme system
│   │   └── utils.ts               # Utility functions
│   ├── components/
│   │   └── CalendarBreakout.tsx   # Phaser React wrapper
│   ├── data/
│   │   └── mockCalendar.json      # Meeting data
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── sprites/                   # Sprite assets (placeholder)
│   └── .nojekyll                  # GitHub Pages config
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Build & test workflow
│       └── pages.yml              # GitHub Pages deployment
├── vite.config.ts                 # Vite config with base: '/Bored_Ball/'
├── package.json
├── package-lock.json
└── README.md
```

---

## Implemented Features ✅

### Core Gameplay
- ✅ Phaser 3 breakout mechanics
- ✅ Mouse/touch paddle control
- ✅ Ball physics with bounce mechanics
- ✅ Calendar-themed blocks (Mon-Fri, 9am-5pm grid)
- ✅ 5 meeting types with different effects:
  - **1:1** - 2 hits, speed boost
  - **Team** - 2 hits, splits ball
  - **Boss** - 3 hits, speed increase
  - **Lunch** - 1 hit, normalizes speed
  - **Personal** - 1 hit, resets bounce
- ✅ Block hit points system (durability)
- ✅ 52-week progression system
- ✅ Score tracking
- ✅ Lives system (3 lives)

### Polish Features
- ✅ **ESC key functionality:**
  - First press: Pause game
  - Second press: Quit and restart
- ✅ **Progress persistence:** localStorage saves week/score
- ✅ **Sound effects:** 6 Web Audio API beeps
  - Paddle hit, block hit, block destroyed
  - Life lost, week cleared, year cleared
- ✅ **Ball physics fixes:**
  - Anti-wobble system
  - Stuck ball detection with cooldowns
  - Velocity clamping (200-700 px/s)
  - Deterministic paddle bounce angles
- ✅ **Outlook-style UI:**
  - Microsoft blue accent colors
  - Segoe UI font
  - Calendar grid styling

### Code Quality
- ✅ TypeScript strict mode
- ✅ ESLint + Prettier configured
- ✅ Modular architecture
- ✅ Constants centralized
- ✅ Comprehensive comments

---

## THE PROBLEM: GitHub Pages Deployment Failure

### Error Details

**Location:** GitHub Actions workflow fails at build step  
**Workflow File:** `.github/workflows/pages.yml`  
**Error Message:**
```
Error: Cannot find module '@rollup/rollup-linux-x64-gnu'
npm has a bug related to optional dependencies
Process completed with exit code 1
```

### Root Cause

The issue is with **Rollup's platform-specific optional dependencies**. When running `npm install` (or `npm ci`) in GitHub Actions (Ubuntu runner), it fails to properly install the Linux-specific Rollup binaries that Vite depends on.

This is a known npm bug with optional dependencies in CI environments.

### What We've Tried (All Failed)

1. ❌ **Using `npm ci`** - Failed with missing module error
2. ❌ **Using `npm install`** - Same error
3. ❌ **Using `npm install --force`** - Still failing
4. ❌ **Removing package overrides** - Didn't help
5. ❌ **Regenerating package-lock.json** - No effect
6. ❌ **Adding npm cache** - Didn't resolve issue
7. ❌ **Adding .nojekyll file** - For Jekyll, but not the issue

### Current Workflow Configuration

**.github/workflows/pages.yml:**
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm install --force
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: 'dist'
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Package Versions

**package.json dependencies:**
```json
{
  "dependencies": {
    "phaser": "^3.80.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "typescript": "^5.5.0",
    "@vitejs/plugin-react": "^4.2.1",
    // ... others
  }
}
```

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Bored_Ball/',  // Critical for GitHub Pages
  server: {
    port: 3000
  }
})
```

---

## Possible Solutions to Try

### Option 1: Use `pnpm` Instead of `npm`
pnpm handles optional dependencies better:
```yaml
- uses: pnpm/action-setup@v2
  with:
    version: 8
- run: pnpm install
- run: pnpm run build
```

### Option 2: Explicitly Install Rollup Binary
Add before build:
```yaml
- run: npm install @rollup/rollup-linux-x64-gnu --force
- run: npm run build
```

### Option 3: Use Different Runner OS
Try `runs-on: windows-latest` or `macos-latest`:
```yaml
deploy:
  runs-on: windows-latest  # Instead of ubuntu-latest
```

### Option 4: Prebuild and Deploy `dist/`
Build locally, commit `dist/` folder, deploy from that:
```yaml
- uses: actions/upload-pages-artifact@v3
  with:
    path: 'dist'  # Pre-built folder
```

### Option 5: Use Different Bundler
Switch from Vite to Webpack or Parcel (last resort).

### Option 6: Modify package.json
Add `optionalDependencies` override:
```json
{
  "optionalDependencies": {
    "@rollup/rollup-linux-x64-gnu": "^4.21.0"
  }
}
```

---

## Quick Verification Steps

### Test Locally
```bash
cd Bored_Ball
npm run dev      # Should work on localhost:3001
npm run build    # Should create dist/ folder successfully
npm run preview  # Should serve from dist/
```

### Expected Live URL
Once deployed: **https://savvyoverthinking.github.io/Bored_Ball/**

### GitHub Pages Settings
**Must be enabled:**
1. Go to: https://github.com/Savvyoverthinking/Bored_Ball/settings/pages
2. Source: **GitHub Actions** (not "Deploy from branch")
3. Should auto-deploy on push to `main`

---

## Important Notes

1. **The game works perfectly locally** - this is purely a CI/deployment issue
2. **All code is committed and pushed** to `main` branch
3. **Vite base path is correct** (`/Bored_Ball/`) for GitHub Pages
4. **GitHub Pages is enabled** in repo settings with "GitHub Actions" source
5. **.nojekyll file exists** in `public/` folder
6. **Local build succeeds** - `dist/` folder generates properly

---

## Key Files to Check

1. **`.github/workflows/pages.yml`** - Deployment workflow (currently failing)
2. **`package.json`** - Dependencies (Vite 5.4.0, Phaser 3.80.0)
3. **`package-lock.json`** - Lock file (recently regenerated)
4. **`vite.config.ts`** - Base path set to `/Bored_Ball/`
5. **`src/game/MainScene.ts`** - Main game logic (775 lines)

---

## Recent Commits (Last 10)

```
479de9c - FIX: Add --force flag to npm install and enable npm caching
af6e4eb - FIX: Replace npm ci with npm install to avoid optional dependencies bug
9e28238 - FIX: Remove package overrides conflict and regenerate package-lock.json
68cc043 - Add .nojekyll file for GitHub Pages
eb49c4c - FIX: Set correct base path for GitHub Pages deployment
60e2937 - FIX: Explicitly reset all game state on scene restart
c3fd363 - FIX: Allow game to start from initial screen after restart
be4f9c2 - FIX: Ball wobble and improve ESC quit clarity
4107987 - FEATURE: ESC pause/quit, progress save, sound effects, wobble fix
69f52ca - FIX: Aggressive stuck ball detection with position tracking
```

---

## What Needs to Happen Next

**PRIMARY GOAL:** Get the GitHub Actions workflow to successfully build and deploy to GitHub Pages.

**Success Criteria:**
- ✅ Workflow completes without errors
- ✅ Game is accessible at https://savvyoverthinking.github.io/Bored_Ball/
- ✅ All features work (ESC quit, sounds, physics, etc.)

---

## Contact & Resources

**Repository:** https://github.com/Savvyoverthinking/Bored_Ball  
**Local Dev Server:** `npm run dev` (runs on port 3001)  
**Actions Tab:** https://github.com/Savvyoverthinking/Bored_Ball/actions  

**Key Resources:**
- Vite GitHub Pages guide: https://vitejs.dev/guide/static-deploy.html#github-pages
- GitHub Actions docs: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

---

## Summary for Next Developer

You have a **fully functional game that works perfectly locally**. The only issue is getting GitHub Actions to successfully run `npm install` and `npm run build` without hitting the Rollup optional dependencies error.

The most promising solutions are:
1. **Try pnpm instead of npm** (cleanest solution)
2. **Pre-install the problematic @rollup package explicitly**
3. **Switch to a different runner OS**

Good luck! The game is solid and ready to play once deployed. 🎮

