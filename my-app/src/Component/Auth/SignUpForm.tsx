"use client";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { Eye, EyeOff, Github } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/src/api/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/src/api/firebase/firebase";
import { getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

const SignupForm = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  //Hàm kiểm tra sự tồn tại của email trong firestore.
  const emailExists = async (email: string) => {
    const q = query(collection(db, "usernames"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty; // true nếu email đã tồn tại
  };
  //Kiểm tra email hợp lệ
  const validEmail = async (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };
  //Kiểm tra mật khẩu mạnh
  const validatePassword = async (password: string): Promise<boolean> => {
    // Regex: Ít nhất 8 ký tự, 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

    // Vì là async function, giá trị trả về sẽ tự động được gói trong Promise
    return regex.test(password);
  };

  // Function to handle sign up
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      // 1. Kiểm tra định dạng Email
      const valid = await validEmail(email);
      if (!valid) {
        setMessage("Email này không hợp lệ!");
        return;
      }

      // 2. Kiểm tra Email đã tồn tại trong Firestore (collection users)
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        setMessage("❌ Email này đã được sử dụng");
        return;
      }

      // 3. Kiểm tra Username đã tồn tại trong Firestore (collection users)
      const usernameQuery = query(
        collection(db, "users"),
        where("username", "==", username)
      );
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        setMessage("⚠️ Tên đăng nhập đã được sử dụng");
        return;
      }

      // 4. Kiểm tra độ mạnh mật khẩu
      const strongPassword = await validatePassword(password);
      if (!strongPassword) {
        setMessage(
          "Mật khẩu có ít nhất 8 ký tự, 1 chữ thường, 1 chữ hoa, 1 số, 1 ký tự đặc biệt"
        );
        return;
      }

      if (confirmPassword !== password) {
        setMessage("Mật khẩu xác nhận không khớp");
        return;
      }

      // 5. Tạo user mới trong Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // 6. Lưu thông tin vào collection "users" với ID là UID
      // Điều này giúp bạn bỏ được collection "usernames" dư thừa
      await setDoc(doc(db, "users", uid), {
        username: username,
        email: email,
        uid: uid,
        createdAt: new Date(),
        // Bạn có thể thêm các field mặc định khác ở đây
        role: "user",
        avatar: "",
      });

      alert("✅ Đăng ký thành công!");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email này đã được đăng ký trong hệ thống Auth.");
      } else {
        setError(err.message);
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
          {message && <p className="text-red-500">{message}</p>}
          {error && <p className="text-red-500">{error}</p>}
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
