# RideGuard Dashboard Frontend

This folder contains the complete RideGuard web frontend built with React, Vite, TypeScript, and Tailwind CSS.

## Built With

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Radix UI
- TanStack Query
- Vitest
- Playwright

## Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

## Setup & Run Locally
1. Install dependencies:
	```bash
	npm install
	```
2. Copy and edit your environment file:
	```bash
	cp .env.example .env
	# Edit .env to set VITE_API_BASE_URL to your backend URL (e.g. http://localhost:8000)
	```
3. Start the dev server:
	```bash
	npm run dev
	```

Default dev URL: http://localhost:5174

> **Note:** The dashboard requires the backend API running (see ../backend/README.md).

## Build
To build and preview production output:
```bash
npm run build
npm run preview
```
