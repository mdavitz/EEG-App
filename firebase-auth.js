// Firebase Authentication Module
// This file provides authentication functionality using Firebase

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhMhYzo2G0Efvj7zM0rwjJbEN4nIWZEgQ",
  authDomain: "eeg-app-6968e.firebaseapp.com",
  projectId: "eeg-app-6968e",
  storageBucket: "eeg-app-6968e.firebasestorage.app",
  messagingSenderId: "322977550023",
  appId: "1:322977550023:web:9f91e6ffd07d31c80578e2"
};

// Wait for Firebase SDK to load
function initFirebase() {
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  const auth = firebase.auth();
  const db = firebase.firestore();
  const googleProvider = new firebase.auth.GoogleAuthProvider();

  console.log("Firebase initialized");

  // Set persistence to LOCAL - explicitly set this to ensure it works across browsers
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
      console.log("Auth persistence set to local");
      
      // Check for existing auth state after setting persistence
      auth.onAuthStateChanged(function(user) {
        if (user) {
          console.log("User is signed in:", user.email);
          // Update UI for logged-in user
          updateUserUI(user);
        } else {
          console.log("No user is signed in");
          // Update UI for logged-out state
          updateLoggedOutUI();
        }
      });
    })
    .catch((error) => console.error("Persistence error:", error));

  // Required access code for new sign-ups
  const REQUIRED_ACCESS_CODE = "mountsinai";

  // Helper function to update UI for logged-in user
  function updateUserUI(user) {
    const userProfileDiv = document.getElementById('user-profile');
    const loginBtn = document.getElementById('header-login-btn');
    
    if (userProfileDiv) {
      const emailSpan = document.getElementById('user-email');
      if (emailSpan) {
        emailSpan.textContent = user.email;
      }
      userProfileDiv.style.display = 'flex';
    }
    
    if (loginBtn) {
      loginBtn.style.display = 'none';
    }
    
    // Update protected routes if function exists
    if (typeof updateProtectedRoutes === 'function') {
      updateProtectedRoutes(true);
    }
  }
  
  // Helper function to update UI for logged-out state
  function updateLoggedOutUI() {
    const userProfileDiv = document.getElementById('user-profile');
    const loginBtn = document.getElementById('header-login-btn');
    
    if (userProfileDiv) {
      userProfileDiv.style.display = 'none';
    }
    
    if (loginBtn) {
      loginBtn.style.display = 'block';
    }
    
    // Update protected routes if function exists
    if (typeof updateProtectedRoutes === 'function') {
      updateProtectedRoutes(false);
    }
  }

  // Sign up function (includes access code check)
  window.signUp = function(email, password, accessCode, fullName, trainingLevel, profileIcon = null) {
    if (accessCode.trim().toLowerCase() !== REQUIRED_ACCESS_CODE) {
      return Promise.reject(new Error("Invalid access code."));
    }
    
    return auth.createUserWithEmailAndPassword(email, password)
      .then(async (userCredential) => {
        // Update the user's display name
        await userCredential.user.updateProfile({
          displayName: fullName,
          photoURL: profileIcon || null
        });
        
        // Store additional user data in Firestore
        await db.collection("users").doc(userCredential.user.uid).set({
          email: email,
          fullName: fullName,
          trainingLevel: trainingLevel,
          profileIcon: profileIcon || null,
          createdAt: new Date()
        });
        
        return userCredential;
      });
  };

  // Login function
  window.login = function(email, password) {
    return auth.signInWithEmailAndPassword(email, password);
  };

  // Google sign-in function
  window.signInWithGoogle = function(accessCode) {
    // For login, we don't need to verify access code
    if (accessCode && accessCode.trim().toLowerCase() !== REQUIRED_ACCESS_CODE) {
      return Promise.reject(new Error("Invalid access code."));
    }
    
    return auth.signInWithPopup(googleProvider)
      .then(async (result) => {
        const user = result.user;
        
        // Check if this is a new user
        const userDoc = await db.collection("users").doc(user.uid).get();
        
        if (!userDoc.exists) {
          // This is a new user
          return {
            user,
            isNewUser: true
          };
        } else {
          // Existing user
          return {
            user,
            isNewUser: false,
            userData: userDoc.data()
          };
        }
      });
  };

  // Function to save additional user data for Google sign-in
  window.saveGoogleUserData = function(userId, fullName, trainingLevel, profileIcon = null) {
    return db.collection("users").doc(userId).set({
      fullName: fullName,
      trainingLevel: trainingLevel,
      profileIcon: profileIcon || null,
      email: auth.currentUser.email,
      createdAt: new Date()
    });
  };

  // Get user data
  window.getUserData = async function(userId) {
    const docRef = db.collection("users").doc(userId);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return docSnap.data();
    } else {
      return null;
    }
  };

  // Password reset function
  window.sendPasswordResetEmail = function(email) {
    return auth.sendPasswordResetEmail(email);
  };

  // Sign out function
  window.signOut = function() {
    return auth.signOut();
  };

  // Add auth state observer
  window.onAuthStateChanged = function(callback) {
    return auth.onAuthStateChanged(callback);
  };

  // Get current user
  window.getCurrentUser = function() {
    return auth.currentUser;
  };

  // Check if user is authenticated
  window.isAuthenticated = function() {
    return auth.currentUser !== null;
  };

  // Notify that Firebase is ready
  const event = new Event('firebase-ready');
  document.dispatchEvent(event);
}

// Initialize Firebase when the scripts are loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we need to load Firebase SDK
  if (typeof firebase === 'undefined') {
    console.log("Firebase SDK not found, loading from CDN...");
    
    // Load Firebase SDK from CDN
    const firebaseAppScript = document.createElement('script');
    firebaseAppScript.src = 'https://www.gstatic.com/firebasejs/9.17.2/firebase-app-compat.js';
    firebaseAppScript.onload = function() {
      console.log("Firebase App loaded");
      
      // Load Auth SDK
      const firebaseAuthScript = document.createElement('script');
      firebaseAuthScript.src = 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth-compat.js';
      document.head.appendChild(firebaseAuthScript);
      
      // Load Firestore SDK
      const firestoreScript = document.createElement('script');
      firestoreScript.src = 'https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore-compat.js';
      document.head.appendChild(firestoreScript);
      
      // Wait for all Firebase SDKs to load
      const checkFirebaseLoaded = setInterval(function() {
        if (typeof firebase !== 'undefined' && 
            typeof firebase.auth !== 'undefined' && 
            typeof firebase.firestore !== 'undefined') {
          clearInterval(checkFirebaseLoaded);
          console.log("All Firebase SDKs loaded");
          initFirebase();
        }
      }, 100);
    };
    
    document.head.appendChild(firebaseAppScript);
  } else {
    // Firebase already loaded
    console.log("Firebase SDK already available");
    initFirebase();
  }
});