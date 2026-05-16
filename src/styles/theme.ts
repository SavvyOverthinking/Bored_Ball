import Phaser from 'phaser';

export type ThemeName = 'outlook' | 'google' | 'default';

export interface ThemeSkin {
  bg: (scene: Phaser.Scene) => void;
  colors: Record<string, number>; // meeting type → hex color
}

// Base colors for all meeting types
const BASE_MEETING_COLORS = {
  '1:1': 0x0078d4,
  team: 0x107c10,
  boss: 0xc50f1f,
  lunch: 0xf2c811,
  personal: 0x8764b8,
  sticky: 0x8a8886,
  // New meeting types
  recurring: 0x0b6a0b,
  allhands: 0xca5010,
  focus: 0x038387,
  emergency: 0xa4262c,
  optional: 0x69797e,
};

export const THEMES: Record<ThemeName, ThemeSkin> = {
  default: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#ffffff');
    },
    colors: { ...BASE_MEETING_COLORS },
  },
  outlook: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#ffffff');
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
