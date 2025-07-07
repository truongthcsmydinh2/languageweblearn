import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  User
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';

// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDl_NoFiRppLXDJvQspN9CsC2b1j1uDYYI",
  authDomain: "my-app-8e5dc.firebaseapp.com",
  databaseURL: "https://my-app-8e5dc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-app-8e5dc",
  storageBucket: "my-app-8e5dc.firebasestorage.app",
  messagingSenderId: "489438208829",
  appId: "1:489438208829:web:0a0f4b18b645a468249b54",
  measurementId: "G-DQK0D6KR8S"
};

// Khởi tạo Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Khởi tạo các services
export const auth = getAuth(app);
export const database = getDatabase(app);
export { database as db };

// Khởi tạo Analytics (chỉ ở client)
export const initAnalytics = () => {
  if (typeof window !== 'undefined') {
    return getAnalytics(app);
  }
  return null;
};

// Các hàm xác thực
export const signUpWithEmail = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    await saveUserToDatabase(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error during signup:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await saveUserToDatabase(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    await saveUserToDatabase(result.user);
    return result.user;
  } catch (error) {
    console.error("Error during Google login:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

export {
  app,
  onAuthStateChanged,
  logoutUser as logout
};

// Hàm lưu thông tin user vào MySQL
async function saveUserToDatabase(user: User) {
  try {
    const response = await fetch('/api/user/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebaseUid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save user data');
    }

    const data = await response.json();
  } catch (error) {
    console.error('Error saving user data:', error);
    // Không throw error ở đây để không ảnh hưởng đến luồng xác thực
  }
}

export default app;