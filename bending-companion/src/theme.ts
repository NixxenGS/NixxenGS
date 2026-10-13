export const colors = {
  bg: '#0E1116',
  surface: '#171B22',
  surfaceRaised: '#1F2530',
  border: '#2A3140',
  text: '#F2EDE4',
  textMuted: '#9AA3B2',
  textFaint: '#626B7A',
  accent: '#E8B04B',
  accentSoft: 'rgba(232, 176, 75, 0.14)',
  success: '#4CC38A',
  mixed: '#E8B04B',
  miss: '#E5533D',
  danger: '#E5533D',
};

export const elementColors = {
  water: '#4FA3E0',
  earth: '#6FBF5A',
  fire: '#E5533D',
  air: '#F2A93B',
  weapons: '#B0B8C4',
  technology: '#9B7BE0',
} as const;

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  title: { fontSize: 28, fontWeight: '800' as const, color: colors.text, letterSpacing: -0.5 },
  heading: { fontSize: 18, fontWeight: '700' as const, color: colors.text },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  caption: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
};
