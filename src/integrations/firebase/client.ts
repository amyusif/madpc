import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export function getFirebaseApp() {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      throw new Error("Firebase config is missing. Please set NEXT_PUBLIC_FIREBASE_* envs.");
    }
    initializeApp(firebaseConfig);
  }
  return getApps()[0]!;
}

export function getDb() {
  const app = getFirebaseApp();
  return getFirestore(app);
}

