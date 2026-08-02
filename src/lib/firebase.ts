import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// TODO: replace with your Firebase project's web config (Project settings > General > Your apps).
// This is a public client identifier, not a secret — access control is enforced by Firestore
// security rules (see firestore.rules), not by hiding this config.
const firebaseConfig = {
  apiKey: "AIzaSyAiPuDZBxhpn39Yu6xwQheG9FCgT5R7lZI",
  authDomain: "snakydesigns.firebaseapp.com",
  projectId: "snakydesigns",
  storageBucket: "snakydesigns.firebasestorage.app",
  messagingSenderId: "963848846068",
  appId: "1:963848846068:web:ee24b791d639e521b8bca1",
  measurementId: "G-2X62M39ER5",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  ignoreUndefinedProperties: true,
});

export function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("requireUid() called with no authenticated user");
  return uid;
}
