import ForgotPasswordForm from "@/src/Component/Auth/ForgotPasswordForm";
import PageTransition from "@/src/pageTransition/pageTransition";
import React from "react";

const page = () => {
  return (
    <PageTransition>
      <ForgotPasswordForm />
    </PageTransition>
  );
};

export default page;
