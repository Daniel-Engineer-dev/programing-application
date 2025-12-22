"use client";
import LoginForm from "@/src/Component/Auth/LoginForm";
import React, { useEffect } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter, useSearchParams } from "next/navigation";
import PageTransition from "@/src/pageTransition/pageTransition";
const page = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Lấy callbackUrl từ URL, nếu không có thì mặc định về trang chủ "/"
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  useEffect(() => {
    if (!loading && user) {
      // Nếu đã đăng nhập, chuyển hướng đến trang chủ
      router.push(callbackUrl);
    }
  }, [user, loading, router]);
  return (
    <PageTransition>
      <LoginForm />
    </PageTransition>
  );
};

export default page;
