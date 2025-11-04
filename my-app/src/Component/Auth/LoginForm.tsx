"use client";
import React from "react";
import { useState } from "react";
import { X } from "lucide-react";
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
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      let email = identifier;

      // Nếu người dùng nhập username → tra Firestore
      if (!identifier.includes("@")) {
        const ref = doc(db, "usernames", identifier);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setMessage("❌ Username not found");
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
          Sign In
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Email or username"
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
            />
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
              <span className="ml-2 text-sm text-gray-600 ">Remember me</span>
            </label>
            <Link
              href="/routes/auth/resetpass"
              className="text-sm text-indigo-600 hover:text-indigo-500 hover:cursor-pointer"
            >
              Forgot password?
            </Link>
          </div>
          {/* Display error message if any */}
          {error && <p className="text-red-500">Invalid email or password</p>}
          {message && <p className="text-red-500">{message}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors hover:cursor-pointer"
          >
            Sign In
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?
          <Link
            href="/routes/auth/signup"
            className="text-indigo-600 hover:text-indigo-500 font-medium hover:cursor-pointer"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
