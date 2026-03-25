// Firebase setup for WardSeva

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD5wqsR6eNQRB0JoyQsAmayxuBAGoCe2Qg",
  authDomain: "wardseva-b4465.firebaseapp.com",
  projectId: "wardseva-b4465",
  storageBucket: "wardseva-b4465.appspot.com",
  messagingSenderId: "75424989934",
  appId: "1:75424989934:web:f9443c1d5d116e31eee9ff",
  measurementId: "G-N8F5B492M2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;