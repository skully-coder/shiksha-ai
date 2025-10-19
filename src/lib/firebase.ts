
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        auth = getAuth(app);
        if (process.env.NEXT_PUBLIC_FIRESTORE_FORCE_LONGPOLL === 'true') {
            try {
                initializeFirestore(app, {
                    experimentalForceLongPolling: true,
                });
            } catch {}
        } else if (process.env.NEXT_PUBLIC_FIRESTORE_LONGPOLL === 'true') {
            try {
                initializeFirestore(app, {
                    experimentalAutoDetectLongPolling: true,
                });
            } catch {}
        }
        db = getFirestore(app);
        storage = getStorage(app);
    } catch (e) {
        console.error("Could not initialize Firebase. Please check your .env file.", e);
    }
}

export { auth, db, storage };
