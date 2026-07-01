// src/theme/colors.js
//
// Color tokens reverse-engineered from screenshots of the ZamboAlert
// "rescuers" app. These are best-visual-estimates, not exact hex codes
// pulled from source. If you get the rescuer app's actual theme file,
// just swap the values below and everything in this app updates with it.

export const colors = {
  // Brand / primary
  primary: '#E0342B', // logo chip, "rescuers"/"citizen" badge, critical alerts, active states
  primaryDark: '#B82A22', // pressed state for primary buttons
  primaryLight: 'rgba(224, 52, 43, 0.10)', // soft pink chip behind active tab icon, tracked-dot wrapper

  // Surfaces
  background: '#F6F7F9', // screen background
  surface: '#FFFFFF', // cards, header, tab bar
  border: '#ECECEC', // card borders / hairlines
  inactiveBg: '#F0F1F3', // unselected pill buttons (floor level, etc.)

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#8A8F98', // "2 tracked · 3 pods live", bearing labels
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Status dots (map legend equivalent)
  statusCritical: '#E0342B', // red
  statusResponsive: '#111111', // black
  statusUnknown: '#9CA3AF', // gray
  statusSelf: '#2F6FED', // blue ("You" marker)

  // Misc indicators
  success: '#22C55E', // "CACHED" dot
  warningBg: '#E0342B', // full-width alert banner background
  shadow: 'rgba(16, 24, 40, 0.06)',
};

export default colors;
