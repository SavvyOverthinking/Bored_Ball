# Week Progression System - Complete Specification

## Overview

The Phase 2 calendar system now follows a carefully designed progression from **gentle tutorial** (Week 1) through **progressive ramp-up** (Weeks 2-20) to **full chaos** (Weeks 21-52).

---

## Week-by-Week Breakdown

### 📘 **WEEK 1: Onboarding**

**Purpose:** Teach the player basic mechanics in a safe environment

**Calendar Layout:**
- **10 blocks total** (2 per day × 5 days)
- **All blocks are grey "Onboarding" meetings**
- **2-hour duration** each
- **1 hit to destroy** (easy)

**Timing Per Day:**
- Block 1: 10:00 AM - 12:00 PM (before lunch)
- Block 2: 1:00 PM - 3:00 PM (after lunch)

**Visual:**
```
Mon   Tue   Wed   Thu   Fri
 ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐
 │O│   │O│   │O│   │O│   │O│  ← Onboarding (grey)
 └─┘   └─┘   └─┘   └─┘   └─┘
Lunch Lunch Lunch Lunch Lunch
 ┌─┐   ┌─┐   ┌─┐   ┌─┐   ┌─┐
 │O│   │O│   │O│   │O│   │O│  ← Onboarding (grey)
 └─┘   └─┘   └─┘   └─┘   └─┘
```

**Expected Player Experience:**
- Large, easy-to-hit blocks
- Consistent layout (predictable)
- No surprises, no Boss meetings
- Build confidence

---

### 📗 **WEEK 2: Meeting Types**

**Purpose:** Introduce variety and different meeting types

**Calendar Layout:**
- **8 blocks total**
- **2 blocks of each type:**
  - 2× Team (green)
  - 2× 1:1 (blue)
  - 2× Lunch (yellow)
  - 2× Personal (purple)
- **NO Boss meetings yet**
- **1-hour duration** each
- **Random placement** but deterministic

**Hit Points:**
- Team: 2 hits
- 1:1: 2 hits
- Lunch: 1 hit
- Personal: 1 hit

**Expected Player Experience:**
- Learn different block colors
- Understand multi-hit blocks (Team, 1:1)
- Still relatively easy
- No overlaps yet

---

### 📙 **WEEKS 3-20: Progressive Ramp-Up** (First ~5 months)

**Purpose:** Gradually increase complexity to prepare for full difficulty

**Meeting Count Progression:**
| Week | Meetings | Boss Rate | Min Duration | Overlaps |
|------|----------|-----------|--------------|----------|
| 3    | 10       | 0%        | 60 min       | None     |
| 4    | 12       | 1%        | 58 min       | None     |
| 5    | 14       | 1%        | 56 min       | None     |
| 6    | 15       | 2%        | 54 min       | 0.6      |
| 7    | 17       | 2%        | 53 min       | 1.2      |
| 8    | 19       | 3%        | 51 min       | 1.8      |
| 9    | 21       | 4%        | 49 min       | 2.4      |
| 10   | 22       | 4%        | 47 min       | 3.0      |
| 11   | 24       | 5%        | 45 min       | 3.6      |
| 12   | 26       | 5%        | 43 min       | 4.2      |
| 13   | 28       | 6%        | 41 min       | 4.8      |
| 14   | 29       | 6%        | 40 min       | 5.4      |
| 15   | 31       | 7%        | 38 min       | 6.0      |
| 16   | 33       | 8%        | 36 min       | 6.6      |
| 17   | 35       | 8%        | 34 min       | 7.2      |
| 18   | 36       | 9%        | 32 min       | 7.8      |
| 19   | 38       | 9%        | 31 min       | 8.4      |
| 20   | 40       | 10%       | 30 min       | 9.0      |

**Meeting Type Distribution:**
- **Boss:** 0% → 10% (gradually introduced)
- **Team:** 20% → 30%
- **Lunch:** 20% → 15%
- **1:1:** ~25%
- **Personal:** Remainder

**Key Milestones:**
- **Week 3:** First "real" week, 10 varied meetings
- **Week 4:** Boss meetings introduced (1% chance, very rare)
- **Week 6:** First overlaps appear (intentional double-bookings)
- **Week 12:** Calendar starts feeling crowded (~26 meetings)
- **Week 16:** High complexity with ~33 meetings and 8% Boss rate
- **Week 20:** Chaotic mess (~40 meetings, many overlaps, 10% Boss rate)

**Expected Player Experience:**
- Gradual learning curve
- Boss meetings slowly become normal
- Calendar fills up naturally
- Double-bookings add strategy (which to hit first?)

---

### 📕 **WEEKS 21-52: Full Difficulty Curve**

**Purpose:** Challenge experienced players with full complexity

**Follows `levelCurve.ts` System:**

**Week 21:**
- ~35% density (starting point after progressive ramp)
- 4% Boss rate
- 10% Team rate
- 20% Lunch rate
- Paddle: 1.2× scale
- Ball speed: 220 px/s

**Week 26 (Mid-year):**
- ~62% density (~40 meetings)
- 9% Boss rate
- 17% Team rate
- 15% Lunch rate
- Paddle: 0.95× scale (smaller)
- Ball speed: 260 px/s (faster)

**Week 52 (Final):**
- **80% density** (~50 meetings)
- **14% Boss rate** (7+ Boss meetings per week)
- **25% Team rate**
- **10% Lunch rate** (scarce breaks)
- **Paddle: 0.85× scale** (tiny)
- **Ball speed: 300 px/s** (brutal)
- **Max 4 balls** (chaotic multi-ball)

**Expected Player Experience:**
- Weeks 21-30: Challenging but manageable
- Weeks 31-45: Hard, requires skill
- Weeks 46-52: Brutal endgame

---

## Visual Comparison

### Week 1 vs Week 20 vs Week 52

**Week 1 (Onboarding):**
```
Mon       Tue       Wed       Thu       Fri
9 AM
10 AM   [Onboard] [Onboard] [Onboard] [Onboard] [Onboard]
11 AM       ↓         ↓         ↓         ↓         ↓
12 PM   [Lunch──] [Lunch──] [Lunch──] [Lunch──] [Lunch──]
1 PM    [Onboard] [Onboard] [Onboard] [Onboard] [Onboard]
2 PM        ↓         ↓         ↓         ↓         ↓
3 PM
...
```
**10 blocks, very sparse, easy**

---

**Week 20 (Progressive Peak):**
```
Mon       Tue       Wed       Thu       Fri
9 AM    [Team]    [1:1]│[Boss] [Team]    [1:1]
10 AM   [1:1]     [Meet]│[Meet] [Boss]    [Team]
11 AM   [Lunch]   [Team] [1:1]  [Meet]    [Boss]
12 PM   [Team]    [Boss] [Lunch][1:1]     [Lunch]
1 PM    [1:1]│[Boss][Meet] [Team] [Meet]    [1:1]
...
```
**~40 blocks, many overlaps (│), Boss meetings common (10% rate)**

---

**Week 52 (Maximum Chaos):**
```
Mon       Tue       Wed       Thu       Fri
9 AM    [B]│[T]   [B]│[1]  [B]│[T]│[1] [B]│[T]   [B]│[1]│[T]
10 AM   [T]│[1]   [T]│[B]  [1]│[B]│[T] [T]│[1]│[B] [T]│[B]
11 AM   [B]│[T]   [1]│[T]  [B]│[1]│[T] [B]│[T]│[1] [B]│[T]│[1]
12 PM   [L]│[B]   [T]│[1]  [B]│[T]     [L]│[T]   [B]│[T]│[1]
1 PM    [B]│[T]│[1][B]│[T]  [T]│[1]│[B] [B]│[1]│[T] [B]│[T]
...
```
**~50 blocks, triple overlaps common, tiny gaps, brutal**

---

## Meeting Type Colors & Hit Points

| Type | Color | Hits | Purpose |
|------|-------|------|---------|
| **Onboarding** | Grey (purple) | 1 | Week 1 tutorial |
| **Lunch** | Yellow | 1 | Break blocks, speed reset |
| **Personal** | Purple | 1 | Easy filler |
| **1:1** | Blue | 2 | Standard meetings |
| **Team** | Green | 2 | Team meetings, split ball |
| **Boss** | Red | 3 | Hard meetings, speed ×1.8 |

---

## No Saved Progress

**Every game starts fresh at Week 1:**
- Loading the game → Week 1
- Losing all lives → Restart at Week 1
- Quitting (ESC ESC) → Restart at Week 1
- Completing Week 52 → Restart at Week 1

**Why:**
- Ensures consistent tutorial experience
- Week 1 always teaches basics
- No skipping the learning curve
- Every playthrough is complete

---

## Testing Checklist

### ✅ **Week 1 Verification**
- [ ] Exactly 10 grey blocks visible
- [ ] Blocks labeled "Onboarding"
- [ ] 2 blocks per day (before and after lunch)
- [ ] Each block breaks in 1 hit
- [ ] Large 2-hour blocks
- [ ] Week display shows "Week: 1 / 52"

### ✅ **Week 2 Verification**
```
http://localhost:3003/Bored_Ball/?week=2
```
- [ ] Exactly 8 blocks total
- [ ] 2 green (Team)
- [ ] 2 blue (1:1)
- [ ] 2 yellow (Lunch)
- [ ] 2 purple (Personal)
- [ ] NO red (Boss) blocks
- [ ] Week display shows "Week: 2 / 52"

### ✅ **Week 6 Verification**
```
http://localhost:3003/Bored_Ball/?week=6
```
- [ ] ~20 meetings
- [ ] Some side-by-side overlaps visible
- [ ] At least 1 Boss meeting (red)
- [ ] Week display shows "Week: 6 / 52"

### ✅ **Week 12 Verification**
```
http://localhost:3003/Bored_Ball/?week=12
```
- [ ] ~26 meetings (getting crowded)
- [ ] Some overlaps (side-by-side blocks)
- [ ] 1-2 Boss meetings visible (5% rate)
- [ ] 43-minute minimum blocks
- [ ] Week display shows "Week: 12 / 52"

### ✅ **Week 20 Verification**
```
http://localhost:3003/Bored_Ball/?week=20
```
- [ ] ~40 meetings (very crowded)
- [ ] Many overlaps (side-by-side blocks)
- [ ] 4-5 Boss meetings visible (10% rate)
- [ ] Small 30-minute blocks
- [ ] Week display shows "Week: 20 / 52"

### ✅ **Week 52 Verification**
```
http://localhost:3003/Bored_Ball/?week=52
```
- [ ] ~50 meetings (maximum density)
- [ ] Triple overlaps visible (3 blocks side-by-side)
- [ ] 7+ Boss meetings
- [ ] Very small gaps between meetings
- [ ] Week display shows "Week: 52 / 52"

### ✅ **Restart Behavior**
- [ ] Fresh load starts Week 1
- [ ] Losing → Restart shows Week 1
- [ ] Quit (ESC ESC) → Restart shows Week 1
- [ ] Complete Week 52 → Restart shows Week 1
- [ ] NO saved progress between sessions

### ✅ **Week Display Updates**
- [ ] Top-left shows correct week number
- [ ] Updates when advancing to next week
- [ ] Updates when using cheat codes (Ctrl+Shift+Arrows)
- [ ] Updates when using URL param (?week=X)

---

## Console Log Expectations

**Week 1 Load:**
```
🗓️ Generating calendar for Week 1...
✅ Week 1: 10 onboarding blocks (2 per day × 5 days)
✨ Phase 2: Generated 10 meetings for week 1
📊 Render stats: 10 blocks (including 0 in double-bookings)
🎨 Meeting types: Boss=0, Team=0, Lunch=0
```

**Week 2 Load:**
```
🗓️ Generating calendar for Week 2...
✅ Week 2: 8 meetings (2 of each type, no Boss)
✨ Phase 2: Generated 8 meetings for week 2
📊 Render stats: 8 blocks (including 0 in double-bookings)
🎨 Meeting types: Boss=0, Team=2, Lunch=2
```

**Week 12 Load:**
```
🗓️ Generating calendar for Week 12...
✅ Week 12 (Progressive): 26 meetings, 5% boss rate
✨ Phase 2: Generated ~30 meetings for week 12
📊 Render stats: ~30 blocks (including ~4 in double-bookings)
🎨 Meeting types: Boss=1, Team=8, Lunch=5
```

**Week 20 Load:**
```
🗓️ Generating calendar for Week 20...
✅ Week 20 (Progressive): 40 meetings, 10% boss rate
✨ Phase 2: Generated ~49 meetings for week 20
📊 Render stats: ~49 blocks (including ~9 in double-bookings)
🎨 Meeting types: Boss=4, Team=12, Lunch=6
```

---

## Implementation Details

### File: `calendarGeneratorPhase2.ts`

**Functions:**
1. `generateWeek(week)` - Main entry point, routes to specific week generator
2. `generateWeek1Onboarding()` - Creates 10 grey blocks
3. `generateWeek2Basics()` - Creates 8 blocks (2 of each type)
4. `generateWeeks3to20Progressive(week)` - Progressive difficulty over 18 weeks
5. `generateWeeks21PlusCurve(week)` - Uses `curve()` system
6. `computeColumns(meetings)` - Handles double-booking layout

### Modified Files:
- `src/game/calendarGeneratorPhase2.ts` - Complete rewrite
- `src/game/MainScenePhase2.ts` - Always restart at Week 1
- `src/components/CalendarBreakoutPhase2.tsx` - Always init Week 1

---

## Success Criteria

✅ **Week 1:** Player learns basics safely
✅ **Week 2:** Player sees variety, no Boss yet
✅ **Weeks 3-20:** Smooth learning curve over 20 weeks
✅ **Weeks 21+:** Full challenge
✅ **No bugs:** Calendar always generates correctly
✅ **No saved progress:** Always starts Week 1

---

**Last Updated:** 2025-10-25
**Commit:** Extended progressive period from 12 to 20 weeks
**Status:** ✅ UPDATED - 20-week progression system

