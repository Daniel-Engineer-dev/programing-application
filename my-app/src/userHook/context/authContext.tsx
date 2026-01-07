"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
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
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
    } catch (error: unknown) {
      // Bỏ qua lỗi popup bị đóng bởi user
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return;
      }
      console.error("Lỗi đăng nhập Google:", error);
    }
  };

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
    } catch (error: unknown) {
      // Bỏ qua lỗi popup bị đóng bởi user
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return;
      }
      console.error("Lỗi đăng nhập Github:", error);
    }
  };

  useEffect(() => {
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
