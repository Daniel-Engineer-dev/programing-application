"use client";
import React from "react";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/src/api/firebase/firebase"; // Đảm bảo import đúng đường dẫn
import { Github } from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  // Cập nhật hàm kiểm tra email trong collection "users"
  const emailExists = async (email: string) => {
    // Truy vấn vào collection "users" thay vì "usernames"
    const q = query(
      collection(db, "users"),
      where("email", "==", email),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // true nếu tìm thấy người dùng có email này
  };

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);

    try {
      const existEmail = await emailExists(email);

      if (!existEmail) {
        setIsError(true);
        setMessage("Email chưa được đăng ký trong hệ thống!");
        return;
      }

      // Gửi email khôi phục mật khẩu từ Firebase Auth
      await sendPasswordResetEmail(auth, email);

      setIsError(false);
      setMessage("Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!");
    } catch (err: any) {
      setIsError(true);
      if (err.code === "auth/invalid-email") {
        setMessage("Địa chỉ email không hợp lệ!");
      } else {
        setMessage("Đã xảy ra lỗi: " + err.message);
      }
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
              Vui lòng nhập email đăng ký tài khoản. Chúng tôi sẽ gửi liên kết
              khôi phục mật khẩu đến hòm thư của bạn.
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
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Hiển thị thông báo động dựa trên state */}
          {message && (
            <p
              className={`text-sm font-medium ${
                isError ? "text-red-500" : "text-green-500"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            Xác nhận gửi
          </button>

          <div className="relative flex items-center py-2">
            <div className="grow border-t border-slate-800"></div>
            <span className="mx-4 text-xs text-slate-500">Hoặc quay lại</span>
            <div className="grow border-t border-slate-800"></div>
          </div>

          <div className="text-center">
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
