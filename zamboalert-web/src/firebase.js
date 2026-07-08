import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Add these imports for Auth and Firestore (Database)
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAx5V8eT8FoZmUKG9s9MtWSm58xCQz2imQ",
  authDomain: "zamboalertapp.firebaseapp.com",
  projectId: "zamboalertapp",
  storageBucket: "zamboalertapp.firebasestorage.app",
  messagingSenderId: "612474003737",
  appId: "1:612474003737:web:99904b02cfbfd7a0b0a588",
  measurementId: "G-118EQ4NFY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize services and export them
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;