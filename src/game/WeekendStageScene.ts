/**
 * Weekend Email Dodge - Bonus Stage
 * Appears every 5th week (5, 10, 15, 20, ...)
 * Survive 30 seconds without touching falling emails
 */

import Phaser from 'phaser';
import { getBoardDimensions } from './calendarGenerator';
import { sound } from './soundEffects';

interface WeekendStageData {
  week: number;
  currentScore: number;
  lives: number;
}

export default class WeekendStageScene extends Phaser.Scene {
  private paddle!: Phaser.Physics.Arcade.Image;
  private emails!: Phaser.Physics.Arcade.Group;
  
  private timerMs: number = 30000; // 30 seconds
  private alive: boolean = true;
  private startTime: number = 0;
  
  // UI elements
  private timerText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  
  // Game data
  private weekData!: WeekendStageData;
  private emailsSpawned: number = 0;
  private emailsTouched: number = 0;
  
  constructor() {
    super({ key: 'WeekendStageScene' });
  }

  init(data: WeekendStageData) {
    this.weekData = data;
    this.alive = true;
    this.emailsSpawned = 0;
    this.emailsTouched = 0;
  }

  create() {
    const { width, height } = getBoardDimensions();
    
    // Weekend sky blue background
    this.cameras.main.setBackgroundColor('#E3F2FD');
    
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
    
    // Victory timer - survive 30 seconds
    this.time.delayedCall(this.timerMs, () => this.win());
    
    // Update timer display
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.updateTimer()
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
    this.titleText = this.add.text(width / 2, 50, '🌴 WEEKEND BONUS STAGE 🌴', {
      fontFamily: 'Impact, Arial Black, sans-serif',
      fontSize: '28px',
      color: '#FFFFFF',
      stroke: '#1976D2',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // Instructions
    this.instructionText = this.add.text(width / 2, 110, '⚠️ DON\'T TOUCH THE EMAILS! ⚠️', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      color: '#D32F2F',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Timer display
    this.timerText = this.add.text(width / 2, 150, 'Time: 30.0s', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '24px',
      color: '#1976D2',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Score display
    this.scoreText = this.add.text(20, 20, `Score: ${this.weekData.currentScore}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#424242',
      fontStyle: '600'
    });
  }

  private createPaddle() {
    const { width, height } = getBoardDimensions();
    
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
    
    // Mouse/touch control
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.alive) {
        this.paddle.x = Phaser.Math.Clamp(pointer.x, 60, width - 60);
      }
    });
  }

  private spawnEmailWaves() {
    // Difficulty increases with week number
    const weekMultiplier = Math.min(2, 1 + this.weekData.week / 26);
    const waves = Math.round(6 * weekMultiplier); // 6-12 waves
    
    for (let w = 0; w < waves; w++) {
      this.time.delayedCall(w * 5000, () => {
        if (this.alive) {
          const pattern = Phaser.Math.RND.pick(['line', 'zig', 'v', 'random']);
          this.patternFall(pattern);
        }
      });
    }
  }

  private patternFall(pattern: 'line' | 'zig' | 'v' | 'random') {
    const { width } = getBoardDimensions();
    const cols = [120, 260, 400, 540, 680, 820];
    
    cols.forEach((x, i) => {
      const email = this.createEmailSprite(x, -20);
      
      // Base falling speed
      const baseSpeed = Phaser.Math.Between(120, 200);
      email.setVelocityY(baseSpeed);
      
      // Pattern-specific movement
      switch (pattern) {
        case 'zig':
          email.setVelocityX(i % 2 === 0 ? 60 : -60);
          break;
        case 'v':
          email.setVelocityX((i - 2.5) * 20);
          break;
        case 'random':
          email.setVelocityX(Phaser.Math.Between(-80, 80));
          break;
        // 'line' - no horizontal movement
      }
      
      email.setBounce(0.2);
      email.setCollideWorldBounds(true);
      
      this.emailsSpawned++;
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
    const bonus = 500 + dodged * 10;
    
    // Flash green
    this.cameras.main.flash(500, 0, 255, 0);
    
    this.end(true, bonus);
  }

  private fail() {
    // No bonus for failing
    this.end(false, 0);
  }

  private end(success: boolean, bonus: number) {
    // Freeze physics
    this.physics.pause();
    
    // Show result overlay
    this.showResultOverlay(success, bonus);
    
    // Continue after 3 seconds or on click
    this.time.delayedCall(1500, () => {
      this.input.once('pointerdown', () => {
        this.continueToNextWeek(bonus);
      });
    });
  }

  private showResultOverlay(success: boolean, bonus: number) {
    const { width, height } = getBoardDimensions();
    
    // Dim overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setDepth(1000);
    
    // Result text
    const resultText = this.add.text(
      width / 2,
      height / 2 - 60,
      success ? '🎉 WEEKEND SURVIVED! 🎉' : '💥 EMAIL OVERLOAD! 💥',
      {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontSize: '48px',
        color: success ? '#4CAF50' : '#D32F2F',
        stroke: '#FFFFFF',
        strokeThickness: 4
      }
    ).setOrigin(0.5).setDepth(1001);
    
    // Bonus score
    const bonusText = this.add.text(
      width / 2,
      height / 2,
      success ? `Bonus: +${bonus} points!` : 'No bonus...',
      {
        fontFamily: 'Inter, sans-serif',
        fontSize: '32px',
        color: '#FFD700',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5).setDepth(1001);
    
    // Stats
    const statsText = this.add.text(
      width / 2,
      height / 2 + 50,
      `Emails dodged: ${this.emailsSpawned - this.emailsTouched} / ${this.emailsSpawned}`,
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

  private continueToNextWeek(bonus: number) {
    // Return to main calendar scene with bonus
    this.scene.start('CalendarScenePhase2', {
      week: this.weekData.week,
      score: this.weekData.currentScore + bonus,
      lives: this.weekData.lives,
      fromWeekendBonus: true
    });
  }
}

