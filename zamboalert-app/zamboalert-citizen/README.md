# ZamboAlert — Citizen App

React Native (Expo) mobile app for citizens using the ZamboAlert emergency communication system in Zamboanga City. Works offline using Bluetooth Low Energy (BLE) beaconing to signal nearby rescuer pods even without cellular signal.

## Tech Stack
- **Framework:** React Native + Expo SDK 54
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **Font:** Inter (via @expo-google-fonts)
- **Icons:** @expo/vector-icons (Ionicons)

## Screens
| Screen | Description |
|---|---|
| Welcome | App landing page with Sign in / Create account |
| Login | Role-based login (Citizen / Rescuer) |
| Sign Up | Account registration with role selection |
| SOS | One-tap disaster emergency buttons (Earthquake, Flash Flood, Landslide, Fire) |
| Status | BLE beacon status and nearby rescuer pod detection |
| Log | Timestamped history of SOS events |
| Settings | Emergency profile, permissions, logout |

## Getting Started

```bash
# Install dependencies
npm install

# Install correct babel preset for Expo SDK 54
npm install --save-dev babel-preset-expo@~54.0.10

# Start the development server
npx expo start --clear
```

Scan the QR code with **Expo Go** on your Android device.

## Demo Accounts
| Role | Email | Password |
|---|---|---|
| Citizen | citizen@test.com | test1234 |
| Rescuer | rescuer@test.com | test1234 |

## Project Structure
```
src/
  theme/          colors.js, typography.js
  components/     Header, Card, Button, AlertBanner, StatusDot
  context/        AuthContext.js, AppStateContext.js
  navigation/     RootNavigator.js
  screens/
    auth/         WelcomeScreen, LoginScreen, SignUpScreen
                  SOSScreen, StatusScreen, LogScreen,
                  SettingsScreen, RescuerPlaceholderScreen
```

## Notes
- BLE broadcasting is currently **mocked/simulated** — real BLE advertising requires a custom dev build (not Expo Go)
- The rescuer dashboard is under development — rescuer accounts show a placeholder screen
- All auth is in-memory mock only — connect to a real backend (Firebase / Supabase) for production
