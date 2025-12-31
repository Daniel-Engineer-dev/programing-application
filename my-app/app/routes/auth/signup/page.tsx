"use client";

import SignupForm from "@/src/Component/Auth/SignUpForm";
import PageTransition from "@/src/pageTransition/pageTransition";
import React, { useEffect } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter } from "next/navigation";

const SignupPage = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Nếu người dùng đã đăng nhập, không cho phép truy cập trang đăng ký
      router.push("/");
    }
  }, [user, loading, router]);

  // Hiển thị màn hình chờ trong khi xác thực trạng thái người dùng
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập (user === null), hiển thị form đăng ký
  return !user ? (
    <PageTransition>
      <SignupForm />
    </PageTransition>
  ) : null;
};

export default SignupPage;
