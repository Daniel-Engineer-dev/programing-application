import NavBar from "@/components/NavBar/NavBar";
import ChatUI from "@/components/ChatUI/ChatUI";
import ChatbotWidget from "@/components/ChatbotWidget/ChatbotWidget";

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
