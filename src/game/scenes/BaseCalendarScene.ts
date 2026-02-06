import Phaser from 'phaser';
import { getCalendarGridConfig, getBoardDimensions } from '@game/utils/calendarGenerator';
import { applyMeetingEffect, type MeetingType } from '@game/systems/physicsModifiers';
import { BallPool } from '@game/objects/BallPool';
import { calculatePaddleBounceAngle, PHYSICS, STUCK_DETECTION, SCORING } from '@config/constants';
import { sound } from '@game/systems/soundEffects';
import { gameEventBus } from '@game/systems/GameEventBus';
import { ComboManager } from '@game/systems/comboSystem';
import type { PhaserBall, PhaserBlock, PhaserPaddle, BallPositionEntry, LoaderFile, GameObjectWithData } from '@/types/game';
import { THEMES, getThemeFromUrl, type ThemeName } from '@styles/theme';

/**
 * Abstract base class for calendar breakout scenes
 * Subclasses must implement: createBlocks(), getHitPointsForMeeting(), getPaddleWidth()
 */
export abstract class BaseCalendarScene extends Phaser.Scene {
  // Game objects
  protected paddle!: PhaserPaddle;
  public ballPool!: BallPool;
  protected blocks!: Phaser.Physics.Arcade.StaticGroup;
  protected blockHitPoints: Map<string, number> = new Map();

  // Ball stuck detection
  protected ballPositionHistory: Map<PhaserBall, Array<BallPositionEntry>> = new Map();
  protected ballCorrectionCooldown: Map<PhaserBall, number> = new Map();
  protected stuckCheckCounter: number = 0;

  // Game state (managed by React Context)
  protected score: number = 0;
  protected lives: number = 3;
  protected currentWeek: number = 1;
  protected totalWeeks: number = 52;
  protected gameStarted: boolean = false;
  protected gameOver: boolean = false;
  protected isPaused: boolean = false;
  protected escapePressed: boolean = false;
  protected pointerLocked: boolean = false;

  // Combo system
  protected comboManager: ComboManager = new ComboManager();

  // Theme system
  protected themeName: ThemeName;
  protected theme: typeof THEMES[ThemeName];

  constructor(key: string) {
    super({ key });
    // Initialize theme from URL parameter
    this.themeName = getThemeFromUrl();
    this.theme = THEMES[this.themeName];
    console.log(`🎨 Theme: ${this.themeName}`);
  }

  /**
   * Initialize scene - reset all state and emit initial values via event bus
   */
  init(_data: Record<string, unknown> = {}) {
    // CRITICAL: Reset all game state for fresh start
    this.gameStarted = false;
    this.gameOver = false;
    this.isPaused = false;
    this.isCountingDown = false;
    this.escapePressed = false;
    this.pointerLocked = false;
    this.stuckCheckCounter = 0;

    // Reset combo
    this.comboManager = new ComboManager();

    // Clear tracking maps
    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();
    this.blockHitPoints.clear();

    // Emit initial state via event bus
    gameEventBus.emitGameEvent('SCORE_UPDATE', { score: this.score });
    gameEventBus.emitGameEvent('LIVES_UPDATE', { lives: this.lives });
    gameEventBus.emitGameEvent('WEEK_UPDATE', { week: this.currentWeek });
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: false });
    gameEventBus.emitGameEvent('GAME_OVER', { gameOver: false });
    gameEventBus.emitGameEvent('POWERUP_STATUS', { status: null });
    gameEventBus.emitGameEvent('COMBO_UPDATE', { combo: 0, multiplier: 1 });
  }

  // Overlay UI elements (used for pause/win/lose screens within Phaser)
  protected overlayBg!: Phaser.GameObjects.Rectangle;
  protected overlayText!: Phaser.GameObjects.Text;
  protected overlaySubtext!: Phaser.GameObjects.Text;

  // Splash screen elements
  protected splashImage!: Phaser.GameObjects.Image;
  protected splashOverlay!: Phaser.GameObjects.Rectangle;
  protected countdownText!: Phaser.GameObjects.Text;
  protected isCountingDown: boolean = false;

  /**
   * Abstract methods - must be implemented by subclasses
   */
  protected abstract createBlocks(): void;
  protected abstract getHitPointsForMeeting(type: MeetingType): number;
  protected abstract getPaddleWidth(): number;
  protected abstract handleNextWeek(): void;

  /**
   * Get color for meeting type from current theme
   */
  protected getColorForMeetingType(type: MeetingType): number {
    return this.theme.colors[type] || this.theme.colors['1:1'];
  }

  /**
   * Apply theme background color to scene
   */
  protected applyThemeBackground() {
    this.theme.bg(this);
  }

  /**
   * Preload assets (splash screen)
   */
  preload() {
    this.load.on('loaderror', (file: LoaderFile) => {
      console.log('Splash image not found, will use fallback', file.src);
    });
    this.load.image('splash', import.meta.env.BASE_URL + 'splash.jpg');
  }

  /**
   * Base create logic - calls template methods for customization
   */
  protected baseCreate() {
    // Reset all game state
    this.gameStarted = false;
    this.gameOver = false;
    this.isPaused = false;
    this.escapePressed = false;
    this.isCountingDown = false;
    this.stuckCheckCounter = 0;
    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();

    const { width, height } = getBoardDimensions();
    this.add.rectangle(width / 2, height / 2, width, height, 0xfafbfc);

    // Initialize ball pool
    this.ballPool = new BallPool(this);

    // Draw calendar grid
    this.drawCalendarGrid();

    // Create blocks (implemented by subclass)
    this.createBlocks();

    // Create paddle (uses getPaddleWidth() for customization)
    this.createPaddleBase();

    // Create initial ball
    this.createBallBase();

    // Setup input
    this.setupInputBase();

    // Create overlay UI for pause/win/lose screens
    this.createOverlayUI();

    // Setup collisions
    this.setupCollisionsBase();

    // Create splash screen
    this.createSplashScreen();
    this.showSplashScreen();
  }

  /**
   * Base update logic - handles common physics and game state
   */
  protected baseUpdate() {
    // Keep paddle velocity at zero
    const paddleBody = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (paddleBody) {
      paddleBody.setVelocity(0, 0);
    }

    // Handle splash screen click
    if (this.splashImage.visible && this.input.activePointer.isDown) {
      this.hideSplashAndStartCountdown();
      return;
    }

    // Start game on click
    if (!this.gameStarted && !this.isPaused && !this.isCountingDown && this.input.activePointer.isDown) {
      this.gameOver = false;
      this.startGameBase();
    }

    // Early return for paused/gameOver/countdown states
    if (this.gameOver || this.isPaused || this.isCountingDown) return;

    // Manual paddle collision check for English physics
    if (this.gameStarted && !this.gameOver && !this.isPaused) {
      this.ballPool.getGroup().getChildren().forEach((ballObj) => {
        const ball = ballObj as PhaserBall;
        const ballBody = ball.body;
        if (ballBody && ballBody.velocity.y > 0) {
          if (this.physics.overlap(ball, this.paddle)) {
            this.ballHitPaddleBase(ball, this.paddle);
          }
        }
      });
    }

    // Check if all blocks destroyed
    if (this.blocks.getLength() === 0 && this.gameStarted && !this.gameOver) {
      this.winGameBase();
    }

    // Ball stuck detection (every 10 frames)
    this.detectStuckBalls();

    // Clean up balls that fell off screen
    this.ballPool.killIfOffscreen();

    // Check if all balls are out of bounds
    if (this.ballPool.getActiveBallCount() === 0 && this.gameStarted && !this.gameOver) {
      this.loseLifeBase();
    }

    // Update first ball position before game starts
    if (!this.gameStarted) {
      const firstBall = this.ballPool.getGroup().getFirstAlive();
      if (firstBall) {
        firstBall.x = this.paddle.x;
        firstBall.y = this.paddle.y - 30;
      }
    }
  }

  /**
   * Draw calendar grid background (100% shared)
   */
  protected drawCalendarGrid() {
    const config = getCalendarGridConfig();
    const graphics = this.add.graphics();

    // Draw day labels
    config.days.forEach((day, index) => {
      const x = config.padding + index * (config.columnWidth + config.columnGap) + config.columnWidth / 2;
      this.add.text(x, 25, day.substring(0, 3).toUpperCase(), {
        fontFamily: 'Segoe UI, Inter, sans-serif',
        fontSize: '12px',
        color: '#605e5c',
        fontStyle: '600',
      }).setOrigin(0.5);
    });

    // Draw time labels
    const gridHeight = config.gridHeight;
    const hourCount = config.hours.length - 1;

    config.hours.forEach((hour, index) => {
      const y = config.headerHeight + (gridHeight / hourCount) * index;
      let displayHour = hour;
      let ampm = 'AM';

      if (hour === 0) {
        displayHour = 12;
      } else if (hour === 12) {
        ampm = 'PM';
      } else if (hour > 12) {
        displayHour = hour - 12;
        ampm = 'PM';
      }

      const timeStr = `${displayHour} ${ampm}`;
      this.add.text(18, y - 5, timeStr, {
        fontFamily: 'Segoe UI, Inter, sans-serif',
        fontSize: '10px',
        color: '#8a8886',
      }).setOrigin(0, 0);
    });

    // Draw grid lines
    graphics.lineStyle(1, 0xedebe9, 1);

    config.hours.forEach((_, index) => {
      const y = config.headerHeight + (gridHeight / hourCount) * index;
      graphics.lineBetween(
        config.padding,
        y,
        getBoardDimensions().width - config.padding,
        y
      );
    });

    // Vertical lines between days
    for (let i = 1; i < config.days.length; i++) {
      const x = config.padding + i * (config.columnWidth + config.columnGap) - config.columnGap / 2;
      graphics.lineStyle(1, 0xe1dfdd, 1);
      graphics.lineBetween(
        x,
        config.headerHeight,
        x,
        config.headerHeight + gridHeight
      );
    }
  }

  /**
   * Create paddle (uses getPaddleWidth() for customization)
   */
  protected createPaddleBase() {
    const { width, height } = getBoardDimensions();
    const paddleWidth = this.getPaddleWidth();

    const paddleGraphics = this.add.rectangle(width / 2, height - 50, paddleWidth, 18, 0x0078d4, 1);
    paddleGraphics.setStrokeStyle(1, 0x106ebe, 1);

    this.physics.add.existing(paddleGraphics);
    this.paddle = paddleGraphics as PhaserPaddle;

    const body = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.immovable = true;
      body.setSize(paddleWidth, 18);
    }

    this.paddle.setDepth(10);
  }

  /**
   * Create initial ball
   */
  protected createBallBase() {
    const { width, height } = getBoardDimensions();
    this.ballPool.spawn(width / 2, height - 80, 0, 0);
  }

  /**
   * Setup input handlers
   */
  protected setupInputBase() {
    const { width } = getBoardDimensions();

    // Pointer lock on canvas click
    this.input.on('pointerdown', () => {
      if (this.gameStarted && !this.gameOver && !this.isPaused && !this.isCountingDown && !this.splashImage.visible) {
        const canvas = this.game.canvas;
        if (canvas && !this.pointerLocked) {
          canvas.requestPointerLock();
        }
      }
    });

    // Listen for pointer lock changes
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.game.canvas;
    });

    // Handle pointer movement
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isPaused || this.isCountingDown || this.splashImage.visible) return;

      if (this.pointerLocked) {
        const movementX = pointer.movementX || 0;
        this.paddle.x = Phaser.Math.Clamp(
          this.paddle.x + movementX * 1.5,
          50,
          width - 50
        );
      } else {
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, width - 50);
      }
    });

    // ESC key handler
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gameOver) return;

      if (!this.isPaused && !this.escapePressed) {
        this.pauseGame();
        this.escapePressed = true;
      } else if (this.isPaused && this.escapePressed) {
        this.quitGame();
      }
    });
  }

  /**
   * Setup collision handlers
   */
  protected setupCollisionsBase() {
    this.physics.world.setBoundsCollision(true, true, true, false);

    // Manual paddle collision handled in update()
    // Ball-block collision
    this.physics.add.collider(
      this.ballPool.getGroup(),
      this.blocks,
      (ballObj, blockObj) => {
        this.ballHitBlockBase(ballObj as PhaserBall, blockObj as PhaserBlock);
      },
      undefined,
      this
    );
  }

  /**
   * Ball hits paddle handler
   */
  protected ballHitPaddleBase(ball: PhaserBall, paddle: PhaserPaddle) {
    const ballBody = ball.body;
    if (!ballBody) return;

    sound.paddleHit();

    // Reset combo on paddle hit (encourages risky play)
    const comboState = this.comboManager.reset();
    gameEventBus.emitGameEvent('COMBO_UPDATE', {
      combo: comboState.hits,
      multiplier: comboState.multiplier
    });

    const paddleWidth = this.getPaddleWidth();
    const angle = calculatePaddleBounceAngle(ball.x, paddle.x, paddleWidth);

    const relativePos = (ball.x - paddle.x) / (paddleWidth / 2);
    const hitZone = Math.abs(relativePos) < 0.14 ? 'CENTER' :
                    Math.abs(relativePos) < 0.35 ? 'INNER' :
                    Math.abs(relativePos) < 0.65 ? 'MIDDLE' : 'OUTER';

    console.log(`🎯 Paddle hit: ${hitZone} zone, angle: ${Phaser.Math.RadToDeg(angle).toFixed(1)}°, pos: ${relativePos.toFixed(2)}`);

    const currentSpeed = ballBody.velocity.length();
    const speed = Phaser.Math.Clamp(currentSpeed, PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);

    const newVelocityX = Math.sin(angle) * speed;
    const newVelocityY = -Math.abs(Math.cos(angle)) * speed;

    ballBody.setVelocity(newVelocityX, newVelocityY);
    ball.y = paddle.y - (paddle.height / 2) - (ball.height / 2) - 2;

    console.log(`   → Final velocity: (${newVelocityX.toFixed(1)}, ${newVelocityY.toFixed(1)})`);
  }

  /**
   * Ball hits block handler
   */
  protected ballHitBlockBase(ball: PhaserBall, block: PhaserBlock) {
    const meetingType = block.getData('meetingType');
    const blockId = block.getData('blockId');

    const currentHP = this.blockHitPoints.get(blockId) || 1;
    const newHP = currentHP - 1;

    // Increment combo and get multiplier
    const comboState = this.comboManager.hit();
    const multiplier = comboState.multiplier;

    // Emit combo update
    gameEventBus.emitGameEvent('COMBO_UPDATE', {
      combo: comboState.hits,
      multiplier: comboState.multiplier
    });

    // Check if we just reached On Fire
    if (this.comboManager.didJustReachOnFire()) {
      console.log('🔥 ON FIRE! Combo bonus active!');
      // Could add visual/audio effects here
    }

    if (newHP <= 0) {
      sound.blockDestroyed();
      block.destroy();

      // Find and remove associated text and accent bar
      this.children.getChildren().forEach((child) => {
        const childWithData = child as GameObjectWithData;
        if (childWithData.getData && childWithData.getData('blockId') === blockId) {
          child.destroy();
        }
      });

      this.blockHitPoints.delete(blockId);
      // Apply combo multiplier to destroy points
      const points = Math.round(currentHP * SCORING.POINTS_PER_DESTROY * multiplier);
      this.score += points;
      this.updateScore();
    } else {
      sound.blockHit();
      this.blockHitPoints.set(blockId, newHP);

      this.tweens.add({
        targets: block,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        ease: 'Power1'
      });

      // Apply combo multiplier to hit points
      const points = Math.round(SCORING.POINTS_PER_HIT * multiplier);
      this.score += points;
      this.updateScore();
    }

    applyMeetingEffect(meetingType, ball, this);
  }

  /**
   * Ball stuck detection logic (100% shared)
   */
  protected detectStuckBalls() {
    this.stuckCheckCounter++;
    if (this.gameStarted && this.stuckCheckCounter >= STUCK_DETECTION.CHECK_INTERVAL) {
      this.stuckCheckCounter = 0;
      const currentTime = this.time.now;

      this.ballPool.getGroup().children.iterate((ballObj) => {
        const ball = ballObj as PhaserBall;
        if (ball.active && ball.body) {
          const body = ball.body;
          const absVelocityY = Math.abs(body.velocity.y);

          const lastCorrection = this.ballCorrectionCooldown.get(ball) || 0;
          if (currentTime - lastCorrection < STUCK_DETECTION.CORRECTION_COOLDOWN_MS) {
            return true;
          }

          if (!this.ballPositionHistory.has(ball)) {
            this.ballPositionHistory.set(ball, []);
          }
          const history = this.ballPositionHistory.get(ball)!;
          history.push({ x: ball.x, y: ball.y, time: currentTime });

          // Keep only recent history (1.5 seconds at 60fps)
          if (history.length > STUCK_DETECTION.HISTORY_LENGTH) {
            history.shift();
          }

          let needsCorrection = false;

          if (absVelocityY < STUCK_DETECTION.MIN_VERTICAL_VELOCITY) {
            needsCorrection = true;
          }

          // Check variance over last 60 frames (1 second at 60fps)
          const recentFrames = Math.floor(STUCK_DETECTION.HISTORY_LENGTH * 2 / 3);
          if (history.length >= recentFrames) {
            const recent = history.slice(-recentFrames);
            const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
            const yVariance = recent.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / recent.length;

            if (yVariance < STUCK_DETECTION.POSITION_VARIANCE_THRESHOLD) {
              needsCorrection = true;
            }
          }

          if (needsCorrection) {
            const speed = Phaser.Math.Clamp(body.velocity.length(), PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
            const randomAngle = Phaser.Math.Between(40, 70) * Math.PI / 180;
            const direction = body.velocity.y > 0 ? 1 : -1;

            body.setVelocity(
              Math.cos(randomAngle) * speed * (body.velocity.x > 0 ? 1 : -1),
              Math.sin(randomAngle) * speed * direction
            );

            this.ballPositionHistory.set(ball, []);
            this.ballCorrectionCooldown.set(ball, currentTime);
          }
        }
        return true;
      });
    }
  }

  /**
   * Start the game
   */
  protected startGameBase() {
    if (this.gameStarted) return;

    this.gameStarted = true;

    const firstBall = this.ballPool.getGroup().getFirstAlive();
    if (firstBall && firstBall.body) {
      const angle = Phaser.Math.Between(-45, 45) * Math.PI / 180;
      const speed = PHYSICS.BASE_SPEED;
      (firstBall.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.sin(angle) * speed,
        -Math.abs(Math.cos(angle)) * speed
      );
    }
  }

  /**
   * Lose a life (can be overridden for shield mechanics)
   */
  protected loseLifeBase() {
    this.lives--;
    this.updateLives();
    sound.lifeLost();

    if (this.lives <= 0) {
      this.loseGameBase();
    } else {
      this.gameStarted = false;
      this.createBallBase();
    }
  }

  /**
   * Create overlay UI elements for pause/win/lose screens
   */
  protected createOverlayUI() {
    const { width, height } = getBoardDimensions();

    this.overlayBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.overlayBg.setDepth(500).setVisible(false);

    this.overlayText = this.add.text(width / 2, height / 2 - 40, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(501).setVisible(false);

    this.overlaySubtext = this.add.text(width / 2, height / 2 + 40, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#e0e0e0',
      align: 'center',
    }).setOrigin(0.5).setDepth(501).setVisible(false);
  }

  /**
   * Create splash screen (100% shared)
   */
  protected createSplashScreen() {
    const { width, height } = getBoardDimensions();

    this.splashOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.splashOverlay.setDepth(999);
    this.splashOverlay.setVisible(false);

    if (this.textures.exists('splash')) {
      this.splashImage = this.add.image(width / 2, height / 2, 'splash');
      const scale = Math.min(width / this.splashImage.width, height / this.splashImage.height) * 0.95;
      this.splashImage.setScale(scale);
    } else {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x1a1a2e, 1);
      graphics.fillRect(0, 0, width, height);
      graphics.lineStyle(8, 0xFF6600, 1);
      graphics.strokeRect(20, 20, width - 40, height - 40);
      graphics.fillStyle(0x16213E, 1);
      graphics.fillRoundedRect(width / 2 - 300, 80, 600, 120, 10);
      graphics.generateTexture('fallback_splash', width, height);
      graphics.destroy();

      this.splashImage = this.add.image(width / 2, height / 2, 'fallback_splash');

      const titleText = this.add.text(width / 2, 140, '📅 CALENDAR BREAKOUT', {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '48px',
        color: '#00D9FF',
        stroke: '#FF6600',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(1001);

      const subtitleText = this.add.text(width / 2, 200, 'DESTROY YOUR MEETINGS!', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '24px',
        color: '#FFD700'
      }).setOrigin(0.5).setDepth(1001);

      const instructText = this.add.text(width / 2, height - 100, 'Click anywhere to start', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        color: '#FFFFFF',
        backgroundColor: '#FF6600',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5).setDepth(1001);

      (this.splashImage as Phaser.GameObjects.Image & { overlayTexts?: Phaser.GameObjects.Text[] }).overlayTexts = [titleText, subtitleText, instructText];
    }

    this.splashImage.setDepth(1000);
    this.splashImage.setVisible(false);
    this.splashImage.setInteractive({ useHandCursor: true });

    this.countdownText = this.add.text(width / 2, height / 2, '', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '120px',
      color: '#FFD700',
      stroke: '#FF6600',
      strokeThickness: 8,
      shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 10,
        fill: true
      }
    }).setOrigin(0.5).setDepth(1001).setVisible(false);
  }

  /**
   * Show splash screen
   */
  protected showSplashScreen() {
    this.splashOverlay.setVisible(true);
    this.splashImage.setVisible(true);

    const overlayTexts = (this.splashImage as Phaser.GameObjects.Image & { overlayTexts?: Phaser.GameObjects.Text[] }).overlayTexts;
    if (overlayTexts) {
      overlayTexts.forEach((text) => text.setVisible(true));
    }

    this.gameStarted = false;
    this.isCountingDown = false;
  }

  /**
   * Hide splash and start countdown
   */
  protected hideSplashAndStartCountdown() {
    this.splashImage.setVisible(false);

    const overlayTexts = (this.splashImage as Phaser.GameObjects.Image & { overlayTexts?: Phaser.GameObjects.Text[] }).overlayTexts;
    if (overlayTexts) {
      overlayTexts.forEach((text) => text.setVisible(false));
    }

    this.startCountdown();
  }

  /**
   * Start 3-2-1 countdown (100% shared)
   */
  protected startCountdown() {
    this.isCountingDown = true;
    this.countdownText.setVisible(true);

    let count = 3;
    this.countdownText.setText(count.toString());

    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else {
          this.countdownText.setVisible(false);
          this.splashOverlay.setVisible(false);
          this.isCountingDown = false;
        }
      }
    });
  }

  /**
   * Update score display - emits event to React
   */
  protected updateScore() {
    gameEventBus.emitGameEvent('SCORE_UPDATE', { score: this.score });
  }

  /**
   * Update lives display - emits event to React
   */
  protected updateLives() {
    gameEventBus.emitGameEvent('LIVES_UPDATE', { lives: this.lives });
  }

  /**
   * Update week display - emits event to React
   */
  protected updateWeek() {
    gameEventBus.emitGameEvent('WEEK_UPDATE', { week: this.currentWeek });
  }

  /**
   * Win game - delegates to subclass for week transition logic
   */
  protected winGameBase() {
    if (this.currentWeek >= this.totalWeeks) {
      sound.yearCleared();
      this.gameOver = true;
      gameEventBus.emitGameEvent('GAME_OVER', { gameOver: true, finalScore: this.score });
      gameEventBus.emitGameEvent('WEEK_CLEARED', { week: this.currentWeek, score: this.score });
      this.showOverlay('Year Cleared! 🎉🎊', `You cleared all 52 weeks!\nFinal Score: ${this.score}\n\nClick to restart`);

      this.input.once('pointerdown', () => {
        this.scene.restart();
      });
    } else {
      sound.weekCleared();
      this.gameOver = true;
      gameEventBus.emitGameEvent('GAME_OVER', { gameOver: true });
      gameEventBus.emitGameEvent('WEEK_CLEARED', { week: this.currentWeek, score: this.score });
      this.showOverlay(`Week ${this.currentWeek} Cleared! 🎉`, `Great job! Moving to Week ${this.currentWeek + 1}...\nScore: ${this.score}\n\nClick to continue`);

      this.input.once('pointerdown', () => {
        this.handleNextWeek();
      });
    }
  }

  /**
   * Lose game
   */
  protected loseGameBase() {
    this.gameOver = true;
    gameEventBus.emitGameEvent('GAME_OVER', { gameOver: true, finalScore: this.score });
    this.showOverlay('Meeting Overload 😵', `You've been overwhelmed by meetings!\nFinal Score: ${this.score}\n\nClick to try again`);

    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }

  /**
   * Show overlay
   */
  protected showOverlay(title: string, message: string) {
    this.overlayBg.setVisible(true);
    this.overlayText.setText(title).setVisible(true);
    this.overlaySubtext.setText(message).setVisible(true);
  }

  /**
   * Hide overlay
   */
  protected hideOverlay() {
    this.overlayBg.setVisible(false);
    this.overlayText.setVisible(false);
    this.overlaySubtext.setVisible(false);
  }

  /**
   * Pause game
   */
  protected pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: true });

    if (this.pointerLocked) {
      document.exitPointerLock();
    }

    this.showOverlay('⏸️  PAUSED', 'Press ESC again to QUIT and restart\nClick anywhere to resume playing');

    this.input.once('pointerdown', () => {
      this.resumeGame();
    });
  }

  /**
   * Resume game
   */
  protected resumeGame() {
    this.isPaused = false;
    this.escapePressed = false;
    this.physics.resume();
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: false });
    this.hideOverlay();
  }

  /**
   * Quit game
   */
  protected quitGame() {
    this.hideOverlay();
    this.showOverlay('🚪 QUITTING...', 'Restarting game');

    this.time.delayedCall(500, () => {
      this.scene.restart();
    });
  }
}