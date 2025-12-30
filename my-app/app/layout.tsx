// app/layout.tsx
import "./globals.css";
import NavBar from "@/src/Component/NavBar/NavBar"; // CHÚ Ý: "Component" viết hoa
import ChatbotWidget from "@/src/Component/ChatbotWidget/ChatbotWidget";
import { AuthProvider } from "@/src/userHook/context/authContext";
import ChatUI from "@/src/Component/ChatUI/ChatUI";

export const metadata = {
  title: "Codepro",
  description: "Practice coding problems like LeetCode",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi " suppressHydrationWarning>
      <body className="min-h-screen bg-slate-900 text-gray-900 antialiased">
        <AuthProvider>
          <NavBar />
          {children}
          <ChatUI />
        </AuthProvider>
        <ChatbotWidget />
      </body>
    </html>
  );
}
