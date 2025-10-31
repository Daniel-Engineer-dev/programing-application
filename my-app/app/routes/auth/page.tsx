"use client";
import React from "react";
import NavBar from "@/src/Component/NavBar/NavBar";
import LoginForm from "@/src/Component/Auth/LoginForm";
import SignupForm from "@/src/Component/Auth/SignUpForm";
import ForgotPasswordForm from "@/src/Component/Auth/ForgotPasswordForm";
import { useRecoilState } from "recoil";
import { authModalState } from "@/src/atoms/authModalAtom";
type AuthPageProps = {};

const AuthPage: React.FC<AuthPageProps> = () => {
  return <LoginForm />;
};

export default AuthPage;
