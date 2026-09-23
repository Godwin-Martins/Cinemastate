// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGoxi6hXToYv7_WMV_6Qx0RJqGhDocDuw",
  authDomain: "alphaflix-7ee3c.firebaseapp.com",
  projectId: "alphaflix-7ee3c",
  storageBucket: "alphaflix-7ee3c.firebasestorage.app",
  messagingSenderId: "456242457783",
  appId: "1:456242457783:web:0af058554b75ff39e73132",
  measurementId: "G-SFZC2W8XCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);