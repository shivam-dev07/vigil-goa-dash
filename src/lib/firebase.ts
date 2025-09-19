import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyASBV1HuSX10cdZJ2GYr6PimsYgYyZwuLg",
  authDomain: "goapolicefirebase.firebaseapp.com",
  projectId: "goapolicefirebase",
  storageBucket: "goapolicefirebase.appspot.com", // usually "<project-id>.appspot.com"
  messagingSenderId: "892230117968",
  appId: "1:892230117968:web:6ec95fcf92e2a46496ff55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;