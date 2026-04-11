import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const dummyConfig = {
  apiKey: "dummy",
  authDomain: "dummy.firebaseapp.com",
  projectId: "dummy",
  storageBucket: "dummy.appspot.com",
  messagingSenderId: "dummy",
  appId: "dummy",
};

const areKeysPresent = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "NA";

const app: FirebaseApp = initializeApp(areKeysPresent ? firebaseConfig : dummyConfig);

if (areKeysPresent) {
  console.log("Using real Firebase configuration.");
} else {
  console.warn(
    "Firebase environment variables are missing. Using dummy configuration. " +
      "Authentication and database features will not work."
  );
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

const initializeAnalytics = (firebaseApp: FirebaseApp): Analytics | null => {
  if (
    typeof window !== "undefined" &&
    areKeysPresent &&
    firebaseConfig.measurementId &&
    firebaseConfig.measurementId !== "G-NA"
  ) {
    try {
      return getAnalytics(firebaseApp);
    } catch (error) {
      console.warn("Firebase Analytics could not be initialized:", error);
      return null;
    }
  }

  return null;
};

export const analytics = initializeAnalytics(app);
