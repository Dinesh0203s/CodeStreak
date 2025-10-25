import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDb2waMJHBqki3xisNwMxKhye9Wi5Z6fE0",
  authDomain: "pinmypic-18139.firebaseapp.com",
  databaseURL: "https://pinmypic-18139-default-rtdb.firebaseio.com",
  projectId: "pinmypic-18139",
  storageBucket: "pinmypic-18139.firebasestorage.app",
  messagingSenderId: "321854131282",
  appId: "1:321854131282:web:375ac1eb1dee7e32ece38b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
