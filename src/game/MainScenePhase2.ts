/**
 * Main Game Scene - Phase 2
 * Enhanced with level curve, power-ups, and weekend routing
 */

import Phaser from 'phaser';
import { getCalendarGridConfig, getBoardDimensions } from './calendarGenerator';
import { applyMeetingEffect, type MeetingType } from './physicsModifiers';
import { BallPool } from './BallPool';
import { clampVelocity, calculatePaddleBounceAngle, PHYSICS } from './constants';
import { sound } from './soundEffects';
import type { LevelTuning } from './levelCurve';
import { startWeek } from './phase2Router';
import { POWERUPS, POWERUP_CONFIG, getRandomPowerUp, type PowerUpKind } from './powerups';
import { generateWeek, computeColumns, type Meeting } from './calendarGeneratorPhase2';

export class MainScenePhase2 extends Phaser.Scene {
  // Game objects
  private paddle!: Phaser.Physics.Arcade.Sprite;
  private ballPool!: BallPool;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private blockDataMap: Map<string, Meeting> = new Map();
  private blockHitPoints: Map<string, number> = new Map();
  
  // Ball stuck detection
  private ballPositionHistory: Map<any, Array<{x: number, y: number, time: number}>> = new Map();
  private ballCorrectionCooldown: Map<any, number> = new Map();
  private stuckCheckCounter: number = 0;
  
  // Game state
  private score: number = 0;
  private lives: number = 3;
  private currentWeek: number = 1;
  private totalWeeks: number = 52;
  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private escapePressed: boolean = false;
  private pointerLocked: boolean = false;
  
  // Phase 2: Level tuning
  private tuning!: LevelTuning;
  
  // Phase 2: Power-ups
  private powerUpSpawned: boolean = false;
  private shieldActive: boolean = false;
  private powerUpIcon?: Phaser.GameObjects.Container;
  
  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private weekText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayText!: Phaser.GameObjects.Text;
  private overlaySubtext!: Phaser.GameObjects.Text;
  private powerUpStatusText?: Phaser.GameObjects.Text;
  
  // Splash screen elements
  private splashImage!: Phaser.GameObjects.Image;
  private splashOverlay!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  private isCountingDown: boolean = false;

  constructor() {
    super({ key: 'CalendarScenePhase2' });
    console.log('🎯 MainScenePhase2 constructor called');
  }

  init(data: {
    week?: number,
    tuning?: LevelTuning,
    score?: number,
    lives?: number,
    fromWeekendBonus?: boolean
  }) {
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
    
    // IMPORTANT: Use curve() to get proper tuning if not provided
    if (data.tuning) {
      this.tuning = data.tuning;
      console.log(`✅ Using provided tuning for week ${this.currentWeek}`);
    } else {
      // This shouldn't happen, but fallback to gentle defaults
      console.warn(`⚠️ No tuning provided! Using fallback for week ${this.currentWeek}`);
      this.tuning = {
        week: this.currentWeek,
        density: 0.35,
        bossRate: 0.04,
        teamRate: 0.10,
        lunchRate: 0.20,
        minBlockMins: 45,
        ballMaxCount: 2,
        paddleScale: 1.2,
        baseSpeed: 220
      };
    }
    
    this.powerUpSpawned = false;
    this.shieldActive = false;
    
    console.log(`📈 Week ${this.currentWeek} Tuning Applied:`, this.tuning);
    console.log(`📊 Expected: ${Math.round(this.tuning.density * 100)}% density, ${this.tuning.ballMaxCount} max balls, ${this.tuning.baseSpeed} px/s speed`);
  }

  preload() {
    // Load splash screen image
    this.load.on('loaderror', (file: any) => {
      console.log('Splash image not found, will use fallback', file.src);
    });
    this.load.image('splash', import.meta.env.BASE_URL + 'splash.jpg');
  }

  create() {
    // Reset game state
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

    // Create blocks (Phase 2: with tuning applied)
    this.createBlocks();

    // Create paddle (Phase 2: with scale applied)
    this.createPaddle();

    // Create initial ball
    this.createBall();

    // Setup input
    this.setupInput();

    // Create UI
    this.createUI();
    
    // Update week display (important for URL params and scene restarts)
    this.updateWeek();

    // Setup collisions
    this.setupCollisions();
    
    // Create splash screen
    this.createSplashScreen();
    this.showSplashScreen();
    
    // Phase 2: Schedule power-up spawn
    this.schedulePowerUpSpawn();
  }

  update() {
    const paddleBody = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (paddleBody) {
      paddleBody.setVelocity(0, 0);
    }

    if (this.splashImage.visible && this.input.activePointer.isDown) {
      this.hideSplashAndStartCountdown();
      return;
    }

    if (!this.gameStarted && !this.isPaused && !this.isCountingDown && this.input.activePointer.isDown) {
      this.gameOver = false;
      this.startGame();
    }

    if (this.gameOver || this.isPaused || this.isCountingDown) return;

    if (this.blocks.getLength() === 0 && this.gameStarted && !this.gameOver) {
      this.winGame();
    }

    // Ball stuck detection
    this.stuckCheckCounter++;
    if (this.gameStarted && this.stuckCheckCounter >= 10) {
      this.stuckCheckCounter = 0;
      const currentTime = this.time.now;
      
      this.ballPool.getGroup().children.iterate((ball: any) => {
        if (ball.active && ball.body) {
          const body = ball.body as Phaser.Physics.Arcade.Body;
          const absVelocityY = Math.abs(body.velocity.y);
          
          const lastCorrection = this.ballCorrectionCooldown.get(ball) || 0;
          if (currentTime - lastCorrection < 1000) {
            return true;
          }
          
          if (!this.ballPositionHistory.has(ball)) {
            this.ballPositionHistory.set(ball, []);
          }
          const history = this.ballPositionHistory.get(ball)!;
          history.push({ x: ball.x, y: ball.y, time: currentTime });
          
          if (history.length > 90) {
            history.shift();
          }
          
          let needsCorrection = false;
          
          if (absVelocityY < 60) {
            needsCorrection = true;
          }
          
          if (history.length >= 60) {
            const recent = history.slice(-60);
            const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
            const yVariance = recent.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / recent.length;
            
            if (yVariance < 300) {
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

    this.ballPool.killIfOffscreen();

    if (this.ballPool.getActiveBallCount() === 0 && this.gameStarted && !this.gameOver) {
      this.loseLife();
    }

    if (!this.gameStarted) {
      const firstBall = this.ballPool.getGroup().getFirstAlive();
      if (firstBall) {
        firstBall.x = this.paddle.x;
        firstBall.y = this.paddle.y - 30;
      }
    }
  }

  private drawCalendarGrid() {
    const config = getCalendarGridConfig();
    const graphics = this.add.graphics();

    config.days.forEach((day, index) => {
      const x = config.padding + index * (config.columnWidth + config.columnGap) + config.columnWidth / 2;
      this.add.text(x, 25, day.substring(0, 3).toUpperCase(), {
        fontFamily: 'Segoe UI, Inter, sans-serif',
        fontSize: '12px',
        color: '#605e5c',
        fontStyle: '600',
      }).setOrigin(0.5);
    });

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

  private createBlocks() {
    this.blocks = this.physics.add.staticGroup();
    
    // Phase 2: Generate deterministic calendar for this week
    const meetings = generateWeek(this.currentWeek);
    const renderItems = computeColumns(meetings);
    
    const config = getCalendarGridConfig();
    const START_HOUR = 9;
    const END_HOUR = 17;
    const DAY_MINS = (END_HOUR - START_HOUR) * 60;
    
    // Helper to get color for meeting type
    const getColorForType = (type: MeetingType): number => {
      switch (type) {
        case 'boss': return 0xe53935;
        case 'team': return 0x4caf50;
        case '1:1': return 0x5c6bc0;
        case 'lunch': return 0xfbc02d;
        case 'personal': return 0x8e24aa;
        default: return 0x5c6bc0;
      }
    };
    
    renderItems.forEach((item, index) => {
      const blockId = `meeting-${this.currentWeek}-${index}`;
      
      // Calculate positions using double-booking columns
      const dayX = config.padding + item.day * (config.columnWidth + config.columnGap);
      const yPerMin = config.gridHeight / DAY_MINS;
      
      const bandTop = config.headerHeight + item.startMin * yPerMin;
      const bandBot = config.headerHeight + item.endMin * yPerMin;
      
      // Apply column layout for double-booking
      const fullW = config.columnWidth - 6; // margin
      const w = (fullW / item.cols) - 4;    // 4px gutter between columns
      const x = dayX + (fullW / item.cols) * item.col + w / 2 + 4;
      const y = (bandTop + bandBot) / 2;
      const h = Math.max(20, bandBot - bandTop - 4);
      
      const color = getColorForType(item.type);
      
      // Create main block rectangle
      const blockRect = this.add.rectangle(x, y, w, h, color, 0.85);
      blockRect.setStrokeStyle(1, 0xffffff, 0.2);
      this.blocks.add(blockRect);
      
      const block = blockRect as any;
      block.setData('meetingType', item.type);
      block.setData('blockId', blockId);
      
      // Create left accent bar (Outlook signature)
      const accentBar = this.add.rectangle(x - w / 2 + 2, y, 3, h, color, 1.0);
      accentBar.setData('blockId', blockId);
      accentBar.setDepth(2);
      
      // Initialize hit points (onboarding blocks = 1 hit)
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
      
      // Store meeting data
      this.blockDataMap.set(blockId, item);
    });
    
    console.log(`✨ Phase 2: Generated ${meetings.length} meetings for week ${this.currentWeek}`);
    console.log(`📊 Render stats: ${renderItems.length} blocks (including ${renderItems.filter(r => r.cols > 1).length} in double-bookings)`);
    console.log(`🎨 Meeting types: Boss=${meetings.filter(m => m.type === 'boss').length}, Team=${meetings.filter(m => m.type === 'team').length}, Lunch=${meetings.filter(m => m.type === 'lunch').length}`);
  }

  private getHitPointsForMeeting(type: MeetingType): number {
    switch (type) {
      case 'boss': return 3;
      case 'team': return 2;
      case '1:1': return 2;
      case 'lunch': return 1;
      case 'personal': return 1;
      default: return 2;
    }
  }

  private createPaddle() {
    const { width, height } = getBoardDimensions();
    
    const paddleWidth = 120 * this.tuning.paddleScale;
    const paddleGraphics = this.add.rectangle(width / 2, height - 50, paddleWidth, 18, 0x0078d4, 1);
    paddleGraphics.setStrokeStyle(1, 0x106ebe, 1);
    
    this.physics.add.existing(paddleGraphics);
    this.paddle = paddleGraphics as any;
    
    const body = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.immovable = true;
      body.setSize(paddleWidth, 18);
    }
    
    this.paddle.setDepth(10);
    console.log(`🎯 Phase 2 Paddle scale: ${this.tuning.paddleScale}×`);
  }

  private createBall() {
    const { width, height } = getBoardDimensions();
    this.ballPool.spawn(width / 2, height - 80, 0, 0);
  }

  public createExtraBall(x: number, y: number, velocityX: number, velocityY: number) {
    // Phase 2: Use tuned ball max count
    if (this.ballPool.getActiveBallCount() >= this.tuning.ballMaxCount) {
      console.log(`Max balls reached (${this.tuning.ballMaxCount}), skipping`);
      return;
    }
    
    this.ballPool.spawn(x, y, velocityX, velocityY);
  }

  private setupInput() {
    const { width } = getBoardDimensions();
    
    // Hide cursor and show instruction
    this.input.setDefaultCursor('default');
    
    // Pointer lock on FIRST click (no second click needed)
    this.input.once('pointerdown', () => {
      const canvas = this.game.canvas;
      if (canvas && !this.pointerLocked) {
        canvas.requestPointerLock();
        this.input.setDefaultCursor('none');
      }
    });
    
    // Listen for pointer lock changes
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.game.canvas;
      if (!this.pointerLocked) {
        this.input.setDefaultCursor('default');
      }
    });
    
    // Move paddle with pointer movement
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.gameOver || this.isPaused || this.isCountingDown || this.splashImage.visible) return;
      
      if (this.pointerLocked) {
        // Use relative movement when locked (better control)
        const movementX = pointer.movementX || 0;
        this.paddle.x = Phaser.Math.Clamp(
          this.paddle.x + movementX * 1.5,
          60, 
          width - 60
        );
      } else {
        // Fallback to absolute positioning for touch/non-locked
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 60, width - 60);
      }
    });

    // ESC key handler
    this.input.keyboard?.on('keydown-ESC', () => {
      // Release pointer lock
      if (this.pointerLocked) {
        document.exitPointerLock();
      }
      
      if (this.gameOver) return;

      if (!this.isPaused && !this.escapePressed) {
        this.pauseGame();
        this.escapePressed = true;
      } else if (this.isPaused && this.escapePressed) {
        this.quitGame();
      }
    });
    
    // DEV: Cheat codes for QA testing
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      // Ctrl+Shift+ArrowUp: Next week
      if (event.ctrlKey && event.shiftKey && event.code === 'ArrowUp') {
        event.preventDefault();
        const nextWeek = Math.min(52, this.currentWeek + 1);
        this.showDevToast(`DEV: Jumping to Week ${nextWeek}`);
        this.scene.restart({ 
          week: nextWeek, 
          score: this.score, 
          lives: this.lives 
        });
      }
      
      // Ctrl+Shift+ArrowDown: Previous week
      if (event.ctrlKey && event.shiftKey && event.code === 'ArrowDown') {
        event.preventDefault();
        const prevWeek = Math.max(1, this.currentWeek - 1);
        this.showDevToast(`DEV: Jumping to Week ${prevWeek}`);
        this.scene.restart({ 
          week: prevWeek, 
          score: this.score, 
          lives: this.lives 
        });
      }
      
      // Ctrl+Shift+L: Add extra life (dev)
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyL') {
        event.preventDefault();
        this.lives++;
        this.updateLives();
        this.showDevToast(`DEV: +1 Life (${this.lives} total)`);
      }
      
      // Ctrl+Shift+B: Spawn ball (dev)
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
   * Show dev toast notification (for cheat codes)
   */
  private showDevToast(message: string) {
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

  private setupCollisions() {
    this.physics.world.setBoundsCollision(true, true, true, false);
    
    this.physics.add.collider(
      this.ballPool.getGroup(),
      this.paddle,
      this.ballHitPaddle,
      undefined,
      this
    );
    
    this.physics.add.collider(
      this.ballPool.getGroup(),
      this.blocks,
      this.ballHitBlock,
      undefined,
      this
    );
    
    // Phase 2: Power-up collision (if exists)
    if (this.powerUpIcon) {
      this.physics.add.overlap(
        this.ballPool.getGroup(),
        this.powerUpIcon,
        this.collectPowerUp,
        undefined,
        this
      );
    }
  }

  private ballHitPaddle(ball: any, paddle: any) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    sound.paddleHit();
    
    const angle = calculatePaddleBounceAngle(ball.x, paddle.x, PHYSICS.PADDLE_WIDTH * this.tuning.paddleScale);
    const currentSpeed = ballBody.velocity.length();
    const speed = Phaser.Math.Clamp(currentSpeed, PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
    
    ballBody.setVelocity(
      Math.sin(angle) * speed,
      -Math.abs(Math.cos(angle)) * speed
    );
    
    const velocity = new Phaser.Math.Vector2(ballBody.velocity.x, ballBody.velocity.y);
    const clampedVelocity = clampVelocity(velocity);
    ballBody.setVelocity(clampedVelocity.x, clampedVelocity.y);
  }

  private ballHitBlock(ball: any, block: any) {
    const meetingType = block.getData('meetingType') as MeetingType;
    const blockId = block.getData('blockId') as string;

    const currentHP = this.blockHitPoints.get(blockId) || 1;
    const newHP = currentHP - 1;
    
    if (newHP <= 0) {
      sound.blockDestroyed();
      block.destroy();
      
      this.children.getChildren().forEach((child) => {
        if (child.getData('blockId') === blockId) {
          child.destroy();
        }
      });
      
      this.blockHitPoints.delete(blockId);
      this.score += currentHP * 10;
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
      
      this.score += 5;
      this.updateScore();
    }

    applyMeetingEffect(meetingType, ball, this);
  }

  private startGame() {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    this.instructionText.setVisible(false);

    const firstBall = this.ballPool.getGroup().getFirstAlive();
    if (firstBall && firstBall.body) {
      const angle = Phaser.Math.Between(-45, 45) * Math.PI / 180;
      // Phase 2: Use tuned base speed
      const speed = this.tuning.baseSpeed;
      (firstBall.body as Phaser.Physics.Arcade.Body).setVelocity(
        Math.sin(angle) * speed,
        -Math.abs(Math.cos(angle)) * speed
      );
      console.log(`⚡ Phase 2 Ball speed: ${speed} px/s`);
    }
  }

  private loseLife() {
    // Phase 2: Check shield
    if (this.shieldActive) {
      this.shieldActive = false;
      sound.paddleHit();
      this.showShieldUsed();
      return;
    }
    
    this.lives--;
    this.updateLives();
    sound.lifeLost();

    if (this.lives <= 0) {
      this.loseGame();
    } else {
      this.gameStarted = false;
      this.createBall();
      this.instructionText.setVisible(true);
      this.instructionText.setText('Click to launch ball');
    }
  }

  private createUI() {
    const { width } = getBoardDimensions();

    this.scoreText = this.add.text(width - 20, 10, `Score: ${this.score}`, {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '14px',
      color: '#323130',
      fontStyle: '600',
    }).setOrigin(1, 0);

    this.livesText = this.add.text(width - 20, 32, `Lives: ${this.lives}`, {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '14px',
      color: '#323130',
      fontStyle: '600',
    }).setOrigin(1, 0);

    // Week counter text (store as class property for updates)
    this.weekText = this.add.text(20, 10, `Week: ${this.currentWeek} / ${this.totalWeeks}`, {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '14px',
      color: '#0078d4',
      fontStyle: '600',
    }).setOrigin(0, 0);

    this.instructionText = this.add.text(width / 2, 280, 'Move paddle to clear your meetings\nClick to start', {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '16px',
      color: '#605e5c',
      align: 'center',
      fontStyle: '400',
    }).setOrigin(0.5);

    this.overlayBg = this.add.rectangle(width / 2, 320, width, 640, 0x000000, 0.7).setVisible(false);
    
    this.overlayText = this.add.text(width / 2, 280, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);

    this.overlaySubtext = this.add.text(width / 2, 340, '', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#e0e0e0',
      align: 'center',
    }).setOrigin(0.5).setVisible(false);
    
    // Phase 2: Power-up status text
    this.powerUpStatusText = this.add.text(width / 2, 54, '', {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '12px',
      color: '#FFD700',
      backgroundColor: '#8B4513',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setVisible(false);
  }

  private createSplashScreen() {
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
      
      const subtitleText = this.add.text(width / 2, 200, 'DESTROY YOUR MEETINGS! (Phase 2)', {
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
      
      (this.splashImage as any).overlayTexts = [titleText, subtitleText, instructText];
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

  private showSplashScreen() {
    this.splashOverlay.setVisible(true);
    this.splashImage.setVisible(true);
    
    const overlayTexts = (this.splashImage as any).overlayTexts;
    if (overlayTexts) {
      overlayTexts.forEach((text: any) => text.setVisible(true));
    }
    
    this.instructionText.setVisible(false);
    this.gameStarted = false;
    this.isCountingDown = false;
  }

  private hideSplashAndStartCountdown() {
    this.splashImage.setVisible(false);
    
    const overlayTexts = (this.splashImage as any).overlayTexts;
    if (overlayTexts) {
      overlayTexts.forEach((text: any) => text.setVisible(false));
    }
    
    this.startCountdown();
  }

  private startCountdown() {
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
          this.instructionText.setVisible(true);
          this.instructionText.setText(`Week ${this.currentWeek} - Click to launch!`);
        }
      }
    });
  }

  private updateScore() {
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private updateLives() {
    this.livesText.setText(`Lives: ${this.lives}`);
  }

  private updateWeek() {
    if (this.weekText) {
      this.weekText.setText(`Week: ${this.currentWeek} / ${this.totalWeeks}`);
      console.log(`📅 Week UI updated: ${this.currentWeek} / ${this.totalWeeks}`);
    } else {
      console.error('❌ weekText not found!');
    }
  }

  private winGame() {
    if (this.currentWeek >= this.totalWeeks) {
      sound.yearCleared();
      this.gameOver = true;
      this.showOverlay('Year Cleared! 🎉🎊', `You cleared all 52 weeks!\nFinal Score: ${this.score}\n\nClick to restart from Week 1`);
      
      this.input.once('pointerdown', () => {
        // Always restart at week 1 (no progress saving)
        this.scene.restart({
          week: 1,
          score: 0,
          lives: 3
        });
      });
    } else {
      sound.weekCleared();
      this.gameOver = true;
      this.showOverlay(`Week ${this.currentWeek} Cleared! 🎉`, `Great job! Moving to Week ${this.currentWeek + 1}...\nScore: ${this.score}\n\nClick to continue`);
      
      this.input.once('pointerdown', () => {
        this.nextWeek();
      });
    }
  }

  private nextWeek() {
    this.currentWeek++;
    this.gameStarted = false;
    this.gameOver = false;
    
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
      lives: this.lives
    });
  }

  private hideOverlay() {
    this.overlayBg.setVisible(false);
    this.overlayText.setVisible(false);
    this.overlaySubtext.setVisible(false);
  }

  private loseGame() {
    this.gameOver = true;
    this.showOverlay('Meeting Overload 😵', `You've been overwhelmed by meetings!\nFinal Score: ${this.score}\n\nClick to restart from Week 1`);
    
    this.input.once('pointerdown', () => {
      // Always restart at week 1 (no progress saving)
      this.scene.restart({
        week: 1,
        score: 0,
        lives: 3
      });
    });
  }

  private showOverlay(title: string, message: string) {
    this.overlayBg.setVisible(true);
    this.overlayText.setText(title).setVisible(true);
    this.overlaySubtext.setText(message).setVisible(true);
  }

  private pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    
    if (this.pointerLocked) {
      document.exitPointerLock();
    }
    
    this.showOverlay('⏸️  PAUSED', 'Press ESC again to QUIT and restart\nClick anywhere to resume playing');
    
    this.input.once('pointerdown', () => {
      this.resumeGame();
    });
  }

  private resumeGame() {
    this.isPaused = false;
    this.escapePressed = false;
    this.physics.resume();
    this.hideOverlay();
  }

  private quitGame() {
    this.hideOverlay();
    this.showOverlay('🚪 QUITTING...', 'Restarting from Week 1');
    
    this.time.delayedCall(500, () => {
      // Always restart at week 1 (no progress saving)
      this.scene.restart({
        week: 1,
        score: 0,
        lives: 3
      });
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
    
    const validBlocks = this.blocks.getChildren().filter((b: any) => {
      const type = this.blockDataMap.get(b.getData('blockId'))?.type;
      return POWERUP_CONFIG.AVOID_BOSS_BLOCKS ? type !== 'boss' : true;
    });
    
    if (validBlocks.length === 0) return;
    
    const block = Phaser.Math.RND.pick(validBlocks) as any;
    const powerUp = getRandomPowerUp();
    
    // Create simple icon (will improve with graphics later)
    const icon = this.add.text(block.x, block.y - 30, powerUp.label.split(' ')[0], {
      fontSize: '24px',
      color: '#FFD700',
      backgroundColor: '#000000',
      padding: { x: 6, y: 6 }
    }).setOrigin(0.5);
    
    icon.setData('powerUpType', powerUp.id);
    
    this.powerUpIcon = this.add.container(block.x, block.y - 30, [icon]);
    this.physics.add.existing(this.powerUpIcon);
    (this.powerUpIcon.body as Phaser.Physics.Arcade.Body).setCircle(20);
    
    this.powerUpSpawned = true;
    console.log(`⚡ Power-up spawned: ${powerUp.label}`);
  }

  private collectPowerUp(_ball: any, powerUpContainer: any) {
    if (!this.powerUpIcon) return;
    
    const powerUpType = powerUpContainer.list[0].getData('powerUpType') as PowerUpKind;
    const powerUp = POWERUPS[powerUpType];
    
    console.log(`✨ Collected power-up: ${powerUp.label}`);
    
    // Apply effect
    powerUp.apply(this);
    
    // Destroy icon
    this.powerUpIcon.destroy();
    this.powerUpIcon = undefined;
  }

  // Power-up effects
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

  public grantShield() {
    this.shieldActive = true;
    this.showPowerUpStatus('🛡️ Shield Active');
  }

  public clearCurrentHourRow() {
    const firstBall = this.ballPool.getGroup().getFirstAlive();
    if (!firstBall) return;
    
    const ballY = firstBall.y;
    const blocksToDestroy: any[] = [];
    
    this.blocks.getChildren().forEach((block: any) => {
      if (Math.abs(block.y - ballY) < 70) {
        blocksToDestroy.push(block);
      }
    });
    
    blocksToDestroy.forEach(block => {
      const blockId = block.getData('blockId');
      const currentHP = this.blockHitPoints.get(blockId) || 1;
      
      block.destroy();
      this.children.getChildren().forEach((child) => {
        if (child.getData('blockId') === blockId) {
          child.destroy();
        }
      });
      
      this.blockHitPoints.delete(blockId);
      this.score += currentHP * 10;
    });
    
    this.updateScore();
    sound.blockDestroyed();
    console.log(`📅 Cleared ${blocksToDestroy.length} meetings from hour row`);
  }

  public convertRandomBlocks(count: number) {
    const blocks = Phaser.Math.RND.shuffle(this.blocks.getChildren())
      .slice(0, count);
    
    blocks.forEach((block: any) => {
      const blockId = block.getData('blockId');
      this.blockHitPoints.set(blockId, 1);
      block.setFillStyle(0xfbc02d, 0.85); // Yellow for lunch
    });
    
    console.log(`🧹 Converted ${blocks.length} meetings to lunch breaks`);
  }

  private showPowerUpStatus(text: string) {
    if (this.powerUpStatusText) {
      this.powerUpStatusText.setText(text).setVisible(true);
    }
  }

  private hidePowerUpStatus() {
    if (this.powerUpStatusText) {
      this.powerUpStatusText.setVisible(false);
    }
  }

  private showShieldUsed() {
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
}

export default MainScenePhase2;
