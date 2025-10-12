# 🚀 Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

This will install:
- React 18 + TypeScript
- Phaser 3.70 (game engine)
- Vite (build tool)
- Tailwind CSS (styling)

### 2. Run Development Server
```bash
npm run dev
```

The game will open at `http://localhost:3000`

### 3. Play!
- Move your **mouse** to control the paddle
- **Click** to launch the ball
- Destroy all meeting blocks to win!

---

## Build for Production
```bash
npm run build
npm run preview
```

The optimized build will be in the `dist/` folder.

---

## Project Overview

### File Structure
```
src/
├── components/CalendarBreakout.tsx  ← React wrapper
├── game/
│   ├── MainScene.ts                ← Core game logic ⭐
│   ├── calendarGenerator.ts        ← Grid layout
│   └── physicsModifiers.ts         ← Meeting effects
├── data/mockCalendar.json          ← Meeting data
└── main.tsx                        ← Entry point
```

### Key Features Implemented ✅
- ✅ Phaser 3 game engine integration
- ✅ Calendar grid layout (Mon-Fri, 9-5)
- ✅ 24 mock meetings with 5 types
- ✅ Physics modifiers per meeting type
- ✅ Ball splitting, speed changes
- ✅ Lives system (3 lives)
- ✅ Win/lose overlays
- ✅ Responsive design with Tailwind
- ✅ Clean TypeScript architecture

### Meeting Effects 🎯
| Type | Color | Effect |
|------|-------|--------|
| 1:1 | Purple | +10% speed |
| Team | Green | Ball splits into 3 |
| Boss | Red | Speed ×1.8 |
| Lunch | Yellow | Normalize speed |
| Personal | Violet | Reset bounce |

---

## Customization

### Change Meeting Data
Edit `src/data/mockCalendar.json` to customize meetings.

### Modify Physics
Edit `src/game/physicsModifiers.ts` to change ball behavior.

### Adjust Layout
Edit `src/game/calendarGenerator.ts` to change grid dimensions.

---

## Deployment Options

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
1. `npm run build`
2. Upload `dist/` folder to Netlify

### GitHub Pages
1. Update `vite.config.ts` base path
2. `npm run build`
3. Deploy `dist/` to gh-pages branch

---

## Troubleshooting

**Issue**: TypeScript errors
**Fix**: Run `npm install` again

**Issue**: Game doesn't load
**Fix**: Check browser console, clear cache

**Issue**: Port 3000 in use
**Fix**: Change port in `vite.config.ts`

---

## Next Steps 🔮

Want to extend the game? Consider:
- Add sound effects (use Phaser audio)
- Integrate Google Calendar API
- Add power-ups (wider paddle, shield)
- Create multiple difficulty levels
- Add local storage for high scores

---

**Need Help?** Check the full README.md for detailed documentation.

**Enjoy the game!** 🎮


