# RideGuard Mobile App

Mobile client for RideGuard built with React, Vite, and Capacitor.

## Built With

- React
- TypeScript
- Vite
- Tailwind CSS
- Capacitor
- Android
- Vitest
- Playwright

## Prerequisites

- Node.js 18+
- npm
- Android Studio (for native Android builds)

## Setup and Run

1. Install dependencies:
	```bash
	npm install
	```
2. Start the dev server:
	```bash
	npm run dev
	```
3. Build web assets for native sync:
	```bash
	npm run build
	```
4. Sync Capacitor project:
	```bash
	npx cap sync android
	```
5. Open Android project:
	```bash
	npx cap open android
	```

## Testing

- Unit tests: `npm run test`
- End-to-end tests: `npx playwright test`
