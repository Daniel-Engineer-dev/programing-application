import "./globals.css";
import { AuthProvider } from "@/contexts/authContext";
import SystemAnnouncement from "@/components/Global/SystemAnnouncement";

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
