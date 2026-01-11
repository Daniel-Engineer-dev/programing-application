"use client";

import LoginForm from "@/src/Component/Auth/LoginForm";
import React, { useEffect, Suspense } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter, useSearchParams } from "next/navigation";
import PageTransition from "@/src/pageTransition/pageTransition";

// Tách nội dung chính ra để bọc Suspense
const LoginContent = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy callbackUrl từ URL, nếu không có thì mặc định về trang chủ "/"
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (!loading && user) {
      // Nếu đã đăng nhập thành công, chuyển hướng về trang trước đó hoặc trang chủ
      router.push(callbackUrl);
    }
  }, [user, loading, router, callbackUrl]);

  // Nếu đang kiểm tra trạng thái đăng nhập, có thể hiện một màn hình chờ nhẹ
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, hiển thị Form
  return (
    <PageTransition>
      <LoginForm />
    </PageTransition>
  );
};

// Component chính
const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
