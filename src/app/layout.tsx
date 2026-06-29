import "./globals.css";
import { AuthProvider } from "@/contexts/authContext";
import SystemAnnouncement from "@/components/Global/SystemAnnouncement";
import LenisProvider from "@/components/Global/LenisProvider";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="vi " suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-slate-900 text-gray-900 antialiased">
        <SystemAnnouncement />
        <AuthProvider>
          <LenisProvider>
            {children}
          </LenisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
