"use client";
import React, { useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { X } from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/src/api/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/src/api/firebase";
import { getDoc } from "firebase/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";

const SignupForm = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState("");
  const [message1, setMessage1] = useState("");
  const [message2, setMessage2] = useState("");
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
    <div className=" min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-end">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 hover:cursor-pointer"
          >
            <X size={20} />
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Sign Up
        </h2>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Your user name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          {message1 && <p className="text-red-500">{message1}</p>}
          {!message1 && message2 && <p className="text-red-500">{message2}</p>}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors hover:cursor-pointer"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          You can sign up with your Google account.
          <a
            href="#"
            className="text-indigo-600 hover:text-indigo-500 font-medium"
          >
            Google
          </a>
        </div>
        <div className="mt-3">
          <Link
            href="/routes/auth/login"
            className="text-gray-500 hover:text-gray-700 hover:cursor-pointer mt-5"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
