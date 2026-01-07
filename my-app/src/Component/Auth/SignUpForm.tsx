"use client";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Eye, EyeOff, Github } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/src/api/firebase/firebase";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
// Import hook context để sử dụng các hàm đăng nhập mạng xã hội
import { useAuthContext } from "@/src/userHook/context/authContext";

const SignupForm = () => {
  const { signUpWithGoogle, signUpWithGithub } = useAuthContext(); // Lấy hàm từ context
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Kiểm tra email hợp lệ
  const validEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  // Kiểm tra mật khẩu mạnh
  const validatePassword = (password: string): boolean => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    return regex.test(password);
  };

  // Xử lý Đăng ký bằng Email/Password
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (!validEmail(email)) {
        setMessage("Email này không hợp lệ!");
        return;
      }

      // Kiểm tra Email và Username trong collection "users"
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        setMessage("❌ Email này đã được sử dụng");
        return;
      }

      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        setMessage("⚠️ Tên đăng nhập đã được sử dụng");
        return;
      }

      if (!validatePassword(password)) {
        setMessage(
          "Mật khẩu có ít nhất 8 ký tự, 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
        );
        return;
      }

      if (confirmPassword !== password) {
        setMessage("Mật khẩu xác nhận không khớp");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Lưu vào collection "users"
      await setDoc(doc(db, "users", uid), {
        username: username,
        email: email,
        uid: uid,
        createdAt: new Date(),
        role: "user",
        avatar: "",
      });

      alert("✅ Đăng ký thành công!");
    } catch (err: any) {
      console.error(err);
      setError(
        err.code === "auth/email-already-in-use"
          ? "Email đã tồn tại."
          : err.message
      );
    }
  };

  // Xử lý đăng ký mạng xã hội
  const handleSocialSignup = async (type: "google" | "github") => {
    setLoading(true);
    setError("");
    try {
      const result = type === "google" 
        ? await signUpWithGoogle() 
        : await signUpWithGithub();
      
      if (!result.success && result.message) {
        setError(result.message);
      } else if (result.success) {
        alert("✅ Đăng ký thành công!");
      }
    } catch (err: any) {
      setError("Lỗi kết nối mạng xã hội: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 font-sans text-slate-300">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-bold text-white">Đăng ký</h1>
          <p className="text-sm text-slate-400">Bắt đầu với Code Pro</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Tên đăng nhập"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="Mật khẩu"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              Xác nhận Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                placeholder="Xác nhận lại mật khẩu"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {message && <p className="text-xs text-red-500">{message}</p>}
          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-all active:scale-[0.98]"
          >
            Đăng ký
          </button>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-slate-800"></div>
            <span className="mx-4 text-xs text-slate-500 text-nowrap">
              Hoặc tiếp tục với
            </span>
            <div className="grow border-t border-slate-800"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleSocialSignup("google")}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignup("github")}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Github size={20} />
              GitHub
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
