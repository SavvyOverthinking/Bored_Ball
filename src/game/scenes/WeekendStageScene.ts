/**
 * Weekend Email Dodge - Bonus Stage
 * Appears after every fifth cleared workday.
 * Short, restorative bonus stage between work weeks.
 */

import Phaser from 'phaser';
import { getBoardDimensions } from '@game/utils/calendarGenerator';
import { sound } from '@game/systems/soundEffects';
import { GAME, WEEKEND_STAGE } from '@config/constants';
import { gameEventBus } from '@game/systems/GameEventBus';

interface WeekendStageData {
  week: number;
  nextWeek?: number;
  score?: number;
  lives?: number;
}

export default class WeekendStageScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Image;
  private emails!: Phaser.Physics.Arcade.Group;

  private timerMs: number = WEEKEND_STAGE.DURATION_MS;
  private alive: boolean = true;
  private startTime: number = 0;
  
  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  
  // Game data
  private weekData!: WeekendStageData;
  private emailsSpawned: number = 0;
  private emailsTouched: number = 0;
  
  constructor() {
    super({ key: 'WeekendStageScene' });
  }

  init(data: WeekendStageData) {
    this.weekData = {
      week: data.week,
      nextWeek: data.nextWeek || Math.min(GAME.TOTAL_WEEKS, data.week + 1),
      score: data.score || 0,
      lives: data.lives || 3
    };
    this.alive = true;
    this.emailsSpawned = 0;
    this.emailsTouched = 0;
  }

  create() {
    getBoardDimensions(); // Get dimensions for reference
    
    // Weekend sky blue background
    this.cameras.main.setBackgroundColor('#E3F2FD');

    gameEventBus.emitGameEvent('WEEK_UPDATE', { week: this.weekData.week });
    gameEventBus.emitGameEvent('GAME_PAUSE', { isPaused: false });
    gameEventBus.emitGameEvent('GAME_OVER', { gameOver: false });
    
    // Draw weekend UI
    this.drawWeekendUI();
    
    // Create paddle (reuse paddle mechanics)
    this.createPaddle();
    
    // Create email group
    this.emails = this.physics.add.group({
      defaultKey: 'email_sprite',
      maxSize: 50
    });
    
    // Setup collisions - touching email = instant fail
    this.physics.add.overlap(
      this.paddle,
      this.emails,
      () => this.touchedEmail(),
      undefined,
      this
    );
    
    // Start spawn waves
    this.startTime = Date.now();
    this.spawnEmailWaves();
    
    // Victory timer - survive the restorative break.
    this.time.delayedCall(this.timerMs, () => this.win());
    
    // Update timer display
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.updateTimer()
    });
  }

  update() {
    const { height } = getBoardDimensions();

    // Clean up emails that have fallen off the bottom of the screen
    this.emails.getChildren().forEach((emailObj) => {
      const email = emailObj as Phaser.GameObjects.Sprite;
      if (email.active && email.y > height + 50) {
        email.destroy();
      }
    });
  }

  private drawWeekendUI() {
    const { width } = getBoardDimensions();
    
    // Weekend badge
    const badge = this.add.graphics();
    badge.fillStyle(0x2196F3, 1);
    badge.fillRoundedRect(width / 2 - 150, 20, 300, 60, 10);
    badge.lineStyle(3, 0x1976D2, 1);
    badge.strokeRoundedRect(width / 2 - 150, 20, 300, 60, 10);
    
    // Title
    this.add.text(width / 2, 50, '🌴 WEEKEND RESET 🌴', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#1976D2',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Instructions
    this.add.text(width / 2, 110, 'Dodge emails to earn points and refill 1 life', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#0f5f8f',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Timer display
    this.timerText = this.add.text(width / 2, 150, `Time: ${(this.timerMs / 1000).toFixed(1)}s`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      color: '#1976D2',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Score display
    this.add.text(20, 20, `Score: ${this.weekData.score || 0}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#424242',
      fontStyle: '600'
    });

    this.add.text(width - 20, 20, `Lives: ${this.weekData.lives || 0}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#424242',
      fontStyle: '600'
    }).setOrigin(1, 0);
  }

  private createPaddle() {
    const { width, height } = getBoardDimensions();
    
    // Release any existing pointer lock from main game
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Create paddle graphics if it doesn't exist as texture
    if (!this.textures.exists('weekend_paddle')) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x2196F3, 1);
      graphics.fillRoundedRect(0, 0, 120, 16, 8);
      graphics.generateTexture('weekend_paddle', 120, 16);
      graphics.destroy();
    }
    
    this.paddle = this.physics.add.image(width / 2, height - 60, 'weekend_paddle');
    this.paddle.setImmovable(true);
    this.paddle.setCollideWorldBounds(true);
    
    // Set default cursor to visible
    this.input.setDefaultCursor('default');
    
    // Mouse/touch control - update paddle position continuously
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.alive) {
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 60, width - 60);
      }
    });
    
    // Also update on pointer down to ensure immediate response
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.alive) {
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 60, width - 60);
      }
    });
  }

  private spawnEmailWaves() {
    // Difficulty increases by work week, but the weekend stays shorter than the main game.
    const weekMultiplier = Math.min(1.75, 1 + this.weekData.week / GAME.TOTAL_WEEKS);
    const waves = Math.round(4 * weekMultiplier); // 4-7 waves
    const waveInterval = Math.max(2500, this.timerMs / (waves + 1));
    
    for (let w = 0; w < waves; w++) {
      this.time.delayedCall(w * waveInterval, () => {
        if (this.alive) {
          const patterns: ('line' | 'zig' | 'v' | 'random')[] = ['line', 'zig', 'v', 'random'];
          const pattern = patterns[Math.floor(Math.random() * patterns.length)];
          this.patternFall(pattern);
        }
      });
    }
  }

  private patternFall(pattern: 'line' | 'zig' | 'v' | 'random') {
    const cols = [120, 260, 400, 540, 680, 820];
    
    cols.forEach((x, i) => {
      const email = this.createEmailSprite(x, -20);
      
      // Ensure email body exists and has physics enabled
      if (!email.body) {
        console.error('Email has no physics body!');
        return;
      }
      
      const body = email.body as Phaser.Physics.Arcade.Body;
      
      // Critical: Allow emails to fall through bottom
      body.setCollideWorldBounds(false);
      body.setBounce(0); // No bouncing
      
      // Base falling speed
      const baseSpeed = Phaser.Math.Between(95, 170 + Math.round(this.weekData.week * 2));
      body.setVelocityY(baseSpeed);
      
      // Pattern-specific movement
      switch (pattern) {
        case 'zig':
          body.setVelocityX(i % 2 === 0 ? 60 : -60);
          break;
        case 'v':
          body.setVelocityX((i - 2.5) * 20);
          break;
        case 'random':
          body.setVelocityX(Phaser.Math.Between(-80, 80));
          break;
        // 'line' - no horizontal movement
      }

      // NOTE: emailsSpawned is incremented in createEmailSprite(), not here
    });
  }

  private createEmailSprite(x: number, y: number): Phaser.Physics.Arcade.Image {
    // Create email icon if it doesn't exist
    if (!this.textures.exists('email_sprite')) {
      const graphics = this.add.graphics();
      
      // Envelope shape
      graphics.fillStyle(0xFFFFFF, 1);
      graphics.fillRoundedRect(0, 0, 32, 24, 2);
      graphics.lineStyle(2, 0xD32F2F, 1);
      graphics.strokeRoundedRect(0, 0, 32, 24, 2);
      
      // Envelope flap
      graphics.beginPath();
      graphics.moveTo(0, 0);
      graphics.lineTo(16, 12);
      graphics.lineTo(32, 0);
      graphics.strokePath();
      
      graphics.generateTexture('email_sprite', 32, 24);
      graphics.destroy();
    }
    
    const email = this.emails.create(x, y, 'email_sprite') as Phaser.Physics.Arcade.Image;
    email.setCircle(12); // Circular hit box
    email.setCollideWorldBounds(false); // Allow emails to fall off screen
    this.emailsSpawned++;
    return email;
  }

  private touchedEmail() {
    if (!this.alive) return;
    
    this.emailsTouched++;
    this.alive = false;
    
    // Play fail sound
    sound.lifeLost();
    
    // Flash red
    this.cameras.main.flash(500, 255, 0, 0);
    
    this.fail();
  }

  private updateTimer() {
    if (!this.alive) return;
    
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, (this.timerMs - elapsed) / 1000);
    
    // Color code timer
    let color = '#1976D2'; // Blue
    if (remaining < 10) color = '#FF9800'; // Orange
    if (remaining < 5) color = '#D32F2F';  // Red
    
    this.timerText.setText(`Time: ${remaining.toFixed(1)}s`);
    this.timerText.setColor(color);
  }

  private win() {
    if (!this.alive) return;
    
    this.alive = false;
    
    // Play victory sound
    sound.weekCleared();
    
    // Calculate bonus
    const dodged = this.emailsSpawned - this.emailsTouched;
    const bonus = WEEKEND_STAGE.BONUS_POINTS_BASE + dodged * WEEKEND_STAGE.BONUS_POINTS_PER_EMAIL;
    const restoredLives = Math.min(WEEKEND_STAGE.RESTORE_LIFE_MAX, (this.weekData.lives || 0) + 1);
    
    // Flash green
    this.cameras.main.flash(500, 0, 255, 0);
    
    this.end(true, bonus, restoredLives);
  }

  private fail() {
    // No penalty for failing; the weekend is a break, not another life trap.
    this.end(false, 0, this.weekData.lives || 3);
  }

  private end(success: boolean, bonus: number, restoredLives: number) {
    // Freeze physics
    this.physics.pause();
    
    // Show result overlay
    this.showResultOverlay(success, bonus, restoredLives);
    
    // Continue after 3 seconds or on click
    this.time.delayedCall(1500, () => {
      this.input.once('pointerdown', () => {
        this.continueToNextWeek(bonus, restoredLives);
      });
    });
  }

  private showResultOverlay(success: boolean, bonus: number, restoredLives: number) {
    const { width, height } = getBoardDimensions();
    
    // Dim overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(1000);
    
    // Result text
    this.add.text(
      width / 2,
      height / 2 - 60,
      success ? '🎉 WEEKEND RESET! 🎉' : '💥 EMAIL OVERLOAD! 💥',
      {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '48px',
        color: success ? '#4CAF50' : '#D32F2F',
        stroke: '#FFFFFF',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(1001);
    
    // Bonus score
    this.add.text(
      width / 2,
      height / 2,
      success ? `Bonus: +${bonus} points!` : 'No bonus, no penalty',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '32px',
        color: '#FFD700',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001);
    
    // Stats
    this.add.text(
      width / 2,
      height / 2 + 50,
      success
        ? `Emails dodged: ${this.emailsSpawned - this.emailsTouched} / ${this.emailsSpawned}\nLives refilled to ${restoredLives}`
        : `Emails dodged: ${this.emailsSpawned - this.emailsTouched} / ${this.emailsSpawned}`,
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '20px',
        color: '#FFFFFF'
      }
    ).setOrigin(0.5).setDepth(1001);
    
    // Continue instruction
    const continueText = this.add.text(
      width / 2,
      height / 2 + 100,
      'Click to continue...',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '18px',
        color: '#90CAF9'
      }
    ).setOrigin(0.5).setDepth(1001);
    
    // Pulse animation
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  private continueToNextWeek(bonus: number, restoredLives: number) {
    // Return to the next calendar day with any earned weekend bonus.
    this.scene.start('CalendarScenePhase2', {
      week: this.weekData.nextWeek,
      score: (this.weekData.score || 0) + bonus,
      lives: restoredLives,
      fromWeekendBonus: true
    });
  }
}

