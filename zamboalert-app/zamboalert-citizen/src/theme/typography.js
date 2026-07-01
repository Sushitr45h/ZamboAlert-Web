// src/theme/typography.js
//
// The rescuer app's type doesn't show any distinctive custom letterforms —
// it reads as a clean system sans (SF Pro / Roboto). Inter is the closest,
// free, widely-used match and is what this app loads via expo-font. If the
// rescuer app turns out to use a specific named font, just change the
// fontFamily strings below — everything pulls from this one file.

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const typography = {
  // App title ("ZamboAlert")
  appTitle: { fontFamily: fontFamily.bold, fontSize: 19, color: '#1A1A1A' },

  // Section / card headers ("Offline Map — Zone 4-7")
  h2: { fontFamily: fontFamily.semibold, fontSize: 15, color: '#1A1A1A' },

  // Victim/entry name row ("VICTIM-02")
  entryTitle: { fontFamily: fontFamily.bold, fontSize: 15, color: '#1A1A1A' },

  // Big distance-style number ("28.0m")
  bigStat: { fontFamily: fontFamily.bold, fontSize: 26 },

  // Body copy
  body: { fontFamily: fontFamily.regular, fontSize: 14, color: '#1A1A1A' },

  // Secondary/meta text ("2 tracked · 3 pods live", "37° Bearing")
  meta: { fontFamily: fontFamily.regular, fontSize: 13, color: '#8A8F98' },

  // Small uppercase label ("FLOOR LEVEL", "CACHED")
  eyebrow: {
    fontFamily: fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#8A8F98',
  },

  // Button label
  button: { fontFamily: fontFamily.semibold, fontSize: 15 },

  // Tab bar label
  tabLabel: { fontFamily: fontFamily.medium, fontSize: 11 },
};

export default typography;
