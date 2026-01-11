import AdminSidebar from "@/src/Component/Admin/AdminSidebar";
import AdminGuard from "@/src/Component/Admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 font-sans">
        <AdminSidebar />
        <main className="flex-1 p-8 overflow-y-auto h-screen scrollbar-hide">
          <div className="max-w-7xl mx-auto space-y-8">
              {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
