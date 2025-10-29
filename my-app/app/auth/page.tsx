"use client";
import React from "react";
import NavBar from "@/Component/NavBar/NavBar";
import LoginForm from "@/Component/Models/LoginForm";
import { useRecoilState } from "recoil";
import { authModalState } from "@/atoms/authModalAtom";
type AuthPageProps = {};

const AuthPage: React.FC<AuthPageProps> = () => {
  return (
    <div className="bg-linear-to-b from-gray-600 to-black h-screen relative">
      <div className="max-w-7x1 mx-auto">
        <NavBar />
        <div className="fkex items-center justify-center h-[]"></div>
      </div>
    </div>
  );
};

export default AuthPage;
