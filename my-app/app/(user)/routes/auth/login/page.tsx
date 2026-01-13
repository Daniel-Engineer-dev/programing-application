"use client";

import LoginForm from "@/src/Component/Auth/LoginForm";
import React, { useEffect, Suspense } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter, useSearchParams } from "next/navigation";
import PageTransition from "@/src/pageTransition/pageTransition";

// Tách nội dung chính ra để bọc Suspense
const LoginContent = () => {
  const { user, loading, role } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Lấy callbackUrl từ URL, nếu không có thì mặc định về trang chủ "/"
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    console.log("Login Page State:", { loading, user: user?.email, role });
    
    // Chỉ chuyển hướng khi đã có user VÀ role
    if (!loading && user && role) {
      console.log("Redirecting...", { role });
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push(callbackUrl);
      }
    }
  }, [user, loading, router, callbackUrl, role]);


  // Nếu đang kiểm tra trạng thái đăng nhập, hoặc đã có user nhưng chưa có role (đang fetch)
  if (loading || (user && !role)) {
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
