"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/src/api/firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  username: string;
  loading: boolean;
  // Đăng ký - tạo tài khoản mới
  signUpWithGoogle: () => Promise<{ success: boolean; message: string }>;
  signUpWithGithub: () => Promise<{ success: boolean; message: string }>;
  // Đăng nhập - yêu cầu tài khoản đã tồn tại
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  loginWithGithub: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: "",
  loading: true,
  signUpWithGoogle: async () => ({ success: false, message: "" }),
  signUpWithGithub: async () => ({ success: false, message: "" }),
  loginWithGoogle: async () => ({ success: false, message: "" }),
  loginWithGithub: async () => ({ success: false, message: "" }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  // Kiểm tra xem user đã tồn tại trong Firestore chưa (theo email)
  const checkUserExists = async (email: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Tạo user mới trong Firestore
  const createUserInFirestore = async (currentUser: User) => {
    const userRef = doc(db, "users", currentUser.uid);
    const newUser = {
      uid: currentUser.uid,
      email: currentUser.email,
      username: currentUser.displayName || "User_" + currentUser.uid.slice(0, 5),
      avatar: currentUser.photoURL || "",
      role: "user",
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, newUser);
    setUsername(newUser.username);
  };

  // ===== ĐĂNG KÝ BẰNG GOOGLE =====
  const signUpWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản Google." };
      }

      // Kiểm tra xem email đã tồn tại chưa
      const exists = await checkUserExists(email);
      if (exists) {
        await signOut(auth);
        return { success: false, message: "Tài khoản này đã được đăng ký. Vui lòng đăng nhập." };
      }

      // Tạo user mới
      await createUserInFirestore(result.user);
      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" }; // User đóng popup, không hiện lỗi
      }
      console.error("Lỗi đăng ký Google:", error);
      return { success: false, message: "Lỗi đăng ký. Vui lòng thử lại." };
    }
  };

  // ===== ĐĂNG KÝ BẰNG GITHUB =====
  const signUpWithGithub = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản GitHub." };
      }

      // Kiểm tra xem email đã tồn tại chưa
      const exists = await checkUserExists(email);
      if (exists) {
        await signOut(auth);
        return { success: false, message: "Tài khoản này đã được đăng ký. Vui lòng đăng nhập." };
      }

      // Tạo user mới
      await createUserInFirestore(result.user);
      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      console.error("Lỗi đăng ký GitHub:", error);
      return { success: false, message: "Lỗi đăng ký. Vui lòng thử lại." };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG GOOGLE =====
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản Google." };
      }

      // Kiểm tra xem tài khoản đã tồn tại chưa
      const exists = await checkUserExists(email);
      if (!exists) {
        await signOut(auth);
        return { success: false, message: "Tài khoản chưa được đăng ký. Vui lòng đăng ký trước." };
      }

      // Lấy username từ Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUsername(userSnap.data().username);
      }

      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      console.error("Lỗi đăng nhập Google:", error);
      return { success: false, message: "Lỗi đăng nhập. Vui lòng thử lại." };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG GITHUB =====
  const loginWithGithub = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản GitHub." };
      }

      // Kiểm tra xem tài khoản đã tồn tại chưa
      const exists = await checkUserExists(email);
      if (!exists) {
        await signOut(auth);
        return { success: false, message: "Tài khoản chưa được đăng ký. Vui lòng đăng ký trước." };
      }

      // Lấy username từ Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUsername(userSnap.data().username);
      }

      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      console.error("Lỗi đăng nhập GitHub:", error);
      return { success: false, message: "Lỗi đăng nhập. Vui lòng thử lại." };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUsername(userSnap.data().username);
        }
      } else {
        setUsername("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        username, 
        loading, 
        signUpWithGoogle, 
        signUpWithGithub,
        loginWithGoogle,
        loginWithGithub 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
