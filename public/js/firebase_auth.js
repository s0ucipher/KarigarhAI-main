// Firebase Authentication Handler for Google Sign-In
// Safely loads Firebase config from backend to prevent hard-coding secrets

class FirebaseAuthService {
  constructor() {
    this.initialized = false;
    this.config = null;
    this.auth = null;
  }

  async loadConfig() {
    if (this.config) return this.config;
    try {
      this.config = await api.getFirebaseConfig();
      return this.config;
    } catch (err) {
      console.warn("Failed to load Firebase configuration:", err);
      return null;
    }
  }

  async init() {
    if (this.initialized) return true;

    const config = await this.loadConfig();
    if (!config || !config.is_configured) {
      return false;
    }

    if (typeof firebase === "undefined") {
      console.error("Firebase SDK not loaded");
      return false;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
          measurementId: config.measurementId
        });
      }
      this.auth = firebase.auth();
      this.initialized = true;
      return true;
    } catch (e) {
      console.error("Failed to initialize Firebase app:", e);
      return false;
    }
  }

  async signInWithGoogle() {
    const isReady = await this.init();

    if (!isReady) {
      const config = await this.loadConfig();
      if (!config || !config.is_configured) {
        throw new Error(
          "Google Sign-In is not configured yet. Please configure FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, and FIREBASE_PROJECT_ID in your environment variables (or Vercel Project Settings) and authorize your domain in Firebase Console."
        );
      }
      throw new Error("Unable to initialize Firebase authentication. Please verify your Firebase configuration.");
    }

    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await this.auth.signInWithPopup(provider);
      if (!result || !result.user) {
        throw new Error("No user returned from Google authentication.");
      }

      // Retrieve verified Firebase ID Token
      const idToken = await result.user.getIdToken(/* forceRefresh */ true);

      // Authenticate with existing FastAPI backend session system
      const authRes = await api.googleLogin(idToken);
      return authRes;
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user") {
        throw new Error("Google Sign-In cancelled: Popup was closed before completion.");
      } else if (err.code === "auth/cancelled-popup-request") {
        throw new Error("Only one popup request is allowed at a time.");
      } else if (err.code === "auth/popup-blocked") {
        throw new Error("Sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (err.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname || "your domain";
        throw new Error(`Domain '${currentDomain}' is not authorized in Firebase. Add '${currentDomain}' in Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
      } else if (err.code === "auth/operation-not-allowed") {
        throw new Error("Google provider is not enabled in Firebase. Please enable Google in Firebase Console -> Authentication -> Sign-in method.");
      } else if (err.code === "auth/network-request-failed") {
        throw new Error("Network connection error during Google sign-in. Please check your internet connection.");
      } else if (err.code === "auth/invalid-api-key" || err.code === "auth/api-key-not-valid") {
        throw new Error("Invalid Firebase API Key. Please verify FIREBASE_API_KEY in your environment variables.");
      } else if (err.code === "auth/configuration-not-found") {
        throw new Error("Firebase Authentication configuration not found. Please check your Firebase project setup.");
      }
      throw err;
    }
  }
}

window.firebaseAuth = new FirebaseAuthService();
