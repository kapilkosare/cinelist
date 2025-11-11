'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch((error) => {
    // Even though we don't 'await', we can still catch errors
    // to prevent unhandled promise rejections in the console.
    console.error("Anonymous sign-in error:", error);
    // Optionally, re-throw or handle it globally
    throw error;
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  return createUserWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      // Success is handled by onAuthStateChanged, so we do nothing here.
    })
    .catch((error) => {
      // The promise is rejected. We re-throw the error so the calling
      // function's try/catch block can handle it and update the UI.
      throw error;
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(authInstance, email, password)
    .then(() => {
      // Success is handled by onAuthStateChanged.
    })
    .catch((error) => {
      // Re-throw for UI handling.
      throw error;
    });
}
