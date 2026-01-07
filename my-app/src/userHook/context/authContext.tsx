"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { auth, db } from "@/src/api/firebase/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  username: string;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: "",
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  // Hàm đồng bộ dữ liệu User vào Firestore collection "users"
  const syncUserToFirestore = async (currentUser: User) => {
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Nếu user chưa có trong DB (đăng ký lần đầu qua Google/Github)
      const newUser = {
        uid: currentUser.uid,
        email: currentUser.email,
        username:
          currentUser.displayName || "User_" + currentUser.uid.slice(0, 5),
        avatar: currentUser.photoURL || "",
        role: "user",
        createdAt: serverTimestamp(),
      };
      await setDoc(userRef, newUser);
      setUsername(newUser.username);
    } else {
      // Nếu đã có, lấy username ra
      setUsername(userSnap.data().username);
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Sử dụng redirect cho production (tránh COOP error trên Vercel)
      // Popup cho development (UX tốt hơn)
      if (process.env.NODE_ENV === 'production') {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        await syncUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      if (process.env.NODE_ENV === 'production') {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        await syncUserToFirestore(result.user);
      }
    } catch (error) {
      console.error("Lỗi đăng nhập Github:", error);
    }
  };

  useEffect(() => {
    // Xử lý kết quả redirect (cho production)
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          await syncUserToFirestore(result.user);
        }
      } catch (error) {
        console.error("Lỗi xử lý redirect:", error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Lấy username trực tiếp từ doc có ID là uid
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
      value={{ user, username, loading, signInWithGoogle, signInWithGithub }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
