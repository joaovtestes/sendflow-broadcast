import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsJrET_bwSwCmCig_zC4KV43Eu7PBwJTw",
  authDomain: "teste-broadcast-3bc5f.firebaseapp.com",
  projectId: "teste-broadcast-3bc5f",
  storageBucket: "teste-broadcast-3bc5f.firebasestorage.app",
  messagingSenderId: "656972761167",
  appId: "1:656972761167:web:6b26023ca1a789db28023a",
  measurementId: "G-DR7QHTTYQ6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
