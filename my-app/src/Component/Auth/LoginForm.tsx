"use client";
import React from "react";
import { useState } from "react";
import { Eye, EyeOff, Github } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/src/api/firebase";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const LoginForm = () => {
  // const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isRememberMe, setIsRememberMe] = useState<boolean>(false);
  const [message, setMessage] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    try {
      let email = identifier;

      // Nếu người dùng nhập username → tra Firestore
      if (!identifier.includes("@")) {
        const ref = doc(db, "usernames", identifier);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setMessage("❌Không tìm thấy tên người dùng");
          return;
        }
        email = snap.data().email;
      }

      const persistence = isRememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;

      await setPersistence(auth, persistence);
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 font-sans text-slate-300">
      {/* --- Login Card Container --- */}
      <div className="w-full max-w-[440px] space-y-8">
        {/* 2. Main Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
        >
          {/* 1. Header: Logo & Title */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white">Đăng nhập</h1>
          </div>
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value.trim())}
              placeholder="Nhập email hoặc tên tài khoản của bạn"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium text-white"
                htmlFor="password"
              >
                Mật khẩu
              </label>
              <Link
                href="/routes/auth/resetpass"
                className="text-xs font-medium text-blue-500 hover:text-blue-400 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center ">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 hover:cursor-pointer"
                onChange={(e) => {
                  setIsRememberMe(e.target.checked);
                }}
              />
              <span className="ml-2 text-sm text-gray-600 ">
                Ghi nhớ phiên đăng nhập
              </span>
            </label>
          </div>
          {/* Display error message if any */}
          {error && <p className="text-red-500">Mật khẩu không hợp lệ</p>}
          {message && <p className="text-red-500">{message}</p>}
          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 shadow-lg shadow-blue-600/20"
          >
            Đăng nhập
          </button>

          {/* Divider "Hoặc" */}
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

        {/* 3. Footer Link */}
        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/routes/auth/signup"
            className="font-medium text-blue-500 hover:underline hover:text-blue-400"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
