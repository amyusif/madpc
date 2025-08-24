// Client-side Firebase initialization using your provided config
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDDDh5ZcMSzKVih3WyzUTviFvDqLSs3bhA",
  authDomain: "manso-adubia.firebaseapp.com",
  projectId: "manso-adubia",
  storageBucket: "manso-adubia.firebasestorage.app",
  messagingSenderId: "469498556886",
  appId: "1:469498556886:web:91b09b28e4cb8de2c2f477",
  measurementId: "G-CGSDELKK53",
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only in browser and when supported
export const analyticsPromise = typeof window !== 'undefined'
  ? analyticsSupported().then((ok) => (ok ? getAnalytics(app) : null))
  : Promise.resolve(null);

export const auth = getAuth(app);
export const storage = getStorage(app);

