import Phaser from 'phaser';

export type ThemeName = 'outlook' | 'google' | 'default';

export interface ThemeSkin {
  bg: (scene: Phaser.Scene) => void;
  colors: Record<string, number>; // meeting type → hex color
}

// Base colors for all meeting types
const BASE_MEETING_COLORS = {
  '1:1': 0x5c6bc0,
  team: 0x4caf50,
  boss: 0xe53935,
  lunch: 0xfbc02d,
  personal: 0x8e24aa,
  sticky: 0x9E9E9E,
  // New meeting types
  recurring: 0x2e7d32,  // Darker green (cycle icon)
  allhands: 0xff6d00,   // Orange
  focus: 0x00897b,      // Teal
  emergency: 0xd32f2f,  // Red (flashing)
  optional: 0x78909c,   // Grey-blue (dashed)
};

export const THEMES: Record<ThemeName, ThemeSkin> = {
  default: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#f7f9fc');
    },
    colors: { ...BASE_MEETING_COLORS },
  },
  outlook: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#fafbfc');
    },
    colors: {
      ...BASE_MEETING_COLORS,
      // Outlook-specific overrides if needed
    },
  },
  google: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#ffffff');
    },
    colors: {
      ...BASE_MEETING_COLORS,
      // Google Calendar-specific overrides
      '1:1': 0x3f51b5,
      team: 0x0b8043,
      boss: 0xd50000,
      lunch: 0xf09300,
    },
  },
};

/**
 * Get theme from URL query parameter
 */
export function getThemeFromUrl(): ThemeName {
  const params = new URLSearchParams(window.location.search);
  const theme = params.get('theme') as ThemeName;
  return theme && theme in THEMES ? theme : 'default';
}
