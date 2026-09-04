// firebase-config.js

import { initializeApp } from
"https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";

import { getFirestore } from
"https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

import { getAuth } from
"https://www.gstatic.com/firebasejs/9.17.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "ضع_API_KEY_هنا",
    authDomain: "ضع_AUTH_DOMAIN_هنا",
    projectId: "ضع_PROJECT_ID_هنا",
    storageBucket: "ضع_STORAGE_BUCKET_هنا",
    messagingSenderId: "ضع_MESSAGING_SENDER_ID_هنا",
    appId: "ضع_APP_ID_هنا"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
