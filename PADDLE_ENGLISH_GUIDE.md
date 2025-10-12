# 🎮 Paddle "English" Physics Guide

## What is "English"?

In the original Breakout arcade game, "English" refers to the spin or curve imparted to the ball depending on where it hits the paddle. This gives skilled players precise control over ball trajectory.

## 🎯 Paddle Zone Breakdown

The paddle is divided into **7 invisible zones**, each with a distinct rebound angle:

```
┌─────────────────────────────────────────────────────────┐
│  1  │   2   │    3    │     4     │    5    │   6   │  7  │
│ 70° │  45°  │   20°   │    0°    │   20°   │  45°  │ 70° │
│  ↖  │   ↖   │    ↑    │     ↑    │    ↗    │   ↗   │  ↗  │
│Sharp│ Sharp │Moderate │  Center  │Moderate │ Sharp │Sharp│
└─────────────────────────────────────────────────────────┘
     LEFT                PADDLE                RIGHT
```

### Zone Details:

| Zone | Position | Angle Range | Description |
|------|----------|-------------|-------------|
| **1** | Far Left (85-100%) | 70° - 85° left | **Very sharp** - Use for extreme angles and trick shots |
| **2** | Left (35-65%) | 45° - 65° left | **Sharp** - Good for aiming at side columns |
| **3** | Inner Left (14-35%) | 20° - 35° left | **Moderate** - Controlled left trajectory |
| **4** | Center (±14%) | 0° - 10° | **Nearly straight up** - Safe, predictable bounce |
| **5** | Inner Right (14-35%) | 20° - 35° right | **Moderate** - Controlled right trajectory |
| **6** | Right (35-65%) | 45° - 65° right | **Sharp** - Good for aiming at side columns |
| **7** | Far Right (85-100%) | 70° - 85° right | **Very sharp** - Use for extreme angles and trick shots |

## 🎓 Pro Tips:

1. **Center Hits (Zone 4):**
   - Most predictable
   - Use when you need to set up your next shot
   - Good for beginners

2. **Moderate Angles (Zones 3 & 5):**
   - Best for general gameplay
   - Balances control and angle
   - Aim for blocks in middle columns

3. **Sharp Angles (Zones 2 & 6):**
   - Reach blocks in side columns
   - Create opportunities for multi-block hits
   - Risk: ball can get stuck in corner patterns

4. **Edge Shots (Zones 1 & 7):**
   - **Advanced technique!**
   - 70-85° angles for trick shots
   - Can create "ceiling shots" that bounce off top
   - Use to access hard-to-reach blocks
   - **Warning:** Very sharp angles can lead to difficult recovery

## 🧪 How to Test:

1. **Start Phase 2:** `pnpm run dev:phase2`
2. **Open:** `http://localhost:3003/Bored_Ball/index-phase2.html`
3. **Test each zone:**
   - Let the ball drop near the **center** of paddle → Should bounce nearly straight up
   - Hit with **left edge** → Ball should shoot left at sharp angle
   - Hit with **right edge** → Ball should shoot right at sharp angle
   - Try **intentional edge hits** to reach Monday/Friday columns

## 📊 Strategy Examples:

### Scenario 1: Clearing Monday column
- **Goal:** Hit blocks in leftmost column (Monday)
- **Technique:** Position paddle to catch ball on **Zone 2 or 1** (left edge)
- **Result:** 45°-85° left angle sends ball toward Monday blocks

### Scenario 2: Setting up a ceiling bounce
- **Goal:** Create a ricochet off the top to clear upper blocks
- **Technique:** Use **Zone 1 or 7** (far edges) for 70°+ angle
- **Result:** Ball bounces high, ricochets off ceiling, clears top rows

### Scenario 3: Recovering control
- **Goal:** Ball is moving too fast/unpredictably
- **Technique:** Catch with **Zone 4** (center)
- **Result:** Nearly vertical bounce gives you time to reposition

## 🎯 Skill Progression:

- **Beginner:** Stick to Zones 3-5 (moderate angles)
- **Intermediate:** Master Zones 2 & 6 (sharp angles for side columns)
- **Advanced:** Use Zones 1 & 7 strategically for trick shots

## ⚙️ Technical Details:

- Implemented in: `src/game/constants.ts` → `calculatePaddleBounceAngle()`
- Applies to: Both Phase 1 and Phase 2
- Physics: Angle is calculated based on exact ball-paddle contact point
- Speed: Angle changes trajectory, but ball speed is clamped (200-700 px/s)

---

**This mechanic transforms Calendar Breakout from a reaction game into a skill-based aiming challenge!** 🎯

