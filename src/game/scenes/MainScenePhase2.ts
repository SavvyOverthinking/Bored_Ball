/**
 * Main Game Scene - Phase 2
 * Enhanced with level curve, power-ups, and weekend routing
 * Now extends BaseCalendarScene to eliminate code duplication
 */

import { getCalendarGridConfig, getBoardDimensions } from '@game/utils/calendarGenerator';
import { type MeetingType } from '@game/systems/physicsModifiers';
import { PHYSICS, SCORING } from '@config/constants';
import { sound } from '@game/systems/soundEffects';
import { gameEventBus } from '@game/systems/GameEventBus';
import { curve, type LevelTuning } from '@game/utils/levelCurve';
import { startWeek } from '@game/utils/phase2Router';
import { POWERUPS, POWERUP_CONFIG, getRandomPowerUp, type PowerUpKind } from '@game/objects/powerups';
import { generateWeek, computeColumns, type Meeting } from '@game/utils/calendarGeneratorPhase2';
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

    // Check for URL param override (?week=25)
    const urlParams = new URLSearchParams(window.location.search);
    const urlWeek = Number(urlParams.get('week'));

    if (urlWeek && Number.isFinite(urlWeek) && urlWeek > 0 && urlWeek <= 52) {
      this.currentWeek = urlWeek;
      console.log(`🔧 DEV: Week overridden via URL param: ${urlWeek}`);
    } else {
      this.currentWeek = data.week || 1;
    }

    this.score = data.score || 0;
    this.lives = data.lives || 3;

    // IMPORTANT: Always get tuning from curve() for proper arcade progression
    // This ensures paddle shrinks over 10 weeks and speed increases
    this.tuning = data.tuning || curve(this.currentWeek);
    console.log(`✅ Week ${this.currentWeek} tuning: paddle=${this.tuning.paddleScale.toFixed(2)}, speed=${this.tuning.baseSpeed}`);

    this.powerUpSpawned = false;
    this.shieldActive = false;

    console.log(`📈 Week ${this.currentWeek} Tuning Applied:`, this.tuning);
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

    // Phase 2: Schedule power-up spawn
    this.schedulePowerUpSpawn();
  }

  update() {
    // Call base update with paddle velocity reset
    this.baseUpdate();

    // Phase 2: Check for power-up collision
    if (this.gameStarted && !this.gameOver && !this.isPaused && this.powerUpIcon) {
      this.ballPool.getGroup().getChildren().forEach((ballObj) => {
        const ball = ballObj as PhaserBall;
        if (ball.body && this.powerUpIcon) {
          if (this.physics.overlap(ball, this.powerUpIcon)) {
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

    const config = getCalendarGridConfig();
    const START_HOUR = 9;
    const END_HOUR = 17;
    const DAY_MINS = (END_HOUR - START_HOUR) * 60;

    // Use theme colors from base class (supports ?theme=google URL parameter)
    const getColorForType = (type: MeetingType) => this.getColorForMeetingType(type);

    renderItems.forEach((item, index) => {
      const blockId = `meeting-${this.currentWeek}-${index}`;

      const dayX = config.padding + item.day * (config.columnWidth + config.columnGap);
      const yPerMin = config.gridHeight / DAY_MINS;

      const bandTop = config.headerHeight + item.startMin * yPerMin;
      const bandBot = config.headerHeight + item.endMin * yPerMin;

      const fullW = config.columnWidth - 6;
      const w = (fullW / item.cols) - 4;
      const x = dayX + (fullW / item.cols) * item.col + w / 2 + 4;
      const y = (bandTop + bandBot) / 2;
      const h = Math.max(20, bandBot - bandTop - 4);

      const color = getColorForType(item.type);

      const blockRect = this.add.rectangle(x, y, w, h, color, 0.85);
      blockRect.setStrokeStyle(1, 0xffffff, 0.2);
      this.blocks.add(blockRect);

      const block = blockRect as PhaserBlock;
      block.setData('meetingType', item.type);
      block.setData('blockId', blockId);

      // Create left accent bar
      const accentBar = this.add.rectangle(x - w / 2 + 2, y, 3, h, color, 1.0);
      accentBar.setData('blockId', blockId);
      accentBar.setDepth(2);

      // Initialize hit points
      const hitPoints = item.title === 'Onboarding' ? 1 : this.getHitPointsForMeeting(item.type);
      this.blockHitPoints.set(blockId, hitPoints);

      // Add title text (if block is tall enough)
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
        text.setDepth(5);
      }

      this.blockDataMap.set(blockId, item);
    });

    console.log(`✨ Phase 2: Generated ${meetings.length} meetings for week ${this.currentWeek}`);
    console.log(`📊 Render stats: ${renderItems.length} blocks (including ${renderItems.filter(r => r.cols > 1).length} in double-bookings)`);
  }

  /**
   * Get hit points for meeting type (Phase 2 implementation)
   */
  protected getHitPointsForMeeting(type: MeetingType): number {
    switch (type) {
      case 'boss': return 3;
      case 'team': return 2;
      case '1:1': return 2;
      case 'lunch': return 1;
      case 'personal': return 1;
      default: return 2;
    }
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
        const nextWeek = Math.min(52, this.currentWeek + 1);
        this.showDevToast(`DEV: Jumping to Week ${nextWeek}`);
        this.scene.restart({ week: nextWeek, score: this.score, lives: this.lives });
      }

      if (event.ctrlKey && event.shiftKey && event.code === 'ArrowDown') {
        event.preventDefault();
        const prevWeek = Math.max(1, this.currentWeek - 1);
        this.showDevToast(`DEV: Jumping to Week ${prevWeek}`);
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
    this.currentWeek++;
    this.gameStarted = false;
    this.gameOver = false;

    // Update React UI via event bus
    gameEventBus.emitGameEvent('WEEK_UPDATE', { week: this.currentWeek });
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: false });
    gameEventBus.emitGameEvent('GAME_OVER', { gameOver: false });
    gameEventBus.emitGameEvent('POWERUP_STATUS', { status: null });

    this.ballPool.getGroup().clear(true, true);
    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();

    this.blocks.clear(true, true);
    this.blockDataMap.clear();
    this.blockHitPoints.clear();

    this.physics.world.colliders.destroy();
    this.hideOverlay();

    // Phase 2: Use router for week transitions
    startWeek(this, this.currentWeek, {
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

Click to restart from Week 1`);

    this.input.once('pointerdown', () => {
      this.scene.restart({ week: 1, score: 0, lives: 3 });
    });
  }

  /**
   * Override quitGame for Phase 2 restart behavior
   */
  protected quitGame() {
    this.hideOverlay();
    this.showOverlay('🚪 QUITTING...', 'Restarting from Week 1');

    this.time.delayedCall(500, () => {
      this.scene.restart({ week: 1, score: 0, lives: 3 });
    });
  }

  // ========== PHASE 2: POWER-UP METHODS ==========

  private schedulePowerUpSpawn() {
    if (this.powerUpSpawned) return;

    const delay = Phaser.Math.Between(
      POWERUP_CONFIG.MIN_SPAWN_DELAY,
      POWERUP_CONFIG.MAX_SPAWN_DELAY
    );

    this.time.delayedCall(delay, () => {
      this.spawnWeeklyPowerUp();
    });
  }

  private spawnWeeklyPowerUp() {
    if (this.powerUpSpawned) return;

    const validBlocks = this.blocks.getChildren().filter((blockObj) => {
      const block = blockObj as PhaserBlock;
      const type = this.blockDataMap.get(block.getData('blockId'))?.type;
      return POWERUP_CONFIG.AVOID_BOSS_BLOCKS ? type !== 'boss' : true;
    });

    if (validBlocks.length === 0) return;

    const block = Phaser.Math.RND.pick(validBlocks) as PhaserBlock;
    const powerUp = getRandomPowerUp();

    // Extract emoji from label
    const emoji = powerUp.label.split(' ')[0];

    const icon = this.add.text(block.x, block.y - 30, emoji, {
      fontSize: '48px',
      color: '#FFFFFF'
    }).setOrigin(0.5);

    icon.setStroke('#000000', 4);
    icon.setShadow(0, 0, '#FFD700', 8, true, true);
    icon.setData('powerUpType', powerUp.id);

    const container = this.add.container(block.x, block.y - 30, [icon]);
    this.physics.add.existing(container);
    this.powerUpIcon = container as PowerUpContainer;
    const body = this.powerUpIcon.body;
    body.setCircle(POWERUP_CONFIG.PICKUP_RADIUS);

    this.tweens.add({
      targets: this.powerUpIcon,
      y: block.y - 30 - POWERUP_CONFIG.FLOAT_AMPLITUDE,
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

  private collectPowerUp(_ball: PhaserBall, powerUpContainer: PowerUpContainer) {
    if (!this.powerUpIcon) return;
    if (!powerUpContainer.active) return;

    powerUpContainer.setActive(false);

    const powerUpType = powerUpContainer.list[0].getData('powerUpType') as PowerUpKind;
    const powerUp = POWERUPS[powerUpType];

    console.log(`✨ Collected power-up: ${powerUp.label}`);

    powerUp.apply(this);
    sound.paddleHit();

    this.powerUpIcon.destroy();
    this.powerUpIcon = undefined;
  }

  public applyCoffee(duration: number) {
    this.showPowerUpStatus('☕ Coffee Active');

    this.time.addEvent({
      delay: duration,
      callback: () => {
        this.hidePowerUpStatus();
      }
    });
  }

  public scalePaddle(scale: number, duration: number) {
    const currentWidth = 120 * this.tuning.paddleScale;
    const newWidth = currentWidth * scale;

    this.paddle.setScale(scale, 1);
    (this.paddle.body as Phaser.Physics.Arcade.Body).setSize(newWidth, 18);

    this.showPowerUpStatus('🍻 Wide Paddle');

    this.time.addEvent({
      delay: duration,
      callback: () => {
        this.paddle.setScale(this.tuning.paddleScale, 1);
        (this.paddle.body as Phaser.Physics.Arcade.Body).setSize(120 * this.tuning.paddleScale, 18);
        this.hidePowerUpStatus();
      }
    });
  }

  public grantShield(_charges: number = 1) {
    this.shieldActive = true;
    this.showPowerUpStatus('🛡️ Shield Active');
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
      this.score += currentHP * SCORING.POINTS_PER_DESTROY;
    });

    this.updateScore();
    sound.blockDestroyed();
    console.log(`📅 Cleared ${blocksToDestroy.length} meetings from hour row`);
  }

  public convertRandomBlocks(count: number, meetingType: string = 'lunch') {
    const blocks = Phaser.Math.RND.shuffle(this.blocks.getChildren())
      .slice(0, count) as PhaserBlock[];

    // Use theme colors for consistency
    const typeConfig: Record<string, { color: number; hp: number }> = {
      lunch: { color: this.getColorForMeetingType('lunch'), hp: 1 },
      personal: { color: this.getColorForMeetingType('personal'), hp: 1 },
      '1:1': { color: this.getColorForMeetingType('1:1'), hp: 2 },
      team: { color: this.getColorForMeetingType('team'), hp: 2 },
      boss: { color: this.getColorForMeetingType('boss'), hp: 3 }
    };

    const config = typeConfig[meetingType] || typeConfig.lunch;

    blocks.forEach((block) => {
      const blockId = block.getData('blockId');
      this.blockHitPoints.set(blockId, config.hp);
      block.setFillStyle(config.color, 0.85);
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

    console.log('🧹 MainScenePhase2 cleanup completed');
  }
}

export default MainScenePhase2;