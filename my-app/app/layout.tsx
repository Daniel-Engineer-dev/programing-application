// app/layout.tsx
import "./globals.css";
import NavBar from "@/Component/NavBar"; // CHÚ Ý: "Component" viết hoa

export const metadata = {
  title: "ProgHub",
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
        <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
