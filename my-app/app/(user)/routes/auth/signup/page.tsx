"use client";

import SignupForm from "@/src/Component/Auth/SignUpForm";
import PageTransition from "@/src/pageTransition/pageTransition";
import React, { useEffect } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter } from "next/navigation";

const SignupPage = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  // Tự động redirect ở đây gây lỗi race condition với Social Login
  // Khi popup Google login xong, user được set -> trang redirect ngay lập tức TRƯỚC KHI logic kiểm tra duplicate/tạo user kịp chạy.
  // useEffect(() => {
  //   if (!loading && user) {
  //     router.push("/");
  //   }
  // }, [user, loading, router]);

  // Hiển thị màn hình chờ trong khi xác thực trạng thái người dùng
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập (user === null), hiển thị form đăng ký
  // UPDATE: Luôn hiển thị form để tránh unmount khi Social Login tự động set user
  return (
    <PageTransition>
      <SignupForm />
    </PageTransition>
  );
};

export default SignupPage;
