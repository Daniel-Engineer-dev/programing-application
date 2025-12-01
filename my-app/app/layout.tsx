// app/layout.tsx
import "./globals.css";
import NavBar from "@/src/component/NavBar/NavBar"; // CHÚ Ý: "Component" viết hoa
import ChatbotWidget from "@/src/component/ChatbotWidget/ChatbotWidget";
import { AuthProvider } from "@/src/userHook/context/authContext";

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
        </AuthProvider>
        <ChatbotWidget />
      </body>
    </html>
  );
}
