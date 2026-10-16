import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDZgtJOfm1w69GYuI1j1h4qNyZrV6TH_vw",
  authDomain: "vybe-manager.firebaseapp.com",
  projectId: "vybe-manager",
  storageBucket: "vybe-manager.firebasestorage.app",
  messagingSenderId: "755939041500",
  appId: "1:755939041500:web:b5edce151a57eb23cb1419",
  measurementId: "G-XZM0HGGSC1",
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore database
export const db = getFirestore(app);

// Initialize Auth with platform-safe persistence
let authInstance: any;

if (Platform.OS === "web") {
  authInstance = getAuth(app);
} else {
  // @ts-ignore
  const { getReactNativePersistence } = require("firebase/auth");
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = authInstance;

// Google Authentication Provider setup
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { app };
  