"use client";
import SignupForm from "@/src/Component/Auth/SignUpForm";
import PageTransition from "@/src/pageTransition/pageTransition";
import React, { useEffect } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { useRouter } from "next/navigation";
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
      <SignupForm />
    </PageTransition>
  );
};

export default page;
