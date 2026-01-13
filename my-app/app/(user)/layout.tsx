import NavBar from "@/src/Component/NavBar/NavBar";
import ChatUI from "@/src/Component/ChatUI/ChatUI";
import ChatbotWidget from "@/src/Component/ChatbotWidget/ChatbotWidget";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
      <ChatUI />
      <ChatbotWidget />
    </>
  );
}
