# iRANTI

Local-first to-do list with reminders that wake the screen. React Native 0.79.5, TypeScript, NativeWind.

## Requirements

- Node 18.18 or newer (Node 22 recommended, see `.nvmrc`)
- Android: Android Studio with SDK Platform 35, JDK 17, and an emulator or a phone with USB debugging
- iOS (macOS only): Xcode 16, Ruby with Bundler, CocoaPods via `npm run pods`

## First run

```
npm install
npm start
npm run android
npm run ios
```

Run `npm start` in one terminal and the platform command in another. In VS Code these are under Terminal > Run Task.

## Checks

```
npm run typecheck
npm run lint
npm test
npm run doctor
```

## Layout

- `src/hooks`: public API (`useTasks`, `useReminders`, `useLicense`)
- `src/services`: task store, reminder scheduling, licence engine, purchases
- `src/native`: TypeScript wrappers for the native modules
- `android/app/src/main/java/com/iranti/alarm`: exact alarms, wake lock, full-screen alarm screen
- `android/app/src/main/java/com/iranti/security`: Keystore signing and sealed storage
- `ios/Iranti`: notification scheduling, critical alerts, Secure Enclave signing

## Store setup

Create a non-consumable product with ID `iranti_premium_lifetime` in App Store Connect and Google Play Console.
