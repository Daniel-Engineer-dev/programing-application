"use client";
import React from "react";
import NavBar from "@/src/Component/NavBar/NavBar";
import LoginForm from "@/src/Component/Models/LoginForm";
import { useRecoilState } from "recoil";
import { authModalState } from "@/src/atoms/authModalAtom";
type AuthPageProps = {};

const AuthPage: React.FC<AuthPageProps> = () => {
  return <LoginForm />;
};

export default AuthPage;
