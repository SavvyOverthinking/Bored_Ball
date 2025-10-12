/**
 * Main Game Scene - Calendar Breakout
 * Core game loop, physics, collision detection, and rendering
 */

import Phaser from 'phaser';
import { generateCalendarBlocks, getCalendarGridConfig, getBoardDimensions, type BlockData } from './calendarGenerator';
import { applyMeetingEffect, type MeetingType } from './physicsModifiers';
import { BallPool } from './BallPool';
import { calculatePaddleBounceAngle, PHYSICS } from './constants';
import { sound } from './soundEffects';
import calendarData from '../data/mockCalendar.json';

export class MainScene extends Phaser.Scene {
  // Game objects
  private paddle!: Phaser.Physics.Arcade.Sprite;
  private ballPool!: BallPool;
  private blocks!: Phaser.Physics.Arcade.StaticGroup;
  private blockDataMap: Map<string, BlockData> = new Map();
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
  
  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private weekText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayText!: Phaser.GameObjects.Text;
  private overlaySubtext!: Phaser.GameObjects.Text;
  
  // Splash screen elements
  private splashImage!: Phaser.GameObjects.Image;
  private splashOverlay!: Phaser.GameObjects.Rectangle;
  private countdownText!: Phaser.GameObjects.Text;
  private isCountingDown: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Load splash screen image (optional - will use fallback if missing)
    this.load.on('loaderror', (file: any) => {
      console.log('Splash image not found, will use fallback', file.src);
    });
    // Use relative path that works with Vite's base path
    this.load.image('splash', import.meta.env.BASE_URL + 'splash.jpg');
  }

  create() {
    // Reset all game state explicitly on scene restart
    this.gameStarted = false;
    this.gameOver = false;
    this.isPaused = false;
    this.escapePressed = false;
    this.isCountingDown = false;
    this.stuckCheckCounter = 0;
    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();
    this.score = 0;
    this.lives = 3;
    this.currentWeek = 1;
    
    const { width, height } = getBoardDimensions();

    // Set background (lighter, more Outlook-like)
    this.add.rectangle(width / 2, height / 2, width, height, 0xfafbfc);

    // Load saved progress (will overwrite week/score if exists)
    this.loadProgress();

    // Initialize ball pool
    this.ballPool = new BallPool(this);

    // Draw calendar grid
    this.drawCalendarGrid();

    // Create blocks from meeting data
    this.createBlocks();

    // Create paddle
    this.createPaddle();

    // Create initial ball
    this.createBall();

    // Setup input
    this.setupInput();

    // Create UI
    this.createUI();

    // Setup collisions
    this.setupCollisions();
    
    // Create splash screen and countdown (hidden initially)
    this.createSplashScreen();
    
    // Show splash screen on first load
    this.showSplashScreen();
  }

  update() {
    // Keep paddle velocity at zero (prevent drift)
    const paddleBody = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (paddleBody) {
      paddleBody.setVelocity(0, 0);
    }

    // Paddle movement is now handled in setupInput via pointermove event
    // This allows for proper pointer lock support

    // Handle splash screen click (start countdown)
    if (this.splashImage.visible && this.input.activePointer.isDown) {
      this.hideSplashAndStartCountdown();
      return;
    }

    // Start game on click if not started (allow even when gameOver for initial start)
    if (!this.gameStarted && !this.isPaused && !this.isCountingDown && this.input.activePointer.isDown) {
      this.gameOver = false; // Ensure gameOver is false when starting
      this.startGame();
    }

    // Early return for paused/gameOver/countdown states AFTER handling initial click
    if (this.gameOver || this.isPaused || this.isCountingDown) return;

    // Manual paddle collision check for English physics
    if (this.gameStarted && !this.gameOver && !this.isPaused) {
      this.ballPool.getGroup().getChildren().forEach((ball: any) => {
        const ballBody = ball.body as Phaser.Physics.Arcade.Body;
        // Only check if ball is moving downward
        if (ballBody && ballBody.velocity.y > 0) {
          if (this.physics.overlap(ball, this.paddle)) {
            this.ballHitPaddle(ball, this.paddle);
          }
        }
      });
    }

    // Check if all blocks destroyed
    if (this.blocks.getLength() === 0 && this.gameStarted && !this.gameOver) {
      this.winGame();
    }

    // Prevent balls from getting stuck (check every 10 frames to reduce wobble)
    this.stuckCheckCounter++;
    if (this.gameStarted && this.stuckCheckCounter >= 10) {
      this.stuckCheckCounter = 0;
      const currentTime = this.time.now;
      
      this.ballPool.getGroup().children.iterate((ball: any) => {
        if (ball.active && ball.body) {
          const body = ball.body as Phaser.Physics.Arcade.Body;
          const absVelocityY = Math.abs(body.velocity.y);
          
          // Check cooldown - don't correct too frequently
          const lastCorrection = this.ballCorrectionCooldown.get(ball) || 0;
          if (currentTime - lastCorrection < 1000) { // 1 second cooldown
            return true;
          }
          
          // Track ball position history
          if (!this.ballPositionHistory.has(ball)) {
            this.ballPositionHistory.set(ball, []);
          }
          const history = this.ballPositionHistory.get(ball)!;
          history.push({ x: ball.x, y: ball.y, time: currentTime });
          
          // Keep only last 90 frames (1.5 seconds at 60fps)
          if (history.length > 90) {
            history.shift();
          }
          
          let needsCorrection = false;
          
          // Check 1: Ball moving too horizontally (very low Y velocity)
          if (absVelocityY < 60) {
            needsCorrection = true;
          }
          
          // Check 2: Ball stuck in small area (repetitive pattern)
          if (history.length >= 60) {
            const recent = history.slice(-60);
            const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
            const yVariance = recent.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / recent.length;
            
            // If ball has been in roughly the same Y position for 60 frames (stuck pattern)
            if (yVariance < 300) {
              needsCorrection = true;
            }
          }
          
          // Apply correction smoothly
          if (needsCorrection) {
            const speed = Phaser.Math.Clamp(body.velocity.length(), PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
            
            // Force a more vertical angle (40-70 degrees from horizontal)
            const randomAngle = Phaser.Math.Between(40, 70) * Math.PI / 180;
            const direction = body.velocity.y > 0 ? 1 : -1;
            
            body.setVelocity(
              Math.cos(randomAngle) * speed * (body.velocity.x > 0 ? 1 : -1),
              Math.sin(randomAngle) * speed * direction
            );
            
            // Clear history and set cooldown
            this.ballPositionHistory.set(ball, []);
            this.ballCorrectionCooldown.set(ball, currentTime);
          }
        }
        return true;
      });
    }

    // Clean up balls that fell off screen
    this.ballPool.killIfOffscreen();

    // Check if all balls are out of bounds
    if (this.ballPool.getActiveBallCount() === 0 && this.gameStarted && !this.gameOver) {
      this.loseLife();
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
   * Draw calendar grid background
   */
  private drawCalendarGrid() {
    const config = getCalendarGridConfig();
    const graphics = this.add.graphics();

    // Draw day labels (Outlook style)
    config.days.forEach((day, index) => {
      const x = config.padding + index * (config.columnWidth + config.columnGap) + config.columnWidth / 2;
      this.add.text(x, 25, day.substring(0, 3).toUpperCase(), {
        fontFamily: 'Segoe UI, Inter, sans-serif',
        fontSize: '12px',
        color: '#605e5c',
        fontStyle: '600',
      }).setOrigin(0.5);
    });

    // Draw time labels (Outlook style with AM/PM)
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

    // Draw very subtle grid lines (Outlook style)
    graphics.lineStyle(1, 0xedebe9, 1);
    
    // Horizontal lines (every hour)
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
   * Create meeting blocks
   */
  private createBlocks() {
    this.blocks = this.physics.add.staticGroup();
    const blockDataList = generateCalendarBlocks(calendarData.meetings as any);

    blockDataList.forEach((blockData) => {
      // Create main block rectangle (Outlook style with transparency)
      const color = parseInt(blockData.color.replace('#', '0x'));
      const blockRect = this.add.rectangle(
        blockData.x,
        blockData.y,
        blockData.width - 4,
        blockData.height,
        color,
        0.85
      );
      
      // Add subtle border
      blockRect.setStrokeStyle(1, 0xffffff, 0.2);
      
      // Add to physics group
      this.blocks.add(blockRect);
      
      const block = blockRect as any;
      block.setData('meetingType', blockData.type);
      block.setData('blockId', blockData.id);
      
      // Create left accent bar (Outlook signature)
      const accentBar = this.add.rectangle(
        blockData.x - blockData.width / 2 + 4,
        blockData.y,
        4,
        blockData.height,
        color,
        1.0
      );
      accentBar.setData('blockId', blockData.id);
      accentBar.setDepth(2);
      
      // Initialize hit points based on meeting type
      const hitPoints = this.getHitPointsForMeeting(blockData.type);
      this.blockHitPoints.set(blockData.id, hitPoints);

      // Add title text (Outlook style - left aligned, white)
      const fontSize = blockData.height > 30 ? '10px' : '8px';
      const text = this.add.text(
        blockData.x - blockData.width / 2 + 10,
        blockData.y - blockData.height / 2 + 4,
        blockData.title, {
        fontFamily: 'Segoe UI, Inter, sans-serif',
        fontSize,
        color: '#ffffff',
        fontStyle: '600',
        align: 'left',
        wordWrap: { width: blockData.width - 16 },
      }).setOrigin(0, 0);
      
      text.setData('blockId', blockData.id);
      text.setDepth(5);

      this.blockDataMap.set(blockData.id, blockData);
    });
  }

  /**
   * Get hit points for meeting type
   */
  private getHitPointsForMeeting(type: MeetingType): number {
    switch (type) {
      case 'boss': return 3; // Boss meetings are harder
      case 'team': return 2; // Team meetings need 2 hits
      case '1:1': return 2; // 1:1s need 2 hits
      case 'lunch': return 1; // Lunch is easy
      case 'personal': return 1; // Personal is easy
      default: return 2;
    }
  }

  /**
   * Create paddle (Outlook blue accent)
   */
  private createPaddle() {
    const { width, height } = getBoardDimensions();
    
    // Create paddle with Outlook blue color
    const paddleGraphics = this.add.rectangle(width / 2, height - 50, 120, 18, 0x0078d4, 1);
    paddleGraphics.setStrokeStyle(1, 0x106ebe, 1);
    
    // Add physics to the rectangle
    this.physics.add.existing(paddleGraphics);
    this.paddle = paddleGraphics as any;
    
    const body = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.immovable = true;
      body.setSize(120, 18);
    }
    
    this.paddle.setDepth(10);
    console.log('Paddle created at:', this.paddle.x, this.paddle.y);
  }

  /**
   * Create ball
   */
  private createBall() {
    const { width, height } = getBoardDimensions();
    const ball = this.ballPool.spawn(width / 2, height - 80, 0, 0);
    
    console.log('Ball created at:', ball.x, ball.y, 'Visible:', ball.visible);
  }

  /**
   * Create extra ball (for split effect)
   */
  public createExtraBall(x: number, y: number, velocityX: number, velocityY: number) {
    // Limit to max 3 balls
    if (this.ballPool.getActiveBallCount() >= 3) {
      console.log('Max balls reached (3), skipping extra ball creation');
      return;
    }
    
    this.ballPool.spawn(x, y, velocityX, velocityY);
  }

  /**
   * Setup input handlers
   */
  private setupInput() {
    const { width } = getBoardDimensions();
    
    // Set up pointer lock on canvas click when game is active
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
        // Use relative movement when pointer is locked
        const movementX = pointer.movementX || 0;
        this.paddle.x = Phaser.Math.Clamp(
          this.paddle.x + movementX * 1.5, // Sensitivity multiplier
          50, 
          width - 50
        );
      } else {
        // Fallback to absolute positioning when not locked
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, width - 50);
      }
    });

    // ESC key handler: First press pauses, second press quits
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gameOver) return;

      if (!this.isPaused && !this.escapePressed) {
        // First ESC: Pause game
        this.pauseGame();
        this.escapePressed = true;
      } else if (this.isPaused && this.escapePressed) {
        // Second ESC: Quit to start
        this.quitGame();
      }
    });
  }

  /**
   * Setup collision handlers
   */
  private setupCollisions() {
    // Set up world bounds (open at bottom)
    this.physics.world.setBoundsCollision(true, true, true, false);
    
    // Manual paddle collision handled in update() for full control over English physics
    // (No automatic collision setup for paddle)
    
    this.physics.add.collider(
      this.ballPool.getGroup(),
      this.blocks,
      this.ballHitBlock,
      undefined,
      this
    );
  }

  /**
   * Ball hits paddle handler - called manually from update()
   */
  private ballHitPaddle(ball: any, paddle: any) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    
    // Play sound effect
    sound.paddleHit();
    
    // Calculate "English" - angle based on where ball hits paddle
    const angle = calculatePaddleBounceAngle(ball.x, paddle.x, PHYSICS.PADDLE_WIDTH);
    
    // Get relative hit position for debugging
    const relativePos = (ball.x - paddle.x) / (PHYSICS.PADDLE_WIDTH / 2);
    const hitZone = Math.abs(relativePos) < 0.14 ? 'CENTER' : 
                    Math.abs(relativePos) < 0.35 ? 'INNER' :
                    Math.abs(relativePos) < 0.65 ? 'MIDDLE' : 'OUTER';
    
    console.log(`🎯 Paddle hit: ${hitZone} zone, angle: ${Phaser.Math.RadToDeg(angle).toFixed(1)}°, pos: ${relativePos.toFixed(2)}`);
    
    // Get current speed and apply new angle
    const currentSpeed = ballBody.velocity.length();
    const speed = Phaser.Math.Clamp(currentSpeed, PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
    
    // Apply new velocity with English angle
    const newVelocityX = Math.sin(angle) * speed;
    const newVelocityY = -Math.abs(Math.cos(angle)) * speed; // Always bounce upward
    
    ballBody.setVelocity(newVelocityX, newVelocityY);
    
    // Move ball slightly above paddle to prevent tunneling
    ball.y = paddle.y - (paddle.height / 2) - (ball.height / 2) - 2;
    
    // Verify the angle was applied
    console.log(`   → Final velocity: (${newVelocityX.toFixed(1)}, ${newVelocityY.toFixed(1)})`);
  }

  /**
   * Ball hits block handler
   */
  private ballHitBlock(ball: any, block: any) {
    const meetingType = block.getData('meetingType') as MeetingType;
    const blockId = block.getData('blockId') as string;

    // Get current hit points
    const currentHP = this.blockHitPoints.get(blockId) || 1;
    const newHP = currentHP - 1;
    
    if (newHP <= 0) {
      // Block destroyed!
      sound.blockDestroyed();
      
      block.destroy();
      
      // Find and remove associated text and accent bar
      this.children.getChildren().forEach((child) => {
        if (child.getData('blockId') === blockId) {
          child.destroy();
        }
      });
      
      this.blockHitPoints.delete(blockId);
      
      // Update score (more points for harder blocks)
      this.score += currentHP * 10;
      this.updateScore();
    } else {
      // Block damaged - update hit points and show visual feedback
      sound.blockHit();
      
      this.blockHitPoints.set(blockId, newHP);
      
      // Flash the block to show damage
      this.tweens.add({
        targets: block,
        alpha: 0.5,
        duration: 100,
        yoyo: true,
        ease: 'Power1'
      });
      
      // Update score for hit
      this.score += 5;
      this.updateScore();
    }

    // Apply physics effect
    applyMeetingEffect(meetingType, ball, this);
  }

  /**
   * Start the game
   */
  private startGame() {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    this.instructionText.setVisible(false);

    // Launch first ball
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
   * Lose a life
   */
  private loseLife() {
    this.lives--;
    this.updateLives();
    
    sound.lifeLost();

    if (this.lives <= 0) {
      this.loseGame();
    } else {
      // Reset ball
      this.gameStarted = false;
      this.createBall();

      this.instructionText.setVisible(true);
      this.instructionText.setText('Click to launch ball');
    }
  }

  /**
   * Create UI elements
   */
  private createUI() {
    const { width } = getBoardDimensions();

    // Score (Outlook style)
    this.scoreText = this.add.text(width - 20, 10, 'Score: 0', {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '14px',
      color: '#323130',
      fontStyle: '600',
    }).setOrigin(1, 0);

    // Lives (Outlook style)
    this.livesText = this.add.text(width - 20, 32, 'Lives: 3', {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '14px',
      color: '#323130',
      fontStyle: '600',
    }).setOrigin(1, 0);

    // Week counter (Outlook style)
    this.weekText = this.add.text(20, 10, 'Week: 1 / 52', {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '14px',
      color: '#0078d4',
      fontStyle: '600',
    }).setOrigin(0, 0);

    // Instructions (Outlook style)
    this.instructionText = this.add.text(width / 2, 280, 'Move paddle to clear your meetings\nClick to start', {
      fontFamily: 'Segoe UI, Inter, sans-serif',
      fontSize: '16px',
      color: '#605e5c',
      align: 'center',
      fontStyle: '400',
    }).setOrigin(0.5);

    // Create overlay elements (hidden initially)
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
  }

  /**
   * Create splash screen and countdown text
   */
  private createSplashScreen() {
    const { width, height } = getBoardDimensions();
    
    // Create dim overlay (like pause overlay)
    this.splashOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    this.splashOverlay.setDepth(999); // Behind splash but on top of game
    this.splashOverlay.setVisible(false);
    
    // Try to create splash image, fallback to graphics if not loaded
    if (this.textures.exists('splash')) {
      this.splashImage = this.add.image(width / 2, height / 2, 'splash');
      
      // Scale to fit the game area while maintaining aspect ratio
      const scale = Math.min(width / this.splashImage.width, height / this.splashImage.height) * 0.95;
      this.splashImage.setScale(scale);
    } else {
      // Create fallback splash screen using graphics
      const graphics = this.add.graphics();
      
      // Background
      graphics.fillStyle(0x1a1a2e, 1);
      graphics.fillRect(0, 0, width, height);
      
      // Border
      graphics.lineStyle(8, 0xFF6600, 1);
      graphics.strokeRect(20, 20, width - 40, height - 40);
      
      // Title area
      graphics.fillStyle(0x16213E, 1);
      graphics.fillRoundedRect(width / 2 - 300, 80, 600, 120, 10);
      
      // Generate texture from graphics
      graphics.generateTexture('fallback_splash', width, height);
      graphics.destroy();
      
      this.splashImage = this.add.image(width / 2, height / 2, 'fallback_splash');
      
      // Add text overlay for fallback
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
      
      // Store references to hide them with splash
      (this.splashImage as any).overlayTexts = [titleText, subtitleText, instructText];
    }
    
    this.splashImage.setDepth(1000); // On top of everything
    this.splashImage.setVisible(false);
    this.splashImage.setInteractive({ useHandCursor: true });
    
    // Create countdown text (hidden initially)
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
  private showSplashScreen() {
    this.splashOverlay.setVisible(true); // Dim the background
    this.splashImage.setVisible(true);
    
    // Show overlay texts if using fallback splash
    const overlayTexts = (this.splashImage as any).overlayTexts;
    if (overlayTexts) {
      overlayTexts.forEach((text: any) => text.setVisible(true));
    }
    
    this.instructionText.setVisible(false);
    this.gameStarted = false;
    this.isCountingDown = false;
  }

  /**
   * Hide splash and start countdown
   */
  private hideSplashAndStartCountdown() {
    this.splashImage.setVisible(false);
    
    // Hide overlay texts if using fallback splash
    const overlayTexts = (this.splashImage as any).overlayTexts;
    if (overlayTexts) {
      overlayTexts.forEach((text: any) => text.setVisible(false));
    }
    
    // Keep overlay visible during countdown (dim background)
    this.startCountdown();
  }

  /**
   * Start 3-2-1 countdown
   */
  private startCountdown() {
    this.isCountingDown = true;
    this.countdownText.setVisible(true);
    
    let count = 3;
    this.countdownText.setText(count.toString());
    
    // Countdown timer
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          this.countdownText.setText(count.toString());
        } else {
          // Countdown finished - hide overlay and text
          this.countdownText.setVisible(false);
          this.splashOverlay.setVisible(false); // Remove dim overlay
          this.isCountingDown = false;
          this.instructionText.setVisible(true);
          this.instructionText.setText(`Week ${this.currentWeek} - Click to launch!`);
        }
      }
    });
  }

  /**
   * Update score display
   */
  private updateScore() {
    this.scoreText.setText(`Score: ${this.score}`);
  }

  /**
   * Update lives display
   */
  private updateLives() {
    this.livesText.setText(`Lives: ${this.lives}`);
  }

  /**
   * Update week display
   */
  private updateWeek() {
    this.weekText.setText(`Week: ${this.currentWeek} / ${this.totalWeeks}`);
  }

  /**
   * Win game (week cleared)
   */
  private winGame() {
    if (this.currentWeek >= this.totalWeeks) {
      // Won the entire year!
      sound.yearCleared();
      this.gameOver = true;
      this.showOverlay('Year Cleared! 🎉🎊', `You cleared all 52 weeks!\nFinal Score: ${this.score}\n\nClick to restart`);
      
      this.input.once('pointerdown', () => {
        this.scene.restart();
      });
    } else {
      // Move to next week
      sound.weekCleared();
      this.gameOver = true;
      this.showOverlay(`Week ${this.currentWeek} Cleared! 🎉`, `Great job! Moving to Week ${this.currentWeek + 1}...\nScore: ${this.score}\n\nClick to continue`);
      
      this.input.once('pointerdown', () => {
        this.nextWeek();
      });
    }
  }

  /**
   * Progress to next week
   */
  private nextWeek() {
    this.currentWeek++;
    this.gameStarted = false;
    this.gameOver = false;
    
    // Save progress
    this.saveProgress();
    
    // Clear all balls
    this.ballPool.getGroup().clear(true, true);
    this.ballPositionHistory.clear();
    this.ballCorrectionCooldown.clear();
    
    // Clear all blocks
    this.blocks.clear(true, true);
    this.blockDataMap.clear();
    this.blockHitPoints.clear();
    
    // Regenerate blocks for new week
    this.createBlocks();
    
    // Re-establish collision detection with new blocks
    // The old colliders still reference the cleared group, so we need to refresh them
    this.physics.world.colliders.destroy();
    this.setupCollisions();
    
    // Create new ball
    this.createBall();
    
    // Update UI
    this.updateWeek();
    this.hideOverlay();
    
    // Show splash screen for new week (gives breathing room)
    this.showSplashScreen();
  }

  /**
   * Hide overlay
   */
  private hideOverlay() {
    this.overlayBg.setVisible(false);
    this.overlayText.setVisible(false);
    this.overlaySubtext.setVisible(false);
  }

  /**
   * Lose game
   */
  private loseGame() {
    this.gameOver = true;
    this.showOverlay('Meeting Overload 😵', `You've been overwhelmed by meetings!\nFinal Score: ${this.score}\n\nClick to try again`);
    
    this.input.once('pointerdown', () => {
      this.scene.restart();
    });
  }

  /**
   * Show overlay
   */
  private showOverlay(title: string, message: string) {
    this.overlayBg.setVisible(true);
    this.overlayText.setText(title).setVisible(true);
    this.overlaySubtext.setText(message).setVisible(true);
  }

  /**
   * Pause game
   */
  private pauseGame() {
    this.isPaused = true;
    this.physics.pause();
    
    // Release pointer lock when pausing
    if (this.pointerLocked) {
      document.exitPointerLock();
    }
    
    this.showOverlay('⏸️  PAUSED', 'Press ESC again to QUIT and restart\nClick anywhere to resume playing');
    
    // Click to resume
    this.input.once('pointerdown', () => {
      this.resumeGame();
    });
  }

  /**
   * Resume game
   */
  private resumeGame() {
    this.isPaused = false;
    this.escapePressed = false;
    this.physics.resume();
    this.hideOverlay();
  }

  /**
   * Quit game (return to start)
   */
  private quitGame() {
    // Show quick "QUITTING" overlay before restart
    this.hideOverlay();
    this.showOverlay('🚪 QUITTING...', 'Restarting game');
    
    // Restart after brief delay
    this.time.delayedCall(500, () => {
      this.scene.restart();
    });
  }

  /**
   * Load progress from localStorage
   */
  private loadProgress() {
    try {
      const saved = localStorage.getItem('calendarBreakout_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        this.currentWeek = progress.highestWeek || 1;
        this.score = progress.score || 0;
        console.log(`Loaded progress: Week ${this.currentWeek}, Score ${this.score}`);
      }
    } catch (e) {
      console.warn('Failed to load progress:', e);
    }
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress() {
    try {
      const progress = {
        highestWeek: this.currentWeek,
        score: this.score,
        timestamp: Date.now()
      };
      localStorage.setItem('calendarBreakout_progress', JSON.stringify(progress));
    } catch (e) {
      console.warn('Failed to save progress:', e);
    }
  }
}

