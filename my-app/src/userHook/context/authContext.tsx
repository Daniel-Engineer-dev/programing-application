"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  fetchSignInMethodsForEmail,
  deleteUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
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
  signUpWithEmailPassword: (email: string, password: string, username: string) => Promise<{ success: boolean; message: string }>;
  // Đăng nhập - yêu cầu tài khoản đã tồn tại
  loginWithGoogle: () => Promise<{ success: boolean; message: string }>;
  loginWithGithub: () => Promise<{ success: boolean; message: string }>;
  loginWithEmailPassword: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  username: "",
  role: null,
  loading: true,
  signUpWithGoogle: async () => ({ success: false, message: "" }),
  signUpWithGithub: async () => ({ success: false, message: "" }),
  signUpWithEmailPassword: async () => ({ success: false, message: "" }),
  loginWithGoogle: async () => ({ success: false, message: "" }),
  loginWithGithub: async () => ({ success: false, message: "" }),
  loginWithEmailPassword: async () => ({ success: false, message: "" }),
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

  // Lấy thông tin provider đã đăng ký của email
  const getUserProvider = async (email: string): Promise<string | null> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    const userData = querySnapshot.docs[0].data();
    const provider = userData.provider || "password";
    
    switch (provider) {
      case "google.com":
        return "Google";
      case "github.com":
        return "GitHub";
      case "password":
        return "Email/Mật khẩu";
      default:
        return provider;
    }
  };

  // Lấy tên hiển thị của phương thức đăng nhập
  const getProviderName = (providerId: string): string => {
    switch (providerId) {
      case 'google.com':
        return 'Google';
      case 'github.com':
        return 'GitHub';
      case 'password':
        return 'Email/Mật khẩu';
      default:
        return providerId;
    }
  };

  // Lấy danh sách phương thức đăng nhập của email
  const getSignInMethodsMessage = async (email: string, currentProvider?: string): Promise<string> => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        const methodNames = methods.map(m => getProviderName(m));
        return `Email này đã được đăng ký bằng: ${methodNames.join(", ")}. Vui lòng đăng nhập bằng phương thức đó.`;
      }
      // Fallback: nếu không tìm thấy methods nhưng có currentProvider
      if (currentProvider) {
        const otherProviders = currentProvider === 'google.com' 
          ? 'GitHub hoặc Email/Mật khẩu' 
          : currentProvider === 'github.com' 
            ? 'Google hoặc Email/Mật khẩu'
            : 'Google hoặc GitHub';
        return `Email này đã được đăng ký với phương thức khác (${otherProviders}). Vui lòng đăng nhập bằng phương thức ban đầu.`;
      }
      return "Email này đã được đăng ký với phương thức khác. Vui lòng đăng nhập bằng phương thức ban đầu.";
    } catch {
      // Fallback khi có lỗi
      if (currentProvider) {
        const otherProviders = currentProvider === 'google.com' 
          ? 'GitHub hoặc Email/Mật khẩu' 
          : currentProvider === 'github.com' 
            ? 'Google hoặc Email/Mật khẩu'
            : 'Google hoặc GitHub';
        return `Email này đã được đăng ký với phương thức khác (${otherProviders}). Vui lòng đăng nhập bằng phương thức ban đầu.`;
      }
      return "Email này đã được đăng ký với phương thức khác. Vui lòng đăng nhập bằng phương thức ban đầu.";
    }
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
    
    // Xác định provider từ providerData
    let provider = "password";
    if (currentUser.providerData.length > 0) {
      provider = currentUser.providerData[0].providerId; // google.com, github.com, password
    }
    
    const newUser = {
      uid: currentUser.uid,
      email: email, // Sử dụng email được truyền vào (đã verify)
      username: finalUsername,
      avatar: currentUser.photoURL || "",
      role: "user",
      provider: provider, // Lưu provider để kiểm tra trùng email
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
    provider.setCustomParameters({ prompt: 'select_account' }); // Luôn hiển thị danh sách tài khoản
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
        // Lấy thông tin provider đã đăng ký
        const existingProvider = await getUserProvider(email);
        // Email đã được đăng ký - xóa user khỏi Auth và thông báo lỗi
        try {
          await deleteUser(result.user);
        } catch (deleteError) {
          console.error("Lỗi xóa user khỏi Auth:", deleteError);
          await signOut(auth);
        }
        return { success: false, message: `Email này đã được đăng ký bằng: ${existingProvider}. Vui lòng đăng nhập bằng phương thức đó.` };
      }

      // Tạo user mới
      await createUserInFirestore(result.user, email);
      
      // Cập nhật user state ngay lập tức để NavBar hiển thị avatar
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUser(result.user);
        setUsername(data.username);
        setRole(data.role || "user");
      }
      
      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: any) {
      if (error?.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      
      // Xử lý lỗi email đã tồn tại với provider khác
      if (error?.code === 'auth/account-exists-with-different-credential') {
        const errorEmail = error?.customData?.email;
        const message = await getSignInMethodsMessage(errorEmail || '', 'google.com');
        return { success: false, message };
      }
      
      console.error("Lỗi đăng ký Google:", error);
      return { success: false, message: `Lỗi: ${error?.message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG KÝ BẰNG GITHUB =====
  const signUpWithGithub = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    provider.setCustomParameters({ allow_signup: 'true' }); // Luôn hiển thị tùy chọn đăng nhập
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
        // Lấy thông tin provider đã đăng ký
        const existingProvider = await getUserProvider(email);
        // Email đã được đăng ký - xóa user khỏi Auth và thông báo lỗi
        try {
          await deleteUser(result.user);
        } catch (deleteError) {
          console.error("Lỗi xóa user khỏi Auth:", deleteError);
          await signOut(auth);
        }
        return { success: false, message: `Email này đã được đăng ký bằng: ${existingProvider}. Vui lòng đăng nhập bằng phương thức đó.` };
      }

      // Tạo user mới
      await createUserInFirestore(result.user, email);
      
      // Cập nhật user state ngay lập tức để NavBar hiển thị avatar
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUser(result.user);
        setUsername(data.username);
        setRole(data.role || "user");
      }
      
      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: any) {
      if (error?.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      
      // Xử lý lỗi email đã tồn tại với provider khác
      if (error?.code === 'auth/account-exists-with-different-credential') {
        const errorEmail = error?.customData?.email;
        const message = await getSignInMethodsMessage(errorEmail || '', 'github.com');
        return { success: false, message };
      }
      
      console.error("Lỗi đăng ký GitHub:", error);
      return { success: false, message: `Lỗi: ${error?.message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG KÝ BẰNG EMAIL/PASSWORD =====
  const signUpWithEmailPassword = async (email: string, password: string, usernameInput: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Kiểm tra email đã tồn tại trong Firestore chưa
      const exists = await checkUserExists(email);
      if (exists) {
        const existingProvider = await getUserProvider(email);
        return { 
          success: false, 
          message: `Email này đã được đăng ký bằng: ${existingProvider}. Vui lòng đăng nhập.` 
        };
      }

      // Kiểm tra username đã tồn tại chưa
      const usersRef = collection(db, "users");
      const usernameQuery = query(usersRef, where("username", "==", usernameInput), limit(1));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        return { success: false, message: "Tên người dùng đã tồn tại. Vui lòng chọn tên khác." };
      }

      // Tạo user trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Tạo user trong Firestore
      const userRef = doc(db, "users", newUser.uid);
      await setDoc(userRef, {
        uid: newUser.uid,
        email: email,
        username: usernameInput,
        avatar: "",
        role: "user",
        provider: "password",
        createdAt: serverTimestamp(),
      });

      // Cập nhật user state ngay lập tức để NavBar hiển thị avatar
      setUser(newUser);
      setUsername(usernameInput);
      setRole("user");

      return { success: true, message: "Đăng ký thành công!" };
    } catch (error: any) {
      if (error?.code === "auth/email-already-in-use") {
        return { success: false, message: "Email này đã được sử dụng." };
      } else if (error?.code === "auth/weak-password") {
        return { success: false, message: "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn." };
      }
      console.error("Lỗi đăng ký:", error);
      return { success: false, message: `Lỗi: ${error?.message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG GOOGLE =====
  const loginWithGoogle = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' }); // Luôn hiển thị danh sách tài khoản
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
        // Tài khoản chưa được đăng ký - xóa user khỏi Auth và thông báo lỗi
        try {
          await deleteUser(result.user);
        } catch (deleteError) {
          console.error("Lỗi xóa user khỏi Auth:", deleteError);
          await signOut(auth);
        }
        return { success: false, message: "Tài khoản Google này chưa được đăng ký. Vui lòng đăng ký trước." };
      }

      // Lấy user từ Firestore bằng UID
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Email tồn tại nhưng UID không khớp → đã đăng ký với provider khác
        const existingProvider = await getUserProvider(email);
        try {
          await deleteUser(result.user);
        } catch (deleteError) {
          console.error("Lỗi xóa user khỏi Auth:", deleteError);
          await signOut(auth);
        }
        return { success: false, message: `Email này đã được đăng ký bằng: ${existingProvider}. Vui lòng đăng nhập bằng phương thức đó.` };
      }
      
      // UID khớp - đăng nhập thành công
      const data = userSnap.data();
      setUser(result.user); // Cập nhật user state ngay lập tức
      setUsername(data.username);
      setRole(data.role || "user");

      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: any) {
      if (error?.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      
      // Xử lý lỗi email đã tồn tại với provider khác
      if (error?.code === 'auth/account-exists-with-different-credential') {
        const errorEmail = error?.customData?.email;
        const message = await getSignInMethodsMessage(errorEmail || '', 'google.com');
        return { success: false, message };
      }
      
      console.error("Lỗi đăng nhập Google:", error);
      return { success: false, message: `Lỗi: ${error?.message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG GITHUB =====
  const loginWithGithub = async (): Promise<{ success: boolean; message: string }> => {
    const provider = new GithubAuthProvider();
    provider.addScope('user:email');
    provider.setCustomParameters({ allow_signup: 'true' }); // Luôn hiển thị tùy chọn đăng nhập
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
        // Tài khoản chưa được đăng ký - xóa user khỏi Auth và thông báo lỗi
        try {
          await deleteUser(result.user);
        } catch (deleteError) {
          console.error("Lỗi xóa user khỏi Auth:", deleteError);
          await signOut(auth);
        }
        return { success: false, message: "Tài khoản GitHub này chưa được đăng ký. Vui lòng đăng ký trước." };
      }

      // Lấy user từ Firestore bằng UID
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Email tồn tại nhưng UID không khớp → đã đăng ký với provider khác
        const existingProvider = await getUserProvider(email);
        try {
          await deleteUser(result.user);
        } catch (deleteError) {
          console.error("Lỗi xóa user khỏi Auth:", deleteError);
          await signOut(auth);
        }
        return { success: false, message: `Email này đã được đăng ký bằng: ${existingProvider}. Vui lòng đăng nhập bằng phương thức đó.` };
      }
      
      // UID khớp - đăng nhập thành công
      const data = userSnap.data();
      setUser(result.user); // Cập nhật user state ngay lập tức
      setUsername(data.username);
      setRole(data.role || "user");

      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: any) {
      // Xử lý lỗi popup bị đóng
      if (error?.message?.includes('popup-closed-by-user')) {
        return { success: false, message: "" };
      }
      
      // Xử lý lỗi email đã tồn tại với provider khác
      if (error?.code === 'auth/account-exists-with-different-credential') {
        const errorEmail = error?.customData?.email;
        const message = await getSignInMethodsMessage(errorEmail || '', 'github.com');
        return { success: false, message };
      }
      
      console.error("Lỗi đăng nhập GitHub:", error);
      return { success: false, message: `Lỗi: ${error?.message || "Unknown error"}` };
    }
  };

  // ===== ĐĂNG NHẬP BẰNG EMAIL/PASSWORD =====
  const loginWithEmailPassword = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Kiểm tra user có trong Firestore không
      const exists = await checkUserExists(email);
      
      if (exists) {
        // Email tồn tại trong Firestore - kiểm tra provider
        const existingProvider = await getUserProvider(email);
        
        if (existingProvider && existingProvider !== "Email/Mật khẩu") {
          // Email đã đăng ký với Google/GitHub
          return { 
            success: false, 
            message: `Email này đã được đăng ký bằng: ${existingProvider}. Vui lòng đăng nhập bằng phương thức đó.` 
          };
        }
      } else {
        // Email không tồn tại trong Firestore
        return { success: false, message: "Tài khoản này chưa được đăng ký. Vui lòng đăng ký trước." };
      }

      // Thực hiện đăng nhập
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Lấy thông tin user từ Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUser(result.user); // Cập nhật user state ngay lập tức
        setUsername(data.username);
        setRole(data.role || "user");
      }
      
      return { success: true, message: "Đăng nhập thành công!" };
    } catch (error: any) {
      if (error?.code === "auth/wrong-password" || error?.code === "auth/invalid-credential") {
        return { success: false, message: "Mật khẩu không chính xác. Vui lòng thử lại." };
      } else if (error?.code === "auth/user-not-found") {
        return { success: false, message: "Tài khoản không tồn tại." };
      }
      console.error("Lỗi đăng nhập:", error);
      return { success: false, message: `Lỗi: ${error?.message || "Unknown error"}` };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Kiểm tra user có tồn tại trong Firestore không
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // User tồn tại trong Firestore → Cho phép đăng nhập
          const data = userSnap.data();
          setUser(currentUser);
          setUsername(data.username);
          setRole(data.role || "user");
        } else {
          // User KHÔNG tồn tại trong Firestore → Không cho đăng nhập
          // Đây là trường hợp user vừa được tạo bởi OAuth nhưng chưa đăng ký
          setUser(null);
          setUsername("");
          setRole(null);
        }
      } else {
        setUser(null);
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
        signUpWithEmailPassword,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmailPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
