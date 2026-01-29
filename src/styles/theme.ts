import Phaser from 'phaser';

export type ThemeName = 'outlook' | 'google' | 'default';

export interface ThemeSkin {
  bg: (scene: Phaser.Scene) => void;
  colors: Record<string, number>; // meeting type → hex color
}

export const THEMES: Record<ThemeName, ThemeSkin> = {
  default: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#f7f9fc');
    },
    colors: {
      '1:1': 0x5c6bc0,
      team: 0x4caf50,
      boss: 0xe53935,
      lunch: 0xfbc02d,
      personal: 0x8e24aa,
      sticky: 0x9E9E9E, // NEW: Grey color for sticky blocks
    },
  },
  outlook: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#fafbfc');
    },
    colors: {
      '1:1': 0x5c6bc0,
      team: 0x4caf50,
      boss: 0xe53935,
      lunch: 0xfbc02d,
      personal: 0x8e24aa,
      sticky: 0x9E9E9E, // NEW
    },
  },
  google: {
    bg: (scene: Phaser.Scene) => {
      scene.cameras.main.setBackgroundColor('#ffffff');
    },
    colors: {
      '1:1': 0x3f51b5,
      team: 0x0b8043,
      boss: 0xd50000,
      lunch: 0xf09300,
      personal: 0x8e24aa,
      sticky: 0x9E9E9E, // NEW
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