import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import PageTransition from "@/components/transitions/pageTransition";
import React from "react";

const page = () => {
  return (
    <PageTransition>
      <ForgotPasswordForm />
    </PageTransition>
  );
};

export default page;
