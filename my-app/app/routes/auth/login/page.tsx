"use client";
import LoginForm from "@/src/component/Auth/LoginForm";
import React, { useEffect } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter } from "next/navigation";
import PageTransition from "@/src/pageTransition/pageTransition";
const page = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      // Nếu đã đăng nhập, chuyển hướng đến trang chủ
      router.push("/");
    }
  }, [user, loading, router]);
  return (
    <PageTransition>
      <LoginForm />
    </PageTransition>
  );
};

export default page;
