/**
 * Read current CSS variables for Recharts theme integration
 */
export function getChartThemeColors() {
  if (typeof window === 'undefined') {
    return {
      accent: '#22D3EE',
      fg: '#F4F4F5',
      bg: '#0B0B0F',
      surface: '#18181E',
      surfaceHover: '#26262F',
      border: 'rgba(244, 244, 245, 0.20)',
      danger: '#EF4444',
      muted: 'rgba(244, 244, 245, 0.50)',
    };
  }

  const style = getComputedStyle(document.documentElement);
  const accent = style.getPropertyValue('--accent').trim() || '#22D3EE';
  const fg = style.getPropertyValue('--fg').trim() || '#F4F4F5';
  const bg = style.getPropertyValue('--bg').trim() || '#0B0B0F';
  const surface = style.getPropertyValue('--surface').trim() || '#18181E';
  const surfaceHover = style.getPropertyValue('--surface-hover').trim() || '#26262F';
  const border = style.getPropertyValue('--border-color').trim() || 'rgba(244, 244, 245, 0.20)';
  const danger = style.getPropertyValue('--danger').trim() || '#EF4444';

  return {
    accent,
    fg,
    bg,
    surface,
    surfaceHover,
    border,
    danger,
    muted: style.getPropertyValue('--fg-rgb')
      ? `rgba(${style.getPropertyValue('--fg-rgb').trim().replace(/ /g, ', ')}, 0.5)`
      : 'rgba(150, 150, 150, 0.5)',
  };
}

