import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBJpQgREy8mBc56WbnifhNZnHM7XBUhn5E",
    authDomain: "foodbridge-dae8f.firebaseapp.com",
    projectId: "foodbridge-dae8f",
    storageBucket: "foodbridge-dae8f.firebasestorage.app",
    messagingSenderId: "321938618527",
    appId: "1:321938618527:web:11b36d0f0f3fe57d76caaa",
    measurementId: "G-FKD7X3NWJW"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
