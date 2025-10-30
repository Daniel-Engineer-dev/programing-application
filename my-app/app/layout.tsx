// app/layout.tsx
import "./globals.css";
import NavBar from "@/src/Component/NavBar/NavBar"; // CHÚ Ý: "Component" viết hoa
import { ThemeProvider } from "next-themes";
export const metadata = {
  title: "LeetCode",
  description: "Practice coding problems like LeetCode",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <NavBar />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
