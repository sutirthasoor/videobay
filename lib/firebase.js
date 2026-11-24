import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Public identifiers; access is controlled by firestore.rules
const firebaseConfig = {
  apiKey: 'AIzaSyAzPBAEs9FarVo_PFg6f9plOid59v77VH0',
  authDomain: 'creator360-51a6c.firebaseapp.com',
  projectId: 'creator360-51a6c',
  storageBucket: 'creator360-51a6c.firebasestorage.app',
  messagingSenderId: '904458219423',
  appId: '1:904458219423:web:74172251f66e957cf017aa',
  measurementId: 'G-QP2Q9TJY86',
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
function createDb() { try { return initializeFirestore(app, { ignoreUndefinedProperties: true }); } catch { return getFirestore(app); } }
export const db = createDb();
export const auth = getAuth(app);
