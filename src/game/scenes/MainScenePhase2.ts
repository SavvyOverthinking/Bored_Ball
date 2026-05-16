/**
 * Main Game Scene - Phase 2
 * Enhanced with level curve, power-ups, and weekend routing
 * Now extends BaseCalendarScene to eliminate code duplication
 */

import { getCalendarGridConfig, getBoardDimensions } from '@game/utils/calendarGenerator';
import { getDefaultHitPoints, type MeetingType } from '@game/systems/physicsModifiers';
import { PHYSICS, SCORING } from '@config/constants';
import { sound } from '@game/systems/soundEffects';
import { gameEventBus } from '@game/systems/GameEventBus';
import { curve, type LevelTuning } from '@game/utils/levelCurve';
import { isBonusWeek, startWeek, startWeekendBonus } from '@game/utils/phase2Router';
import { POWERUPS, POWERUP_CONFIG, getRandomPowerUp, type PowerUpKind } from '@game/objects/powerups';
import { readDayOverride } from '@game/utils/dayProgression';
import {
  LUNCH_END_MIN,
  LUNCH_START_MIN,
  generateWeek,
  computeColumns,
  type Meeting,
  type RenderItem
} from '@game/utils/calendarGeneratorPhase2';
import type { PhaserBall, PhaserBlock, GameObjectWithData, PowerUpContainer } from '@/types/game';
import { BaseCalendarScene } from './BaseCalendarScene';

export class MainScenePhase2 extends BaseCalendarScene {
  // Phase 2 specific: Meeting data map
  private blockDataMap: Map<string, Meeting> = new Map();

  // Event listener cleanup
  private handlePointerLockChange?: () => void;

  // Phase 2: Level tuning
  private tuning!: LevelTuning;

  // Phase 2: Power-ups
  private powerUpSpawned: boolean = false;
  protected shieldActive: boolean = false; // Changed to protected for BaseCalendarScene
  private powerUpIcon?: PowerUpContainer;
  private powerUpSpawnEvent?: Phaser.Time.TimerEvent;
  private coffeeEvent?: Phaser.Time.TimerEvent;
  private coffeeActive: boolean = false;
  private focusBonusEvent?: Phaser.Time.TimerEvent;
  private focusBonusActive: boolean = false;
  private followUpCounter: number = 0;
  private emergencyTimers: Map<string, Phaser.Time.TimerEvent> = new Map();
  private seenPowerUps: Set<PowerUpKind> = new Set();
  // private powerUpStatusText?: Phaser.GameObjects.Text; // Removed

  constructor() {
    super('CalendarScenePhase2');
    console.log('🎯 MainScenePhase2 constructor called');
  }

  init(data: {
    week?: number,
    tuning?: LevelTuning,
    score?: number,
    lives?: number,
    fromWeekendBonus?: boolean
  }) {
    super.init(data); // Call base init to handle onUpdateGameState

    console.log('🎯 MainScenePhase2.init() called');
    console.log('🎮 Phase 2 Scene Init - Data received:', data);

    // Check for URL param override. ?day=25 is preferred; ?week=25 is kept
    // for old test links.
    const urlLevel = readDayOverride();

    if (urlLevel && Number.isFinite(urlLevel) && urlLevel > 0 && urlLevel <= this.totalWeeks) {
      this.currentWeek = urlLevel;
      console.log(`DEV: Day overridden via URL param: ${urlLevel}`);
    } else {
      this.currentWeek = data.week || 1;
    }

    this.score = data.score || 0;
    this.lives = data.lives || 3;

    // IMPORTANT: Always get tuning from curve() for proper arcade progression.
    // URL overrides and scene transitions must never reuse stale tuning.
    this.tuning = curve(this.currentWeek);
    console.log(`✅ Day ${this.currentWeek} tuning: paddle=${this.tuning.paddleScale.toFixed(2)}, speed=${this.tuning.baseSpeed}`);

    this.powerUpSpawned = false;
    this.shieldActive = false;
    this.coffeeActive = false;
    this.focusBonusActive = false;
    this.followUpCounter = 0;
    this.emergencyTimers.clear();

    console.log(`📈 Day ${this.currentWeek} Tuning Applied:`, this.tuning);
    console.log(`📊 Expected: ${Math.round(this.tuning.density * 100)}% density, ${this.tuning.ballMaxCount} max balls, ${this.tuning.baseSpeed} px/s speed`);
  }

  create() {
    // Apply theme background
    this.applyThemeBackground();

    // Call base create logic
    this.baseCreate();

    // Update week display (important for URL params)
    this.updateWeek();

    // Phase 2: Add power-up status text // Removed
    // this.createPowerUpUI(); // Removed

    // Power-ups are scheduled after the ball launches so they cannot expire on
    // the splash screen.
  }

  update() {
    // Call base update with paddle velocity reset
    this.baseUpdate();

    if (this.coffeeActive) {
      this.stabilizeActiveBallSpeeds();
    }

    // Phase 2: Check for power-up collision
    if (this.gameStarted && !this.gameOver && !this.isPaused && this.powerUpIcon) {
      this.ballPool.getGroup().getChildren().forEach((ballObj) => {
        const ball = ballObj as PhaserBall;
        if (ball.body && this.powerUpIcon) {
          if (this.isBallTouchingPowerUp(ball, this.powerUpIcon)) {
            this.collectPowerUp(ball, this.powerUpIcon);
          }
        }
      });
    }
  }

  /**
   * Create blocks from generated calendar (Phase 2 specific)
   */
  protected createBlocks() {
    this.blocks = this.physics.add.staticGroup();

    const meetings = generateWeek(this.currentWeek);
    const renderItems = computeColumns(meetings);

    renderItems.forEach((item, index) => {
      const blockId = `meeting-${this.currentWeek}-${index}`;
      this.createMeetingBlock(item, blockId);
    });

    console.log(`✨ Phase 2: Generated ${meetings.length} meetings for day ${this.currentWeek}`);
    console.log(`📊 Render stats: ${renderItems.length} blocks (including ${renderItems.filter(r => r.cols > 1).length} in double-bookings)`);
  }

  private createMeetingBlock(item: RenderItem, blockId: string): PhaserBlock {
    const config = getCalendarGridConfig();
    const START_HOUR = 9;
    const END_HOUR = 17;
    const DAY_MINS = (END_HOUR - START_HOUR) * 60;

    const dayX = config.padding + item.day * (config.columnWidth + config.columnGap);
    const yPerMin = config.gridHeight / DAY_MINS;

    const bandTop = config.headerHeight + item.startMin * yPerMin;
    const bandBot = config.headerHeight + item.endMin * yPerMin;

    const fullW = config.columnWidth - 6;
    const w = (fullW / item.cols) - 4;
    const x = dayX + (fullW / item.cols) * item.col + w / 2 + 4;
    const y = (bandTop + bandBot) / 2;
    const h = Math.max(20, bandBot - bandTop - 4);
    const color = this.getColorForMeetingType(item.type);

    const blockRect = this.add.rectangle(x, y, w, h, color, 0.85);
    blockRect.setStrokeStyle(1, 0xffffff, 0.2);
    this.blocks.add(blockRect);

    const block = blockRect as PhaserBlock;
    block.setData('meetingType', item.type);
    block.setData('blockId', blockId);

    const accentBar = this.add.rectangle(x - w / 2 + 2, y, 3, h, color, 1.0);
    accentBar.setData('blockId', blockId);
    accentBar.setData('blockChildType', 'accent');
    accentBar.setDepth(2);

    const hitPoints = item.title === 'Onboarding' ? 1 : this.getHitPointsForMeeting(item.type);
    this.blockHitPoints.set(blockId, hitPoints);

    if (h > 18) {
      const fontSize = h > 30 ? '10px' : '8px';
      const text = this.add.text(
        x - w / 2 + 6,
        y - h / 2 + 3,
        item.title || 'Meeting',
        {
          fontFamily: 'Segoe UI, Inter, sans-serif',
          fontSize,
          color: '#ffffff',
          fontStyle: '600',
          align: 'left',
          wordWrap: { width: w - 10 },
        }
      ).setOrigin(0, 0);

      text.setData('blockId', blockId);
      text.setData('blockChildType', 'label');
      text.setDepth(5);
    }

    if (item.type === 'emergency') {
      const warning = this.add.text(x + w / 2 - 14, y - h / 2 + 3, '8s', {
        fontFamily: 'Segoe UI, Inter, sans-serif',
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: '700',
        backgroundColor: '#7f1d1d',
        padding: { x: 3, y: 1 },
      }).setOrigin(0.5, 0);

      warning.setData('blockId', blockId);
      warning.setData('blockChildType', 'timer');
      warning.setDepth(6);
    }

    this.blockDataMap.set(blockId, item);
    return block;
  }

  /**
   * Get hit points for meeting type (Phase 2 implementation)
   */
  protected getHitPointsForMeeting(type: MeetingType): number {
    return getDefaultHitPoints(type);
  }

  /**
   * Get paddle width (Phase 2: uses tuning scale)
   */
  protected getPaddleWidth(): number {
    return PHYSICS.PADDLE_WIDTH * this.tuning.paddleScale;
  }

  /**
   * Create extra ball (Phase 2: uses tuned max count)
   */
  public createExtraBall(x: number, y: number, velocityX: number, velocityY: number) {
    if (this.ballPool.getActiveBallCount() >= this.tuning.ballMaxCount) {
      console.log(`Max balls reached (${this.tuning.ballMaxCount}), skipping`);
      return;
    }

    this.ballPool.spawn(x, y, velocityX, velocityY);
  }

  /**
   * Override setupInput to add Phase 2 specific controls
   */
  protected setupInputBase() {
    super.setupInputBase();

    // Phase 2: Enhanced pointer lock (request on FIRST click)
    this.input.once('pointerdown', () => {
      const canvas = this.game.canvas;
      if (canvas && !this.pointerLocked) {
        canvas.requestPointerLock();
        this.input.setDefaultCursor('none');
      }
    });

    // Phase 2: Store handler for cleanup
    this.handlePointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.game.canvas;
      if (!this.pointerLocked) {
        this.input.setDefaultCursor('default');
      }
    };
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);

    // Phase 2: Dev cheat codes
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.code === 'ArrowUp') {
        event.preventDefault();
        const nextWeek = Math.min(this.totalWeeks, this.currentWeek + 1);
        this.showDevToast(`DEV: Jumping to Day ${nextWeek}`);
        this.scene.restart({ week: nextWeek, score: this.score, lives: this.lives });
      }

      if (event.ctrlKey && event.shiftKey && event.code === 'ArrowDown') {
        event.preventDefault();
        const prevWeek = Math.max(1, this.currentWeek - 1);
        this.showDevToast(`DEV: Jumping to Day ${prevWeek}`);
        this.scene.restart({ week: prevWeek, score: this.score, lives: this.lives });
      }

      if (event.ctrlKey && event.shiftKey && event.code === 'KeyL') {
        event.preventDefault();
        this.lives++;
        this.updateLives();
        this.showDevToast(`DEV: +1 Life (${this.lives} total)`);
      }

      if (event.ctrlKey && event.shiftKey && event.code === 'KeyB') {
        event.preventDefault();
        this.createExtraBall(this.paddle.x, this.paddle.y - 30, 100, -200);
        this.showDevToast(`DEV: Extra ball spawned`);
      }
    });

    // Release pointer lock on blur
    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      if (this.pointerLocked) {
        document.exitPointerLock();
      }
    });
  }

  /**
   * Show dev toast notification (Phase 2 specific)
   */
  private showDevToast(message: string) {
    // Get board dimensions as these methods will still use Phaser text objects
    const { width, height } = getBoardDimensions();
    const toast = this.add.text(width / 2, height - 80, message, {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 12, y: 8 }
    }).setOrigin(0.5).setDepth(3000);

    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: height - 120,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => toast.destroy()
    });
  }

  /**
   * Override startGame to use tuned base speed
   */
  protected startGameBase() {
    if (this.gameStarted) return;

    this.gameStarted = true;

    const firstBall = this.ballPool.getGroup().getFirstAlive();
    if (firstBall && firstBall.body) {
      const angle = Phaser.Math.Between(-45, 45) * Math.PI / 180;
      const speed = this.tuning.baseSpeed;
      (firstBall.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.sin(angle) * speed,
        -Math.abs(Math.cos(angle)) * speed
      );
      console.log(`⚡ Phase 2 Ball speed: ${speed} px/s`);
    }

    this.armEmergencyTimers();
    this.schedulePowerUpSpawn();
  }

  /**
   * Override loseLife to check shield (Phase 2 specific)
   */
  protected loseLifeBase() {
    if (this.shieldActive) {
      this.shieldActive = false;
      sound.paddleHit();
      this.showShieldUsed();
      return;
    }

    // Call parent implementation
    super.loseLifeBase();
  }

  /**
   * Handle week transition (Phase 2: uses router)
   */
  protected handleNextWeek() {
    const completedWeek = this.currentWeek;
    const nextWeek = completedWeek + 1;
    this.gameStarted = false;
    this.gameOver = false;

    // Update React UI via event bus
    gameEventBus.emitGameEvent('WEEK_UPDATE', { week: nextWeek });
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: false });
    gameEventBus.emitGameEvent('GAME_OVER', { gameOver: false });
    gameEventBus.emitGameEvent('POWERUP_STATUS', { status: null });

    this.ballPool.getGroup().clear(true, true);
    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();

    this.blocks.clear(true, true);
    this.blockDataMap.clear();
    this.blockHitPoints.clear();
    this.clearTransientEffects();

    this.physics.world.colliders.destroy();
    this.hideOverlay();

    if (isBonusWeek(completedWeek) && nextWeek <= this.totalWeeks) {
      startWeekendBonus(this, completedWeek, nextWeek, {
        score: this.score,
        lives: this.lives,
      });
      return;
    }

    // Phase 2: Use router for week transitions
    startWeek(this, nextWeek, {
      score: this.score,
      lives: this.lives,
    });
  }

  /**
   * Override loseGame for Phase 2 restart behavior
   */
  protected loseGameBase() {
    this.gameOver = true;
    gameEventBus.emitGameEvent('GAME_OVER', { gameOver: true, finalScore: this.score });
    this.showOverlay('Meeting Overload 😵', `You've been overwhelmed by meetings!
Final Score: ${this.score}

Click to restart from Day 1`);

    this.input.once('pointerdown', () => {
      this.scene.restart({ week: 1, score: 0, lives: 3 });
    });
  }

  /**
   * Override quitGame for Phase 2 restart behavior
   */
  protected quitGame() {
    this.hideOverlay();
    this.showOverlay('🚪 QUITTING...', 'Restarting from Day 1');

    this.time.delayedCall(500, () => {
      this.scene.restart({ week: 1, score: 0, lives: 3 });
    });
  }

  protected onBlockDestroyed(block: PhaserBlock, blockId: string, meetingType: MeetingType): void {
    const meeting = this.blockDataMap.get(blockId);

    this.emergencyTimers.get(blockId)?.remove(false);
    this.emergencyTimers.delete(blockId);
    this.blockDataMap.delete(blockId);

    if (meetingType === 'recurring' && meeting) {
      this.spawnRecurringFollowUp(meeting);
    }

    if (meetingType === 'allhands') {
      this.damageAdjacentBlocks(block.x, block.y, blockId);
    }
  }

  private spawnRecurringFollowUp(source: Meeting) {
    const duration = 30;
    const startMin = source.endMin + duration <= 480
      ? source.endMin
      : Math.max(0, source.startMin - duration);

    const followUp: RenderItem = {
      day: source.day,
      startMin,
      endMin: startMin + duration,
      type: '1:1',
      title: 'Follow-up',
      col: 0,
      cols: 1,
    };

    const blockId = `meeting-${this.currentWeek}-followup-${++this.followUpCounter}`;
    this.createMeetingBlock(followUp, blockId);
    this.showDevToast('Recurring meeting added a follow-up');
  }

  private damageAdjacentBlocks(sourceX: number, sourceY: number, sourceBlockId: string) {
    const nearbyBlocks = this.blocks.getChildren()
      .map(blockObj => blockObj as PhaserBlock)
      .filter(block => {
        if (!block.active) return false;
        if (block.getData('blockId') === sourceBlockId) return false;
        return Phaser.Math.Distance.Between(sourceX, sourceY, block.x, block.y) <= 135;
      })
      .slice(0, 4);

    nearbyBlocks.forEach((block) => {
      const blockId = block.getData('blockId');
      const meetingType = block.getData('meetingType');
      const currentHP = this.blockHitPoints.get(blockId) || 1;
      this.applyBlockDamage(block, blockId, meetingType, currentHP, currentHP - 1, 0.5);
    });

    if (nearbyBlocks.length > 0) {
      this.showDevToast(`All-hands damaged ${nearbyBlocks.length} nearby meetings`);
    }
  }

  private armEmergencyTimers() {
    this.blocks.getChildren().forEach((blockObj) => {
      const block = blockObj as PhaserBlock;
      const blockId = block.getData('blockId');
      if (block.getData('meetingType') !== 'emergency') return;
      if (this.emergencyTimers.has(blockId)) return;

      const timer = this.time.delayedCall(8000, () => {
        this.triggerEmergencyPenalty(blockId);
      });
      this.emergencyTimers.set(blockId, timer);
    });
  }

  private triggerEmergencyPenalty(blockId: string) {
    if (!this.blockHitPoints.has(blockId) || this.gameOver) return;

    this.emergencyTimers.delete(blockId);
    this.lives--;
    this.updateLives();
    sound.lifeLost();
    this.showDevToast('Emergency meeting missed: -1 life');

    const block = this.blocks.getChildren()
      .map(blockObj => blockObj as PhaserBlock)
      .find(candidate => candidate.getData('blockId') === blockId);

    if (block?.active) {
      this.tweens.add({
        targets: block,
        alpha: 0.25,
        duration: 120,
        yoyo: true,
        repeat: 4,
      });
    }

    if (this.lives <= 0) {
      this.loseGameBase();
    }
  }

  private clearTransientEffects() {
    this.powerUpSpawnEvent?.remove(false);
    this.powerUpSpawnEvent = undefined;
    this.coffeeEvent?.remove(false);
    this.coffeeEvent = undefined;
    this.focusBonusEvent?.remove(false);
    this.focusBonusEvent = undefined;
    this.emergencyTimers.forEach(timer => timer.remove(false));
    this.emergencyTimers.clear();
    this.powerUpIcon?.destroy();
    this.powerUpIcon = undefined;
    this.coffeeActive = false;
    this.focusBonusActive = false;
    this.hidePowerUpStatus();
  }

  // ========== PHASE 2: POWER-UP METHODS ==========

  private schedulePowerUpSpawn() {
    if (this.powerUpSpawned || this.powerUpSpawnEvent) return;

    const delay = Phaser.Math.Between(
      POWERUP_CONFIG.MIN_SPAWN_DELAY,
      POWERUP_CONFIG.MAX_SPAWN_DELAY
    );

    this.powerUpSpawnEvent = this.time.delayedCall(delay, () => {
      this.powerUpSpawnEvent = undefined;
      if (this.gameStarted && !this.gameOver && !this.isPaused) {
        this.spawnDailyPowerUp();
      }
    });
  }

  private spawnDailyPowerUp() {
    if (this.powerUpSpawned) return;

    const validBlocks = this.blocks.getChildren().filter((blockObj) => {
      const block = blockObj as PhaserBlock;
      const type = this.blockDataMap.get(block.getData('blockId'))?.type;
      return POWERUP_CONFIG.AVOID_BOSS_BLOCKS ? type !== 'boss' : true;
    });

    if (validBlocks.length === 0) return;

    const block = Phaser.Math.RND.pick(validBlocks) as PhaserBlock;
    const excludedPowerUps: PowerUpKind[] = this.hasLunchWindowBlocks() ? [] : ['cleanup'];
    const powerUp = getRandomPowerUp(excludedPowerUps);
    const spawnX = block.x;
    const spawnY = block.y;

    // Extract emoji from label
    const emoji = powerUp.label.split(' ')[0];

    const icon = this.add.text(0, 0, emoji, {
      fontSize: '48px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    icon.setStroke('#000000', 4);
    icon.setShadow(0, 0, '#FFD700', 8, true, true);
    icon.setData('powerUpType', powerUp.id);

    const container = this.add.container(spawnX, spawnY, [icon]);
    this.physics.add.existing(container);
    this.powerUpIcon = container as PowerUpContainer;
    const body = this.powerUpIcon.body;
    body.setCircle(POWERUP_CONFIG.PICKUP_RADIUS);
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.tweens.add({
      targets: this.powerUpIcon,
      y: spawnY - POWERUP_CONFIG.FLOAT_AMPLITUDE,
      duration: POWERUP_CONFIG.FLOAT_SPEED / 2,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(POWERUP_CONFIG.FLOAT_SPEED * 10, () => {
      if (this.powerUpIcon) {
        console.log(`⏱️ Power-up expired (not collected)`);
        this.powerUpIcon.destroy();
        this.powerUpIcon = undefined;
      }
    });

    this.powerUpSpawned = true;
    console.log(`⚡ Power-up spawned: ${powerUp.label}`);
  }

  private isBallTouchingPowerUp(ball: PhaserBall, powerUpContainer: PowerUpContainer): boolean {
    const pickupDistance = POWERUP_CONFIG.PICKUP_RADIUS + PHYSICS.BALL_RADIUS;
    return Phaser.Math.Distance.Between(ball.x, ball.y, powerUpContainer.x, powerUpContainer.y) <= pickupDistance;
  }

  private hasLunchWindowBlocks(): boolean {
    return this.getConvertibleBlocks('lunch').length > 0;
  }

  private getConvertibleBlocks(meetingType: MeetingType): PhaserBlock[] {
    const blocks = this.blocks.getChildren().map(blockObj => blockObj as PhaserBlock);

    if (meetingType !== 'lunch') {
      return blocks;
    }

    return blocks.filter((block) => {
      const blockId = block.getData('blockId');
      const meeting = this.blockDataMap.get(blockId);
      return !!meeting && meeting.startMin >= LUNCH_START_MIN && meeting.endMin <= LUNCH_END_MIN;
    });
  }

  private collectPowerUp(_ball: PhaserBall, powerUpContainer: PowerUpContainer) {
    if (!this.powerUpIcon) return;
    if (!powerUpContainer.active) return;

    powerUpContainer.setActive(false);

    const powerUpType = powerUpContainer.list[0].getData('powerUpType') as PowerUpKind;
    const powerUp = POWERUPS[powerUpType];

    console.log(`✨ Collected power-up: ${powerUp.label}`);

    this.powerUpIcon.destroy();
    this.powerUpIcon = undefined;

    const applyPowerUp = () => {
      powerUp.apply(this);
      sound.paddleHit();
    };

    if (!this.seenPowerUps.has(powerUpType)) {
      this.seenPowerUps.add(powerUpType);
      this.showPowerUpIntro(powerUp.label, powerUp.description, applyPowerUp);
      return;
    }

    applyPowerUp();
  }

  private showPowerUpIntro(label: string, description: string, onContinue: () => void) {
    this.isPaused = true;
    this.physics.pause();
    this.time.paused = true;
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: true });

    if (this.pointerLocked) {
      document.exitPointerLock();
    }

    this.showOverlay(label, `${description}\n\nClick, Space, or Enter to continue`);

    let dismissed = false;
    const keyboard = this.input.keyboard;
    const dismiss = () => {
      if (dismissed) return;

      dismissed = true;
      this.input.off('pointerdown', dismiss);
      keyboard?.off('keydown-SPACE', dismiss);
      keyboard?.off('keydown-ENTER', dismiss);

      this.hideOverlay();
      this.time.paused = false;
      this.physics.resume();
      this.isPaused = false;
      gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: false });
      onContinue();
    };

    this.input.on('pointerdown', dismiss);
    keyboard?.on('keydown-SPACE', dismiss);
    keyboard?.on('keydown-ENTER', dismiss);
  }

  public applyCoffee(duration: number) {
    this.showPowerUpStatus('☕ Coffee Active');
    this.coffeeActive = true;
    this.coffeeEvent?.remove(false);

    this.coffeeEvent = this.time.addEvent({
      delay: duration,
      callback: () => {
        this.coffeeActive = false;
        this.coffeeEvent = undefined;
        this.hidePowerUpStatus();
      }
    });
  }

  private stabilizeActiveBallSpeeds() {
    const targetSpeed = Phaser.Math.Clamp(this.tuning.baseSpeed, PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);

    this.ballPool.getActiveBalls().forEach((ball) => {
      const body = ball.body;
      if (!body) return;

      const speed = body.velocity.length();
      if (speed <= 0) return;

      const ratio = targetSpeed / speed;
      body.setVelocity(body.velocity.x * ratio, body.velocity.y * ratio);
    });
  }

  protected getSceneScoreMultiplier(): number {
    return this.focusBonusActive ? 1.5 : 1;
  }

  public scalePaddle(scale: number, duration: number) {
    const baseWidth = this.getPaddleWidth();
    const newWidth = baseWidth * scale;

    this.paddle.setScale(scale, 1);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setSize(newWidth, PHYSICS.PADDLE_HEIGHT);

    this.showPowerUpStatus('🍻 Wide Paddle');

    this.time.addEvent({
      delay: duration,
      callback: () => {
        this.paddle.setScale(1, 1);
        (this.paddle.body as Phaser.Physics.Arcade.Body).setSize(baseWidth, PHYSICS.PADDLE_HEIGHT);
        this.hidePowerUpStatus();
      }
    });
  }

  public grantShield(_charges: number = 1) {
    this.shieldActive = true;
    this.showPowerUpStatus('🛡️ Shield Active');
  }

  public grantFocusBonus(duration: number) {
    this.focusBonusActive = true;
    this.focusBonusEvent?.remove(false);
    this.showPowerUpStatus('🎯 Focus Bonus');

    this.focusBonusEvent = this.time.addEvent({
      delay: duration,
      callback: () => {
        this.focusBonusActive = false;
        this.focusBonusEvent = undefined;
        this.hidePowerUpStatus();
      }
    });
  }

  public clearCurrentHourRow() {
    const firstBall = this.ballPool.getGroup().getFirstAlive();
    if (!firstBall) return;

    const ballY = firstBall.y;
    const blocksToDestroy: PhaserBlock[] = [];

    this.blocks.getChildren().forEach((blockObj) => {
      const block = blockObj as PhaserBlock;
      if (Math.abs(block.y - ballY) < 70) {
        blocksToDestroy.push(block);
      }
    });

    blocksToDestroy.forEach(block => {
      const blockId = block.getData('blockId');
      const currentHP = this.blockHitPoints.get(blockId) || 1;

      block.destroy();
      this.children.getChildren().forEach((child) => {
        const childWithData = child as GameObjectWithData;
        if (childWithData.getData && childWithData.getData('blockId') === blockId) {
          child.destroy();
        }
      });

      this.blockHitPoints.delete(blockId);
      this.blockDataMap.delete(blockId);
      this.emergencyTimers.get(blockId)?.remove(false);
      this.emergencyTimers.delete(blockId);
      this.score += currentHP * SCORING.POINTS_PER_DESTROY;
    });

    this.updateScore();
    sound.blockDestroyed();
    console.log(`📅 Cleared ${blocksToDestroy.length} meetings from hour row`);
  }

  public convertRandomBlocks(count: number, meetingType: MeetingType = 'lunch') {
    const blocks = Phaser.Math.RND.shuffle(this.getConvertibleBlocks(meetingType))
      .slice(0, count) as PhaserBlock[];

    if (blocks.length === 0) {
      this.showDevToast(meetingType === 'lunch'
        ? 'No lunch-window meetings to clean up'
        : `No meetings to convert to ${meetingType}`);
      return;
    }

    // Use theme colors for consistency
    const color = this.getColorForMeetingType(meetingType);
    const hp = this.getHitPointsForMeeting(meetingType);

    blocks.forEach((block) => {
      const blockId = block.getData('blockId');
      const meeting = this.blockDataMap.get(blockId);
      this.blockHitPoints.set(blockId, hp);
      block.setData('meetingType', meetingType);
      block.setFillStyle(color, 0.85);

      if (meeting) {
        const title = meetingType === 'lunch' ? 'Lunch Break' : meetingType;
        this.blockDataMap.set(blockId, {
          ...meeting,
          type: meetingType,
          title,
        });

        this.children.getChildren().forEach((child) => {
          const childWithData = child as GameObjectWithData;
          if (!childWithData.getData || childWithData.getData('blockId') !== blockId) return;

          const childType = childWithData.getData('blockChildType');
          if (childType === 'accent' && child instanceof Phaser.GameObjects.Rectangle) {
            child.setFillStyle(color, 1);
          }
          if (childType === 'label' && child instanceof Phaser.GameObjects.Text) {
            child.setText(title);
          }
        });
      }
    });

    console.log(`🧹 Converted ${blocks.length} meetings to ${meetingType} breaks`);
  }

  private showPowerUpStatus(text: string) {
    // Update React UI via event bus
    gameEventBus.emitGameEvent('POWERUP_STATUS', { status: text });
  }

  private hidePowerUpStatus() {
    // Clear power-up status via event bus
    gameEventBus.emitGameEvent('POWERUP_STATUS', { status: null });
  }

  private showShieldUsed() {
    // This will still use Phaser text objects for now, can be migrated later if needed
    const { width, height } = getBoardDimensions();
    const shieldText = this.add.text(width / 2, height / 2, '🛡️ SHIELD BLOCKED!', {
      fontSize: '48px',
      color: '#4169E1',
      stroke: '#FFFFFF',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(2000);

    this.tweens.add({
      targets: shieldText,
      alpha: 0,
      scale: 2,
      duration: 1000,
      onComplete: () => shieldText.destroy()
    });

    this.hidePowerUpStatus();
  }

  /**
   * Scene cleanup
   */
  shutdown() {
    if (this.handlePointerLockChange) {
      document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
      this.handlePointerLockChange = undefined;
    }

    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();
    this.clearTransientEffects();

    console.log('🧹 MainScenePhase2 cleanup completed');
  }
}

export default MainScenePhase2;
