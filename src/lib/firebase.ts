import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD0O2UpaITkdZDJW-Fq0pW59b2uetlhF94",
  authDomain: "fir-demo-3cec5.firebaseapp.com",
  projectId: "fir-demo-3cec5",
  storageBucket: "fir-demo-3cec5.firebasestorage.app",
  messagingSenderId: "1069490435765",
  appId: "1:1069490435765:web:2d8806ed37ccc4d74170fc",
  measurementId: "G-C526R684HQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;