import { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { Zone } from './engine/hero';

// Comic-book palette carried over from the Origin Story web builder.
const shared = {
  blue: '#1c5fc4',
  blueDeep: '#0f3f8f',
  teal: '#18a39b',
  yellow: '#ffd23f',
  orange: '#f5892a',
  red: '#e2343f',
  green: '#2f9e48',
  onAccent: '#15131a',
};

export const light = {
  ...shared,
  dark: false,
  bg: '#fbf6e9',
  bg2: '#f3ead3',
  panel: '#ffffff',
  panel2: '#f7f2e4',
  ink: '#15131a',
  muted: '#5d5866',
  faint: '#8f8999',
  line: '#15131a',
  shadow: '#15131a',
  hi: '#fff3b0',
  zone: {
    green: { fg: '#2f9e48', bg: '#e3f4e2', die: '#bfe6c0' },
    yellow: { fg: '#a88200', bg: '#fff6cc', die: '#ffe680' },
    red: { fg: '#d7303b', bg: '#fde3e1', die: '#f7b5b0' },
    out: { fg: '#5d5866', bg: '#ece8f1', die: '#d5d0de' },
  },
};

export const dark: typeof light = {
  ...shared,
  dark: true,
  bg: '#13141c',
  bg2: '#1b1d28',
  panel: '#20222f',
  panel2: '#272a39',
  ink: '#f1ede2',
  muted: '#a8a3b3',
  faint: '#6f6a7c',
  line: '#000000',
  shadow: '#000000',
  hi: '#3a3420',
  zone: {
    green: { fg: '#5fd27a', bg: '#1d3324', die: '#bfe6c0' },
    yellow: { fg: '#ffd23f', bg: '#3a3214', die: '#ffe680' },
    red: { fg: '#ff6b74', bg: '#3d1c1f', die: '#f7b5b0' },
    out: { fg: '#a8a3b3', bg: '#2b2a35', die: '#d5d0de' },
  },
};

export type Colors = typeof light;
export type ZoneKey = Zone | 'out';

export const ThemeContext = createContext<Colors>(light);
export const useColors = () => useContext(ThemeContext);

/** Build a StyleSheet from the current theme; rebuilt only when the theme changes. */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(make: (c: Colors) => T): T {
  const c = useColors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => StyleSheet.create(make(c)), [c]);
}

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const fonts = { display: 'Bangers_400Regular' };

/** Hard comic-book drop shadow (offset, no blur). */
export const comicShadow = (c: Colors, n = 3) => ({ boxShadow: `${n}px ${n}px 0px ${c.shadow}` });
