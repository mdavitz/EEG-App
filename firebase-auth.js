import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhMhYzo2G0Efvj7zM0rwjJbEN4nIWZEgQ",
  authDomain: "eeg-app-6968e.firebaseapp.com",
  projectId: "eeg-app-6968e",
  storageBucket: "eeg-app-6968e.firebasestorage.app",
  messagingSenderId: "322977550023",
  appId: "1:322977550023:web:9f91e6ffd07d31c80578e2"
};

// Initialize Firebase and Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence to LOCAL - this will keep the user signed in even when they close the browser
// until they explicitly sign out or clear their browser data
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("Auth persistence set to local"))
  .catch((error) => console.error("Persistence error:", error));

// Define your required access code for new sign‑ups
const REQUIRED_ACCESS_CODE = "mountsinai";

// Sign up function (includes access code check)
export function signUp(email, password, accessCode, fullName, trainingLevel, profileIcon) {
  if (accessCode.trim().toLowerCase() !== REQUIRED_ACCESS_CODE) {
    return Promise.reject(new Error("Invalid access code."));
  }
  return createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: fullName,
        photoURL: profileIcon || null
      });
      
      // Store additional user data in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: email,
        fullName: fullName,
        trainingLevel: trainingLevel,
        profileIcon: profileIcon || null,
        createdAt: new Date()
      });
      
      return userCredential;
    });
}

// Login function
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Google sign-in function
export function signInWithGoogle(accessCode) {
  // We'll verify the access code on the client side before attempting Google sign-in
  if (accessCode && accessCode.trim().toLowerCase() !== REQUIRED_ACCESS_CODE) {
    return Promise.reject(new Error("Invalid access code."));
  }
  
  return signInWithPopup(auth, googleProvider)
    .then(async (result) => {
      const user = result.user;
      
      // Check if this is a new user (first-time sign in)
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // This is a new user, need to check the access code (already verified above) and save user data
        return {
          user,
          isNewUser: true
        };
      } else {
        // Existing user, return the user data
        return {
          user,
          isNewUser: false,
          userData: userDoc.data()
        };
      }
    });
}

// Function to save additional user data for Google sign-in
export function saveGoogleUserData(userId, fullName, trainingLevel, profileIcon) {
  return setDoc(doc(db, "users", userId), {
    fullName: fullName,
    trainingLevel: trainingLevel,
    profileIcon: profileIcon || null,
    email: auth.currentUser.email,
    createdAt: new Date()
  });
}

// Get user data
export async function getUserData(userId) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return null;
  }
}

// Password reset function
export function sendPasswordResetEmail(email) {
  return firebaseSendPasswordResetEmail(auth, email);
}

// Sign out function
export function signOut() {
  return firebaseSignOut(auth);
}

// Export an auth state observer
export function onAuthStateChanged(callback) {
  return firebaseOnAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}