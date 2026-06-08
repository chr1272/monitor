# Roadside Sentry Dashboard

React + Vite dashboard for real-time roadside telemetry and traffic events, hosted on GitHub Pages and backed by Firebase Firestore.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Firebase Client SDK (Auth + Firestore)
- Recharts (live telemetry chart)
- GitHub Pages (`gh-pages` package)

## Features

- Google OAuth login (`signInWithPopup`)
- Access guard for authenticated Google users
- Real-time Firestore listeners via `onSnapshot`
- Live status card (Radar + Sonometer)
- Environmental line chart for last 24h (`telemetry_heartbeat`)
- Latest 10 traffic events feed (`traffic_events`)

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from `.env.example`:

```bash
cp .env.example .env
```

3. Fill all Firebase values in `.env`.

4. Run dev server:

```bash
npm run dev
```

## Required Firestore Rules

Apply in Firebase Console -> Firestore Rules:

```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

## Firebase Console Checklist

- Enable Google provider in Firebase Authentication.
- Add `chr1272.github.io` (or your final GitHub Pages domain) to Authorized Domains.
- Confirm your Firestore collections exist:
  - `telemetry_heartbeat`
  - `traffic_events`

## Deploying to GitHub Pages

This repository includes both:

- `npm run deploy` using the `gh-pages` package.
- GitHub Actions workflow at `.github/workflows/deploy.yml`.

### GitHub Secrets required

Set these secrets in your GitHub repository settings:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

When you push to `main`, GitHub Actions builds and publishes `dist` to GitHub Pages.

For custom domains (for example `monitor.pixelking.io`), set `VITE_BASE_PATH=/`.
Use `/monitor/` only when hosting under a repository subpath like `username.github.io/repo`.
