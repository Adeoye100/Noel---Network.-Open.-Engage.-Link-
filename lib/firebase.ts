// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getDatabase, type Database } from "firebase/database"

const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
const isValidDatabaseURL = databaseURL && databaseURL.trim() !== "" && databaseURL.includes("firebaseio.com")

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(isValidDatabaseURL && { databaseURL }),
}

// Initialize Firebase (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getFirestore(app)

let rtdb: Database | null = null
if (isValidDatabaseURL) {
  try {
    rtdb = getDatabase(app)
    console.log("[Firebase] Realtime Database initialized successfully")
  } catch (error) {
    console.error("[Firebase] Failed to initialize Realtime Database:", error)
  }
} else {
  console.warn(
    "[Firebase] Realtime Database URL not configured or invalid.",
    "\nExpected format: https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com",
    "\nPlease set NEXT_PUBLIC_FIREBASE_DATABASE_URL in the Vars section of the sidebar.",
  )
}

export { app, auth, db, rtdb }
