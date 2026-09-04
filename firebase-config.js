import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqERoBlSxpk_FTVTepbyTQd6C2aT9vNts",
  authDomain: "dawamibps.firebaseapp.com",
  projectId: "dawamibps",
  storageBucket: "dawamibps.firebasestorage.app",
  messagingSenderId: "949392669004",
  appId: "1:949392669004:web:89b8c65e631662c6d2b7e9",
  measurementId: "G-ZMECR36J4S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
