// app/layout.tsx
import "./globals.css";
import NavBar from "@/src/Component/NavBar/NavBar"; // CHÚ Ý: "Component" viết hoa
import { Providers } from "./provider";
import ChatbotWidget from "@/src/Component/ChatbotWidget/ChatbotWidget";
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
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <NavBar />
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}
