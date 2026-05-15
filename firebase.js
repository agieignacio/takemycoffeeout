import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAwnOhSTUOSucEaYA4qC4eoLDxPNPapJW4",
  authDomain: "takemycoffeeout-5844e.firebaseapp.com",
  projectId: "takemycoffeeout-5844e",
  storageBucket: "takemycoffeeout-5844e.firebasestorage.app",
  messagingSenderId: "704754989721",
  appId: "1:704754989721:web:763ca6ac2191e9b1f5d608"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);