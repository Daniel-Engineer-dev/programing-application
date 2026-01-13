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
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

interface AuthContextType {
  user: User | null;
  username: string;
  role: string | null;
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
  role: null,
  loading: true,
  signUpWithGoogle: async () => ({ success: false, message: "" }),
  signUpWithGithub: async () => ({ success: false, message: "" }),
  loginWithGoogle: async () => ({ success: false, message: "" }),
  loginWithGithub: async () => ({ success: false, message: "" }),
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Kiểm tra xem user đã tồn tại trong Firestore chưa (theo email)
  const checkUserExists = async (email: string): Promise<boolean> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  // Tạo user mới trong Firestore
  const createUserInFirestore = async (currentUser: User, email: string) => {
    let baseName = "";
    
    // Ưu tiên 1: GitHub username (screenName) - có trong reloadUserInfo (undocumented prop)
    const screenName = (currentUser as any).reloadUserInfo?.screenName;
    
    // Ưu tiên 2: Email prefix
    const emailPrefix = email ? email.split('@')[0] : "";

    if (screenName) {
        baseName = screenName;
    } else if (emailPrefix) {
        baseName = emailPrefix;
    } else {
        baseName = currentUser.displayName?.replace(/\s+/g, '') || "User_" + currentUser.uid.slice(0, 5);
    }

    // Sanitize: Chỉ giữ lại chữ, số, gạch dưới, gạch ngang
    baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, "");
    if (baseName.length < 3) baseName = baseName + "_user";

    // Kiểm tra trùng lặp username
    let finalUsername = baseName;
    const usersRef = collection(db, "users");
    
    // Kiểm tra lần 1
    const q1 = query(usersRef, where("username", "==", finalUsername), limit(1));
    const snap1 = await getDocs(q1);

    if (!snap1.empty) {
        // Nếu trùng, thêm suffix random 4 số
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
        finalUsername = `${baseName}_${randomSuffix}`;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const newUser = {
      uid: currentUser.uid,
      email: email, // Sử dụng email được truyền vào (đã verify)
      username: finalUsername,
      avatar: currentUser.photoURL || "",
      role: "user",
      createdAt: serverTimestamp(),
    };
    await setDoc(userRef, newUser);
    
    // Cập nhật luôn displayName cho Firebase Auth User để đồng bộ
    try {
        await updateProfile(currentUser, { displayName: finalUsername });
    } catch (e) {
        console.error("Lỗi cập nhật profile:", e);
    }
    
    setUsername(newUser.username);
    setRole(newUser.role);
  };

  // ===== ĐĂNG KÝ BẰNG GOOGLE =====
  const signUpWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      const result = await signInWithPopup(auth, provider);
      
      let email = result.user.email;
      
      // Fallback: Check providerData if main email is null
      if (!email && result.user.providerData.length > 0) {
         const profile = result.user.providerData.find(p => p.email);
         if (profile) email = profile.email;
      }

      if (!email) {
        // Force refresh user to get email if initially missing
        await result.user.reload();
        email = auth.currentUser?.email || null;
      }

      if (!email) {
        await signOut(auth);
        console.log("Full User Object:", result.user); // Debug info for user
        return { success: false, message: "Không thể lấy email từ Google. (Email is null/hidden). Vui lòng thử lại." };
      }

      // Kiểm tra xem email đã tồn tại chưa
      const exists = await checkUserExists(email);
      if (exists) {
        await signOut(auth);
        return { success: false, message: "Tài khoản này đã được đăng ký. Vui lòng đăng nhập." };
      }

      // Tạo user mới
      await createUserInFirestore(result.user, email);
      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" }; // User đóng popup, không hiện lỗi
      }
      console.error("Lỗi đăng ký Google:", error);
      return { success: false, message: `Lỗi: ${(error as any).message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG KÝ BẰNG GITHUB =====
  const signUpWithGithub = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    try {
      const result = await signInWithPopup(auth, provider);
      
      // GitHub sometimes returns null email even with scope if email is private
      // But Firebase usually handles this if 'user:email' scope is present
      let email = result.user.email;

      // Fallback: Check providerData if main email is null
      if (!email && result.user.providerData.length > 0) {
         const profile = result.user.providerData.find(p => p.providerId === 'github.com' && p.email);
         if (profile) email = profile.email;
      }

      if (!email) {
        // Force refresh user to get email if initially missing
        await result.user.reload();
        email = auth.currentUser?.email || null;
      }

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản GitHub. Hãy đảm bảo email của bạn là công khai hoặc cấp quyền truy cập." };
      }

      // Kiểm tra xem email đã tồn tại chưa
      const exists = await checkUserExists(email);
      if (exists) {
        await signOut(auth);
        return { success: false, message: "Tài khoản này đã được đăng ký. Vui lòng đăng nhập." };
      }

      // Tạo user mới
      await createUserInFirestore(result.user, email);
      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      console.error("Lỗi đăng ký GitHub:", error);
      return { success: false, message: `Lỗi: ${(error as any).message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG GOOGLE =====
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      const result = await signInWithPopup(auth, provider);
      let email = result.user.email;

       // Fallback: Check providerData if main email is null
      if (!email && result.user.providerData.length > 0) {
         const profile = result.user.providerData.find(p => p.email);
         if (profile) email = profile.email;
      }

      if (!email) {
         await result.user.reload();
         email = auth.currentUser?.email || null;
      }

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản Google." };
      }

      // Kiểm tra xem tài khoản đã tồn tại chưa
      const exists = await checkUserExists(email);
      
      if (!exists) {
        // TỰ ĐỘNG ĐĂNG KÝ MỚI nếu chưa có tài khoản
        await createUserInFirestore(result.user, email);
        return { success: true, message: "Đăng nhập (Link tài khoản mới) thành công!" };
      }

      // Lấy username từ Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUsername(data.username);
        setRole(data.role || "user");
      }

      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      console.error("Lỗi đăng nhập Google:", error);
      return { success: false, message: `Lỗi: ${(error as any).message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG GITHUB =====
  const loginWithGithub = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    try {
      const result = await signInWithPopup(auth, provider);
      let email = result.user.email;

      // Fallback: Check providerData if main email is null
      if (!email && result.user.providerData.length > 0) {
         const profile = result.user.providerData.find(p => p.providerId === 'github.com' && p.email);
         if (profile) email = profile.email;
      }

      if (!email) {
        // Force refresh user to get email if initially missing
        await result.user.reload();
        email = auth.currentUser?.email || null;
      }

      if (!email) {
        await signOut(auth);
        return { success: false, message: "Không thể lấy email từ tài khoản GitHub." };
      }

      // Kiểm tra xem tài khoản đã tồn tại chưa
      const exists = await checkUserExists(email);
      
      if (!exists) {
        // TỰ ĐỘNG ĐĂNG KÝ mới nếu chưa có tài khoản
        await createUserInFirestore(result.user, email);
        return { success: true, message: "Đăng nhập (Link tài khoản mới) thành công!" };
      }

      // Lấy username từ Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUsername(data.username);
        setRole(data.role || "user");
      }

      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: unknown) {
      if (error instanceof Error && error.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      console.error("Lỗi đăng nhập GitHub:", error);
      return { success: false, message: `Lỗi: ${(error as any).message || "Unknown error"}` };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setUsername(data.username);
          setRole(data.role || "user");
        }
      } else {
        setUsername("");
        setRole(null);
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
        role,
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
