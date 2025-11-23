"use client";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Eye, EyeOff, Github } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/src/api/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/src/api/firebase";
import { getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

const SignupForm = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState("");
  const [message1, setMessage1] = useState("");
  const [message2, setMessage2] = useState("");
  const [message3, setMessage3] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  //Hàm kiểm tra sự tồn tại của email trong firestore.
  const emailExists = async (email: string) => {
    const q = query(collection(db, "usernames"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // true nếu email đã tồn tại
  };
  // Function to handle sign up
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage1("");
    setMessage2("");
    try {
      // 🔹 Kiểm tra email trước
      const exists = await emailExists(email);
      if (exists) {
        setMessage1("❌ Email is already in use");
        return;
      }
      // 🔹 Kiểm tra username sau
      const ref = doc(db, "usernames", username);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setMessage2("⚠️ Username already taken");
        return;
      }
      // 🔹 Tạo user mới
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const uid = userCredential.user.uid;
      await setDoc(ref, { email, uid, createdAt: new Date() });

      alert("✅ Sign up successful!");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      {
        error === "Firebase: Error (auth/email-already-in-use)." &&
          setMessage1("Email is used");
      }
    }
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 font-sans text-slate-300">
      {/* Container chính (Card) */}
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        {/* --- 1. Header --- */}
        <div className="mb-8 text-center">
          <h1 className="mb-1 text-2xl font-bold text-white">Đăng ký</h1>
          <p className="text-sm text-slate-400">Bắt đầu với Code Pro</p>
        </div>
        {/* --- 2. Form --- */}
        <form onSubmit={handleSignup} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Địa chỉ Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {/*Username*/}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Tên đăng nhập"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Mật khẩu */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white"
              htmlFor="password"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Nhập mật khẩu của bạn"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Xác nhận Mật khẩu */}
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white"
              htmlFor="confirm-password"
            >
              Xác nhận Mật khẩu
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {message1 && <p className="text-red-500">{message1}</p>}
          {!message1 && message2 && <p className="text-red-500">{message2}</p>}
          {/* Nút Đăng ký */}
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-[0.98]"
          >
            Đăng ký
          </button>
          <div className="relative flex items-center py-2">
            <div className="grow border-t border-slate-800"></div>
            <span className="mx-4 text-xs text-slate-500">
              Hoặc tiếp tục với
            </span>
            <div className="grow border-t border-slate-800"></div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {/* Google Icon SVG */}
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
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
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
