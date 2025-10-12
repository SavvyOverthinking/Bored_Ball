/**
 * Main Game Scene - Calendar Breakout
 * Core game loop, physics, collision detection, and rendering
 */

import Phaser from 'phaser';
import { generateCalendarBlocks, getCalendarGridConfig, getBoardDimensions, type BlockData } from './calendarGenerator';
import { applyMeetingEffect, type MeetingType } from './physicsModifiers';
import { BallPool } from './BallPool';
import { clampVelocity, calculatePaddleBounceAngle, PHYSICS } from './constants';
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
  
  // Game state
  private score: number = 0;
  private lives: number = 3;
  private currentWeek: number = 1;
  private totalWeeks: number = 52;
  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private escapePressed: boolean = false;
  
  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private weekText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private overlayBg!: Phaser.GameObjects.Rectangle;
  private overlayText!: Phaser.GameObjects.Text;
  private overlaySubtext!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // No assets needed - we'll use graphics
  }

  create() {
    const { width, height } = getBoardDimensions();

    // Set background (lighter, more Outlook-like)
    this.add.rectangle(width / 2, height / 2, width, height, 0xfafbfc);

    // Load saved progress
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
  }

  update() {
    if (this.gameOver || this.isPaused) return;

    // Keep paddle velocity at zero (prevent drift)
    const paddleBody = this.paddle.body as Phaser.Physics.Arcade.Body;
    if (paddleBody) {
      paddleBody.setVelocity(0, 0);
    }

    // Follow mouse with paddle
    if (this.input.activePointer) {
      const pointer = this.input.activePointer;
      this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, getBoardDimensions().width - 50);
    }

    // Start game on click if not started
    if (!this.gameStarted && this.input.activePointer.isDown) {
      this.startGame();
    }

    // Check if all blocks destroyed
    if (this.blocks.getLength() === 0 && this.gameStarted && !this.gameOver) {
      this.winGame();
    }

    // Prevent balls from getting stuck in horizontal or repetitive bounces
    if (this.gameStarted) {
      const currentTime = this.time.now;
      
      this.ballPool.getGroup().children.iterate((ball: any) => {
        if (ball.active && ball.body) {
          const body = ball.body as Phaser.Physics.Arcade.Body;
          const absVelocityY = Math.abs(body.velocity.y);
          
          // Track ball position history
          if (!this.ballPositionHistory.has(ball)) {
            this.ballPositionHistory.set(ball, []);
          }
          const history = this.ballPositionHistory.get(ball)!;
          history.push({ x: ball.x, y: ball.y, time: currentTime });
          
          // Keep only last 60 frames (1 second at 60fps)
          if (history.length > 60) {
            history.shift();
          }
          
          let needsCorrection = false;
          
          // Check 1: Ball moving too horizontally
          if (absVelocityY < 120) {
            needsCorrection = true;
          }
          
          // Check 2: Ball stuck in small area (repetitive pattern)
          if (history.length >= 30) {
            const recent = history.slice(-30);
            const avgY = recent.reduce((sum, p) => sum + p.y, 0) / recent.length;
            const yVariance = recent.reduce((sum, p) => sum + Math.pow(p.y - avgY, 2), 0) / recent.length;
            
            // If ball has been in roughly the same Y position for 30 frames (stuck pattern)
            if (yVariance < 400) { // Standard deviation less than ~20 pixels
              needsCorrection = true;
            }
          }
          
          // Apply correction
          if (needsCorrection) {
            const speed = Phaser.Math.Clamp(body.velocity.length(), PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
            
            // Force a more vertical angle (45-75 degrees from horizontal)
            const randomAngle = Phaser.Math.Between(45, 75) * Math.PI / 180;
            const direction = body.velocity.y > 0 ? 1 : -1;
            
            body.setVelocity(
              Math.cos(randomAngle) * speed * (body.velocity.x > 0 ? 1 : -1),
              Math.sin(randomAngle) * speed * direction
            );
            
            // Clear history to give it a fresh start
            this.ballPositionHistory.set(ball, []);
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
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameOver && !this.isPaused) {
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 50, getBoardDimensions().width - 50);
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
    
    // Set up collisions between ball pool and paddle/blocks
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
  }

  /**
   * Ball hits paddle handler
   */
  private ballHitPaddle(ball: any, paddle: any) {
    const ballBody = ball.body as Phaser.Physics.Arcade.Body;
    
    // Play sound effect
    sound.paddleHit();
    
    // Calculate deterministic bounce angle based on paddle hit position
    const angle = calculatePaddleBounceAngle(ball.x, paddle.x, PHYSICS.PADDLE_WIDTH);
    
    // Get current speed and apply new angle
    const currentSpeed = ballBody.velocity.length();
    const speed = Phaser.Math.Clamp(currentSpeed, PHYSICS.MIN_SPEED, PHYSICS.MAX_SPEED);
    
    // Set velocity using angle (always upward)
    ballBody.setVelocity(
      Math.sin(angle) * speed,
      -Math.abs(Math.cos(angle)) * speed
    );
    
    // Apply clamp to ensure velocity stays within bounds
    const velocity = new Phaser.Math.Vector2(ballBody.velocity.x, ballBody.velocity.y);
    const clampedVelocity = clampVelocity(velocity);
    ballBody.setVelocity(clampedVelocity.x, clampedVelocity.y);
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
    
    // Clear all blocks
    this.blocks.clear(true, true);
    this.blockDataMap.clear();
    this.blockHitPoints.clear();
    
    // Regenerate blocks for new week
    this.createBlocks();
    
    // Create new ball
    this.createBall();
    
    // Update UI
    this.updateWeek();
    this.hideOverlay();
    
    // Show instruction
    this.instructionText.setVisible(true);
    this.instructionText.setText(`Week ${this.currentWeek} - Click to start`);
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
    this.showOverlay('PAUSED', 'ESC again to quit\nClick to resume');
    
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
    this.scene.restart();
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

