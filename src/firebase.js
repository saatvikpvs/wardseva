// ============================================================
//  firebase.js — WardSeva Firebase Configuration
//
//  HOW TO SET UP (10 minutes):
//  1. Go to https://firebase.google.com and sign in
//  2. Click "Add project" → name it "wardseva" → create
//  3. In the project, click the </> (Web) icon to add a web app
//  4. Copy the firebaseConfig object and paste it below
//  5. In Firebase console:
//     - Go to Build → Firestore Database → Create database (test mode)
//     - Go to Build → Storage → Get started (test mode)
//     - Go to Build → Authentication → Get started → Phone (enable)
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// REPLACE THIS with your own config from Firebase console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app
