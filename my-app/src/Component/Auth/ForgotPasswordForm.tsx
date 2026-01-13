"use client";
import React, { useState, useEffect } from "react";
import {
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth, db } from "@/src/api/firebase/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Loader2 } from "lucide-react"; // Import icon loader

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  // Đếm ngược thời gian gửi lại
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cooldown > 0) return;

    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      // 1. Kiểm tra email trong Firestore users collection
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setIsError(true);
        setMessage("Email này chưa được đăng ký trong hệ thống!");
        setLoading(false);
        return;
      }

      // Lấy thông tin user từ Firestore
      const userData = querySnapshot.docs[0].data();
      console.log("User data from Firestore:", userData);

      // 2. Kiểm tra phương thức đăng nhập
      const methods = await fetchSignInMethodsForEmail(auth, email);
      console.log("Sign-in methods for email:", methods);

      // Kiểm tra nếu user đăng ký bằng Google/GitHub (không có password)
      if (userData.provider && userData.provider !== "password") {
        setIsError(true);
        setMessage(
          `Tài khoản này đăng nhập bằng ${userData.provider === "google.com" ? "Google" : "GitHub"}. Bạn không cần đặt lại mật khẩu.`
        );
        setLoading(false);
        return;
      }

      // 3. Gửi email khôi phục
      console.log("Sending password reset email to:", email);
      await sendPasswordResetEmail(auth, email);
      console.log("Password reset email sent successfully!");

      setIsError(false);
      setMessage("Thành công! Kiểm tra hộp thư đến (hoặc thư rác) của bạn.");
      setCooldown(60); // Bắt đầu đếm ngược 60s
    } catch (err: any) {
      console.error("Error sending password reset email:", err);
      setIsError(true);
      if (err.code === "auth/invalid-email") {
        setMessage("Email không hợp lệ!");
      } else if (err.code === "auth/user-not-found") {
        setMessage("Email này không tồn tại trong hệ thống xác thực Firebase. Có thể tài khoản chưa được đăng ký hoặc đã bị xóa.");
      } else {
        setMessage("Lỗi: " + err.message + " (Code: " + err.code + ")");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 font-sans text-slate-300">
      <div className="w-full max-w-[440px] space-y-8">
        <form
          onSubmit={handleReset}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl"
        >
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold text-white">Đặt lại mật khẩu</h1>
            <p className="mt-5 text-slate-400 text-sm">
              Nhập email đăng ký tài khoản để nhận liên kết khôi phục.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="email">
              Email của bạn
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="example@gmail.com"
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                isError
                  ? "bg-red-500/10 text-red-500"
                  : "bg-green-500/10 text-green-500"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : cooldown > 0 ? (
              `Gửi lại sau ${cooldown}s`
            ) : (
              "Xác nhận gửi"
            )}
          </button>

          <div className="text-center border-t border-slate-800 pt-4">
            <a
              href="/routes/auth/login"
              className="text-sm font-medium text-blue-500 hover:text-blue-400"
            >
              Quay lại Đăng nhập
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
