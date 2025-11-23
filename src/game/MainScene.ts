/**
 * Main Game Scene - Calendar Breakout (Phase 1)
 * Now extends BaseCalendarScene to eliminate code duplication
 */

import { generateCalendarBlocks, type BlockData } from './calendarGenerator';
import { type MeetingType } from './physicsModifiers';
import { PHYSICS } from './constants';
import calendarData from '../data/mockCalendar.json';
import type { PhaserBlock } from './types';
import { BaseCalendarScene } from './BaseCalendarScene';

export class MainScene extends BaseCalendarScene {
  // Phase 1 specific: Block data map
  private blockDataMap: Map<string, BlockData> = new Map();

  constructor() {
    super('MainScene');
  }

  create() {
    // Reset score/lives/week for Phase 1
    this.score = 0;
    this.lives = 3;
    this.currentWeek = 1;

    // Load saved progress (will overwrite week/score if exists)
    this.loadProgress();

    // Call base create logic
    this.baseCreate();
  }

  update() {
    // Call base update logic
    this.baseUpdate();
  }

  /**
   * Create blocks from mock calendar data (Phase 1 specific)
   */
  protected createBlocks() {
    this.blocks = this.physics.add.staticGroup();
    const blockDataList = generateCalendarBlocks(calendarData.meetings as Array<{
      id: string;
      title: string;
      type: MeetingType;
      day: string;
      startTime: string;
      endTime: string;
      color: string;
    }>);

    blockDataList.forEach((blockData) => {
      const color = parseInt(blockData.color.replace('#', '0x'));
      const blockRect = this.add.rectangle(
        blockData.x,
        blockData.y,
        blockData.width - 4,
        blockData.height,
        color,
        0.85
      );

      blockRect.setStrokeStyle(1, 0xffffff, 0.2);
      this.blocks.add(blockRect);

      const block = blockRect as PhaserBlock;
      block.setData('meetingType', blockData.type);
      block.setData('blockId', blockData.id);

      // Create left accent bar
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

      // Initialize hit points
      const hitPoints = this.getHitPointsForMeeting(blockData.type);
      this.blockHitPoints.set(blockData.id, hitPoints);

      // Add title text
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
   * Get hit points for meeting type (Phase 1 implementation)
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
   * Get paddle width (Phase 1: fixed width)
   */
  protected getPaddleWidth(): number {
    return PHYSICS.PADDLE_WIDTH;
  }

  /**
   * Create extra ball (for split effect)
   */
  public createExtraBall(x: number, y: number, velocityX: number, velocityY: number) {
    if (this.ballPool.getActiveBallCount() >= 3) {
      console.log('Max balls reached (3), skipping extra ball creation');
      return;
    }

    this.ballPool.spawn(x, y, velocityX, velocityY);
  }

  /**
   * Handle week transition (Phase 1 specific)
   */
  protected handleNextWeek() {
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

    // Re-establish collision detection
    this.physics.world.colliders.destroy();
    this.setupCollisionsBase();

    // Create new ball
    this.createBallBase();

    // Update UI
    this.updateWeek();
    this.hideOverlay();

    // Show splash screen for new week
    this.showSplashScreen();
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
