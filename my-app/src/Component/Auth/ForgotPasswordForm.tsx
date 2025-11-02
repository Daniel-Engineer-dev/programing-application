"use client";
import React from "react";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/src/api/firebase";
import { X } from "lucide-react";
import Link from "next/link";
const ForgotPasswordForm = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
    } catch (err: any) {
      setMessage(err.message);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-start">
          Reset Password
        </h2>
        <div className="mb-10">
          Forgotten your password? Enter your email below, and we'll send you an
          e-mail allowing you to reset it.
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="your@email.com"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors hover:cursor-pointer "
          >
            Reset Password
          </button>
          {message && <p className="text-green-500 mt-4">{message}</p>}
        </form>
        <div className="mt-5">
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

export default ForgotPasswordForm;
