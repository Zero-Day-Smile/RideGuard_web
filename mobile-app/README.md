# RideGuard Mobile App

This folder is for the mobile app (Android/iOS) built with Capacitor and Expo.

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- Android Studio (for Android build)
- Xcode (for iOS build, macOS only)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Sync Capacitor:
   ```bash
   npx cap sync
   ```

## Run in Expo (Web/Preview)
   ```bash
   npx expo start
   ```

## Android Build
1. Open Android Studio, select `mobile-app/android`.
2. Build APK via Gradle or run:
   ```bash
   npx cap open android
   ```

## iOS Build (macOS only)
1. Open Xcode, select `mobile-app/ios`.
2. Build or run:
   ```bash
   npx cap open ios
   ```

## Notes
- The app connects to the backend API at the URL set in your environment config.
- For local backend, ensure your device/emulator can access your computer's IP.
