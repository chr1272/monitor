This is the finalized specification for your Software Engineer. It focuses on a centralized, Git-native architecture using **GitHub Pages** and **Firebase Firestore**, adhering to a "Security-by-Rules" model.

***

# Task Specification: Roadside Sentry Dashboard (Frontend)

## 1. Project Objective
Build and deploy a secure, real-time React dashboard that visualizes traffic and environmental telemetry stored in Firestore. The deployment must be managed via GitHub, utilizing **GitHub Pages** for hosting.

## 2. Technical Stack & Deployment
*   **Framework:** React + Vite (TypeScript).
*   **Styling:** Tailwind CSS.
*   **Charts:** `recharts` (for live telemetry visualization).
*   **Database:** Google Cloud Firestore (Client SDK).
*   **Auth:** Firebase Authentication (Google OAuth Provider).
*   **Hosting:** GitHub Pages (Deploy via `gh-pages` npm package).

## 3. Firebase Architecture
The project utilizes two distinct collections in Firestore:
*   `telemetry_heartbeat`: Stores 1-minute averaged data (Temp, Hum, Pres, Gas, $L_{Aeq, 1m}$).
*   `traffic_events`: Stores vehicle/pedestrian transit logs (Timestamp, Class, Speed, Direction, Peak dBA).

### Security Configuration (Must implement in Firebase Console):
The frontend must not rely on "secrets" for security. Apply these rules in the Firestore Console to protect the data:
```javascript
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Allow read only if the user is logged in via Google OAuth and matches your email
      allow read: if request.auth != null && request.auth.token.email == "[YOUR_EMAIL_HERE]";
      allow write: if false; // Writing is exclusively handled by the Pi (Admin SDK)
    }
  }
}
```

## 4. Implementation Requirements
### A. Authentication
* Enable **Google OAuth** in the Firebase Authentication console.
* Create a simple "Login" page.
* Use `signInWithPopup` to handle user flow.
* Guard the main dashboard component so only your authenticated email can see the data.

### B. Data Fetching
* Use the **Firebase Client SDK**.
* Do **not** poll the database. Implement `onSnapshot` listeners to fetch data in real-time.
* Ensure the UI updates dynamically when the Pi (via Admin SDK) writes a new document.

### C. Dashboard Components
* **Live Status Card:** Display current "Radar" and "Sonometer" connectivity status.
* **Environmental Panel:** A line chart using `recharts` for the `telemetry_heartbeat` collection (last 24 hours).
* **Traffic Feed:** A scrollable list of the latest 10 documents from `traffic_events`, showing speed and classification.

## 5. Deployment Strategy
* All code must be hosted in the GitHub repository.
* Use the `gh-pages` package to automate deployment to GitHub Pages.
* **Important:** Configure your `.env` file to hold the `FIREBASE_CONFIG` object. Ensure `.env` is listed in `.gitignore`. For the GitHub Pages build, use **GitHub Secrets** to inject the environment variables during the build process (using GitHub Actions).

## 6. Handover Assets (You provide these to the Engineer)
1. **The JSON config snippet:** From the Firebase Console -> Project Settings -> General -> Your Apps (look for the `firebaseConfig` object).
2. **Project ID:** Found in Project Settings.
3. **Authorized Domain:** Ensure `[your-username].github.io` is added to the "Authorized Domains" list in Firebase Auth settings.

***

**Instruction to Engineer:** "We are deploying a low-maintenance, secure dashboard. The security relies on Firestore Rules, not client-side obfuscation. The app should be stateless and fetch real-time updates using `onSnapshot`. We are hosting via GitHub Pages, so all configuration must be handled via environment variables injected during the build."