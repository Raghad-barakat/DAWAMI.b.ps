// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

// استبدل هذه البيانات ببيانات مشروعك DAWAMIbps من لوحة تحكم Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "dawamibps.firebaseapp.com",
  projectId: "dawamibps",
  storageBucket: "dawamibps.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
