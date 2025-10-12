# Phase 2 Integration Guide - MainScenePhase2

## Overview
MainScenePhase2 is a duplicate of MainScene.ts with Phase 2 features integrated.

## Integration Checklist

### ✅ Already Created
- `levelCurve.ts` - Progressive difficulty system
- `powerups.ts` - Weekly power-up definitions
- `WeekendStageScene.ts` - Bonus stage every 5th week
- `phase2Router.ts` - Scene routing logic

### 🔄 MainScenePhase2.ts Modifications Required

#### 1. Constructor & Initialization
```typescript
// Add to class properties:
private tuning!: LevelTuning;
private powerUpSpawned: boolean = false;
private activePowerUps: Set<PowerUpKind> = new Set();
private shieldActive: boolean = false;
private paddleScaleTimer?: Phaser.Time.TimerEvent;
private coffeeTimer?: Phaser.Time.TimerEvent;
```

#### 2. Scene Init
```typescript
init(data: { week: number, tuning: LevelTuning, score?: number, lives?: number }) {
  this.currentWeek = data.week;
  this.tuning = data.tuning;
  this.score = data.score || 0;
  this.lives = data.lives || 3;
  this.powerUpSpawned = false;
}
```

#### 3. Block Generation (Apply Tuning)
```typescript
createBlocks() {
  const { density, bossRate, teamRate, lunchRate, minBlockMins } = this.tuning;
  
  // Filter meetings by minBlockMins
  const validMeetings = calendarData.meetings.filter(
    m => m.duration >= minBlockMins
  );
  
  // Apply density (remove random meetings)
  const sampledMeetings = Phaser.Math.RND.shuffle(validMeetings)
    .slice(0, Math.floor(validMeetings.length * density));
  
  // Adjust type distribution based on rates
  sampledMeetings.forEach(meeting => {
    const roll = Math.random();
    if (roll < bossRate) meeting.type = 'boss';
    else if (roll < bossRate + teamRate) meeting.type = 'team';
    else if (roll < bossRate + teamRate + lunchRate) meeting.type = 'lunch';
    // ... apply tuning
  });
}
```

#### 4. Paddle Scaling (Apply Tuning)
```typescript
createPaddle() {
  // ... existing paddle creation ...
  
  // Apply Phase 2 paddle scale
  this.paddle.setScale(this.tuning.paddleScale, 1);
}
```

#### 5. Ball Speed (Apply Tuning)
```typescript
startGame() {
  // ... existing code ...
  
  // Use tuned base speed
  const speed = this.tuning.baseSpeed;
  ball.setVelocity(
    Phaser.Math.Between(-speed, speed),
    -speed
  );
}
```

#### 6. Power-up Spawning
```typescript
// Add to create():
this.time.delayedCall(
  Phaser.Math.Between(POWERUP_CONFIG.MIN_SPAWN_DELAY, POWERUP_CONFIG.MAX_SPAWN_DELAY),
  () => this.spawnWeeklyPowerUp()
);

spawnWeeklyPowerUp() {
  if (this.powerUpSpawned) return;
  
  // Pick random non-boss block
  const validBlocks = this.blocks.getChildren().filter(
    b => this.blockDataMap.get(b)?.type !== 'boss'
  );
  
  if (validBlocks.length === 0) return;
  
  const block = Phaser.Math.RND.pick(validBlocks);
  const powerUp = getRandomPowerUp();
  
  // Create floating icon above block
  this.createPowerUpIcon(block, powerUp);
  this.powerUpSpawned = true;
}
```

#### 7. Power-up Effects
```typescript
applyCoffee(duration: number) {
  // Lock ball speed for duration
  this.coffeeTimer = this.time.addEvent({
    delay: duration,
    callback: () => this.coffeeTimer = undefined
  });
}

scalePaddle(scale: number, duration: number) {
  this.paddle.setScale(scale, 1);
  this.paddleScaleTimer = this.time.addEvent({
    delay: duration,
    callback: () => this.paddle.setScale(this.tuning.paddleScale, 1)
  });
}

grantShield(count: number) {
  this.shieldActive = true;
  // Show shield visual
}

clearCurrentHourRow() {
  // Find all blocks in same hour as ball
  const ballY = this.ballPool.getFirstAlive()?.y || 300;
  const hourRow = Math.floor(ballY / 70); // Approximate
  
  this.blocks.getChildren().forEach(block => {
    if (Math.abs(block.y - ballY) < 70) {
      this.destroyBlock(block);
    }
  });
}

convertRandomBlocks(count: number, toType: MeetingType) {
  const blocks = Phaser.Math.RND.shuffle(this.blocks.getChildren())
    .slice(0, count);
  
  blocks.forEach(block => {
    // Change block type to lunch (1 hit, yellow)
    this.blockHitPoints.set(block, 1);
    block.setFillStyle(getMeetingColor('lunch'));
  });
}
```

#### 8. Week Completion (Router Integration)
```typescript
winGame() {
  if (this.currentWeek >= 52) {
    // Year complete!
    this.showYearComplete();
  } else {
    // Use Phase 2 router
    const nextWeek = this.currentWeek + 1;
    
    this.showOverlay('Week Cleared!', 'Click to continue...');
    this.input.once('pointerdown', () => {
      startWeek(this, nextWeek, {
        score: this.score,
        lives: this.lives
      });
    });
  }
}
```

#### 9. Ball Count Limit (Apply Tuning)
```typescript
// In Team meeting split logic:
if (this.ballPool.countActive() < this.tuning.ballMaxCount) {
  this.ballPool.spawnBall(/* ... */);
}
```

#### 10. Shield Logic (Ball Loss)
```typescript
private ballOffScreen(ball: any) {
  if (this.shieldActive) {
    // Use shield instead of losing life
    this.shieldActive = false;
    sound.paddleHit(); // Different sound
    this.showShieldUsed();
    this.ballPool.returnBall(ball);
    return;
  }
  
  // Normal life loss
  this.lives--;
  // ... existing code ...
}
```

## Testing Priorities

1. **Week 1-5 Difficulty**
   - Verify paddle is 1.2× wider
   - Verify ball speed is 220 px/s
   - Verify fewer boss meetings
   - Verify larger meeting blocks

2. **Power-up Spawning**
   - Exactly ONE per week
   - Never on boss blocks
   - Spawns 8-16s after start
   - All 5 types work correctly

3. **Weekend Bonus (Weeks 5, 10, 15...)**
   - Correct routing to WeekendStageScene
   - Email dodge works
   - Bonus scoring applied
   - Returns to calendar scene

4. **Progressive Difficulty**
   - Week 6: Starts ramping up
   - Week 30: Noticeably harder
   - Week 52: Brutal mode

## File Structure
```
src/game/
├── MainScene.ts              ← V1.0 (unchanged)
├── MainScenePhase2.ts        ← Phase 2 (duplicate + enhancements)
├── WeekendStageScene.ts      ← Bonus stage
├── levelCurve.ts             ← Difficulty tuning
├── powerups.ts               ← Power-up system
├── phase2Router.ts           ← Scene routing
└── PHASE2_INTEGRATION_GUIDE.md ← This file
```

## Quick Implementation
1. Copy `MainScene.ts` → `MainScenePhase2.ts`
2. Change class name to `MainScenePhase2`
3. Change scene key to `'CalendarScenePhase2'`
4. Apply modifications 1-10 above
5. Test each feature independently
6. Integrate with router

## Migration Path
Once Phase 2 is proven stable:
1. Merge Phase 2 features back into MainScene
2. Add feature flag checks
3. Deprecate Phase 2 scene
4. Remove duplication

