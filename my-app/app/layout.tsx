import "./globals.css";
import { AuthProvider } from "@/src/userHook/context/authContext";
import SystemAnnouncement from "@/src/Component/Global/SystemAnnouncement";

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
        <SystemAnnouncement />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
