# WardSeva — React + Firebase Setup Guide

## Step 1 — Install dependencies

Open terminal, go to this folder, run:
```
npm install
```

---

## Step 2 — Set up Firebase (10 minutes, free)

1. Go to https://firebase.google.com and sign in with Google
2. Click "Add project" → name it **wardseva** → Continue → Create project
3. In the project dashboard, click the **</>** (Web) icon
4. Register app with name "wardseva" → Copy the firebaseConfig

5. Open `src/firebase.js` and replace the placeholder values:
```js
const firebaseConfig = {
  apiKey: "paste your apiKey here",
  authDomain: "paste your authDomain here",
  projectId: "paste your projectId here",
  storageBucket: "paste your storageBucket here",
  messagingSenderId: "paste your messagingSenderId here",
  appId: "paste your appId here"
}
```

6. In Firebase console, enable these 3 services:
   - **Firestore Database** → Build → Firestore → Create database → Start in test mode
   - **Storage** → Build → Storage → Get started → Test mode
   - **Authentication** → Build → Authentication → Get started → Sign-in method → Phone → Enable

---

## Step 3 — Run the app

```
npm run dev
```

Open http://localhost:5173 in your browser. Done!

---

## Step 4 — Make yourself admin

After registering once in the app:
1. Go to Firebase console → Firestore → users collection
2. Find your user document
3. Add field: `isAdmin` = `true`
4. Now you can access /admin

---

## How the real-time works

When someone submits a complaint → it saves to Firestore
Ward dashboard has `onSnapshot` listener → it fires automatically when new data arrives
No page refresh needed — the dashboard updates live

---

## File structure

```
src/
├── firebase.js          ← your Firebase config (EDIT THIS)
├── App.jsx              ← routing
├── main.jsx             ← entry point
├── index.css            ← all styles
├── hooks/
│   └── useAuth.jsx      ← login state management
├── components/
│   ├── Topbar.jsx       ← navigation bar
│   └── ComplaintCard.jsx ← reusable complaint row
└── pages/
    ├── Home.jsx         ← landing page
    ├── Login.jsx        ← phone OTP login
    ├── Register.jsx     ← ward registration
    ├── Report.jsx       ← submit complaint (GPS + photo)
    ├── WardDashboard.jsx ← live ward complaints
    ├── Community.jsx    ← ward posts
    └── Admin.jsx        ← GVMC admin panel
```

---

## What actually works

| Feature | Status |
|---------|--------|
| Phone OTP login | ✅ Firebase Auth |
| Register with ward | ✅ Saves to Firestore |
| GPS location | ✅ Browser geolocation + OpenStreetMap |
| Photo upload | ✅ Firebase Storage |
| Submit complaint | ✅ Saves to Firestore |
| Live dashboard update | ✅ onSnapshot real-time |
| Support a complaint | ✅ Updates Firestore instantly |
| Admin mark resolved | ✅ Updates status + repair photo |
| Citizen confirm fix | ✅ Reopen if denied |
| Bad governance flag | ✅ Auto-detects 10+ open complaints |
| 60-day escalation | ✅ Auto-flags in UI |
| Community posts | ✅ Real-time Firestore |
