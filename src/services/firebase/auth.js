import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from './index';

// Đăng ký người dùng mới
export async function signUpWithEmail(email, password, displayName) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(userCredential.user, { displayName });
    
    // Initialize user data in the database
    await set(ref(database, `users/${userCredential.user.uid}`), {
      email,
      displayName,
      createdAt: new Date().toISOString(),
      settings: {
        darkMode: true,
        notifications: true
      }
    });
    
    return userCredential.user;
  } catch (error) {
    console.error("Error during signup:", error);
    throw error;
  }
}

// Đăng nhập với email và password
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

// Đăng nhập với Google
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, provider);
    
    // Check if user exists in database
    const userRef = ref(database, `users/${result.user.uid}`);
    const snapshot = await get(userRef);
    
    // If user doesn't exist, create a new user record
    if (!snapshot.exists()) {
      await set(userRef, {
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date().toISOString(),
        settings: {
          darkMode: true,
          notifications: true
        }
      });
    }
    
    return result.user;
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
}

// Đăng xuất
export async function logout() {
  return signOut(auth);
}
