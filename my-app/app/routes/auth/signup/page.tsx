import SignupForm from "@/src/component/Auth/SignUpForm";
import PageTransition from "@/src/pageTransition/pageTransition";
const page = () => {
  return (
    <PageTransition>
      <SignupForm />
    </PageTransition>
  );
};

export default page;
