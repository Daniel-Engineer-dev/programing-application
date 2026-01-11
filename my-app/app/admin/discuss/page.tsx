"use client";

import { useEffect, useState } from "react";
import { db } from "@/src/api/firebase/firebase";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  DocumentData,
  QueryDocumentSnapshot,
  writeBatch,
  where
} from "firebase/firestore";
import { 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  Flag, 
  MessageSquare, 
  Eye, 
  User, 
  Clock,
  Plus,
  LayoutList,
  Search
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// --- TYPES ---
interface ReportItem {
  id: string;
  path: string;
  targetType: "post" | "comment";
  discussionId: string;
  commentId?: string;
  reasons: string[];
  details: string;
  reporterName: string;
  createdAt: string;
}

interface DiscussionItem {
  id: string;
  title: string;
  excerpt: string;
  authorName: string;
  repliesCount: number;
  viewsCount: number;
  createdAt: string;
}

export default function AdminDiscussPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"discussions" | "reports">("discussions");
  
  // Data State
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");

  // --- FETCHERS ---
  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(
        collectionGroup(db, "reports"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);

      const items: ReportItem[] = snap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => {
        const data = d.data();
        const pathSegments = d.ref.path.split("/");
        // discussions/{did}/reports/{rid} OR discussions/{did}/comments/{cid}/reports/{rid}
        const isComment = pathSegments.length >= 6;
        const discussionId = pathSegments[1];
        const commentId = isComment ? pathSegments[3] : undefined;

        return {
          id: d.id,
          path: d.ref.path,
          targetType: isComment ? "comment" : "post",
          discussionId,
          commentId,
          reasons: data.reasons || [],
          details: data.details || "",
          reporterName: data.reporter?.name || "Người dùng",
          createdAt: data.createdAt?.toDate().toLocaleString() || "",
        };
      });
      setReports(items);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Lỗi tải báo cáo");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "discussions"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      
      const items: DiscussionItem[] = snap.docs.map(d => {
        const data = d.data();
        return {
            id: d.id,
            title: data.title || "Không tiêu đề",
            excerpt: data.excerpt || "",
            authorName: data.authorName || data.author?.name || data.author?.email?.split('@')[0] || "Người dùng",
            repliesCount: data.repliesCount || 0,
            viewsCount: data.viewsCount || 0,
            createdAt: data.createdAt?.toDate().toLocaleDateString() || "-"
        }
      });
      setDiscussions(items);
    } catch (error) {
        console.error("Error fetching discussions:", error);
        toast.error("Lỗi tải danh sách thảo luận");
    } finally {
        setLoading(false);
    }
  }

  // Effect to load data when tab changes
  useEffect(() => {
    if (activeTab === "discussions") fetchDiscussions();
    else fetchReports();
  }, [activeTab]);

  // --- ACTIONS ---
  const handleDismissReport = async (reportPath: string) => {
    if (!confirm("Bỏ qua báo cáo này? (Sẽ xoá báo cáo khỏi hệ thống)")) return;
    try {
      await deleteDoc(doc(db, reportPath));
      setReports((prev) => prev.filter((r) => r.path !== reportPath));
      toast.success("Đã xoá báo cáo");
    } catch (error) {
      toast.error("Lỗi thao tác");
    }
  };

  const handleDeleteDiscussion = async (id: string) => {
      if (!confirm("CẢNH BÁO: Bạn có chắc muốn xoá bài viết này?\nTất cả bình luận và báo cáo liên quan cũng sẽ bị xoá.")) return;
      try {
          toast.info("Đang xử lý xoá...");
          
          // 1. Delete Discussion Reports
          const discussionReportsSnap = await getDocs(collection(db, "discussions", id, "reports"));
          const batch1 = writeBatch(db);
          discussionReportsSnap.docs.forEach((doc) => batch1.delete(doc.ref));
          await batch1.commit();

          // 2. Delete Comments and their Reports
          const commentsSnap = await getDocs(collection(db, "discussions", id, "comments"));
          // Note: If too many comments, this might be slow, but for now it's acceptable.
          for (const commentDoc of commentsSnap.docs) {
              const commentReportsSnap = await getDocs(collection(db, "discussions", id, "comments", commentDoc.id, "reports"));
              if (!commentReportsSnap.empty) {
                  const batchRep = writeBatch(db);
                  commentReportsSnap.docs.forEach((r) => batchRep.delete(r.ref));
                  await batchRep.commit();
              }
              await deleteDoc(commentDoc.ref); // Delete comment
          }

          // 3. Delete Discussion Main Doc
          await deleteDoc(doc(db, "discussions", id));
          
          setDiscussions(prev => prev.filter(d => d.id !== id));
          // Also remove from reports list if present
          setReports(prev => prev.filter(r => r.discussionId !== id));

          toast.success("Đã xoá bài thảo luận và dữ liệu liên quan");
      } catch (error) {
          console.error(error);
          toast.error("Lỗi khi xoá bài viết");
      }
  }

  // --- RENDER HELPERS ---
  const filteredDiscussions = discussions.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/50 pb-6">
        <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                <MessageSquare className="text-blue-400" size={36} />
                Quản lý Thảo Luận
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Trung tâm kiểm soát nội dung và tương tác cộng đồng</p>
        </div>
        
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800/60 backdrop-blur-sm">
            <button
                onClick={() => setActiveTab("discussions")}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === "discussions" 
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
                Danh sách bài viết
            </button>
            <button
                onClick={() => setActiveTab("reports")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === "reports" 
                    ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
                <Flag size={16} />
                Báo cáo
                {reports.length > 0 && (
                    <span className="flex items-center justify-center bg-white text-red-600 h-5 min-w-[20px] px-1 rounded-full text-[10px] shadow-sm">
                        {reports.length}
                    </span>
                )}
            </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl min-h-[600px] flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
        
        {/* TAB: DISCUSSIONS */}
        {activeTab === "discussions" && (
            <div className="flex flex-col h-full relative z-10">
                {/* Toolbar */}
                <div className="p-6 border-b border-slate-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
                        <div className="relative flex items-center bg-slate-950 rounded-xl">
                            <Search className="absolute left-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm bài viết..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-transparent border-none rounded-xl pl-11 pr-4 py-3 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                    <Link 
                        href="/admin/discuss/new" 
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Thêm bài mới
                    </Link>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-500">
                             <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                             <p className="font-medium animate-pulse">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/50">
                                    <th className="px-6 py-5">Tiêu đề & Nội dung</th>
                                    <th className="px-6 py-5 w-48">Tác giả</th>
                                    <th className="px-6 py-5 w-36 text-center">Thống kê</th>
                                    <th className="px-6 py-5 w-40 text-right">Ngày đăng</th>
                                    <th className="px-6 py-5 w-48 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-sm">
                                {filteredDiscussions.map(d => (
                                    <tr key={d.id} className="group hover:bg-blue-500/5 transition-all duration-200">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                                                {d.title}
                                            </div>
                                            <div className="text-xs text-slate-500 line-clamp-1 max-w-md">{d.excerpt || "Không có nội dung mô tả"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 ring-2 ring-slate-800 group-hover:ring-blue-500/30 transition-all">
                                                    <User size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-200 truncate max-w-[120px]">{d.authorName}</span>
                                                    <span className="text-[10px] text-slate-500">Thành viên</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="flex flex-col items-center gap-0.5 text-slate-400 group-hover:text-purple-400 transition-colors" title="Lượt xem">
                                                    <Eye size={16} />
                                                    <span className="text-[10px] font-bold">{d.viewsCount}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5 text-slate-400 group-hover:text-blue-400 transition-colors" title="Bình luận">
                                                    <MessageSquare size={16} />
                                                    <span className="text-[10px] font-bold">{d.repliesCount}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-slate-300 font-medium text-xs">{d.createdAt}</span>
                                                <span className="text-[10px] text-slate-600 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">Public</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <ButtonAction 
                                                    icon={<ExternalLink size={14} />} 
                                                    label="Chi tiết" 
                                                    onClick={() => router.push(`/admin/discuss/${d.id}`)}
                                                    variant="primary"
                                                />
                                                <button
                                                    onClick={() => handleDeleteDiscussion(d.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                                                    title="Xoá bài viết"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}

        {/* TAB: REPORTS */}
        {activeTab === "reports" && (
            <div className="flex flex-col h-full relative z-10">
                 <div className="p-4 border-b border-slate-800/50 bg-red-500/5 flex justify-between items-center px-6">
                    <span className="text-sm font-medium text-red-200 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        Danh sách nội dung bị báo cáo
                    </span>
                    <button onClick={fetchReports} className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider">Làm mới dữ liệu</button>
                 </div>
                 
                 <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Đang tải báo cáo...</div>
                    ) : reports.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 p-12">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-green-500/30">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Hệ thống trong sạch!</h3>
                            <p className="max-w-xs text-center text-slate-400">Không có báo cáo vi phạm nào cần xử lý vào lúc này.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40 text-slate-400 text-xs font-bold uppercase border-b border-slate-800/50">
                                    <th className="px-6 py-4">Loại nội dung</th>
                                    <th className="px-6 py-4">Người báo cáo</th>
                                    <th className="px-6 py-4">Lý do</th>
                                    <th className="px-6 py-4 w-32 text-right">Thời gian</th>
                                    <th className="px-6 py-4 text-right">Xử lý</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40 text-sm">
                                {reports.map(r => (
                                    <tr key={r.path} className="hover:bg-red-500/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            {r.targetType === "post" ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                                    <LayoutList size={12} /> Bài viết
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                                                    <MessageSquare size={12} /> Bình luận
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                             <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-slate-700">
                                                    {r.reporterName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-slate-300 font-medium">{r.reporterName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {r.reasons.map(reason => (
                                                        <span key={reason} className="text-xs font-medium text-red-300 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/10">{reason}</span>
                                                    ))}
                                                </div>
                                                {r.details && (
                                                    <div className="flex items-start gap-2 bg-slate-950/50 p-2 rounded text-xs text-slate-400 italic border border-slate-800/50">
                                                        <span className="w-1 h-full bg-slate-700 rounded-full shrink-0"></span>
                                                        "{r.details}"
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500 text-xs font-mono">{r.createdAt}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                 <ButtonAction 
                                                    icon={<ExternalLink size={14} />} 
                                                    label="Kiểm tra" 
                                                    onClick={() => {
                                                        const url = `/admin/discuss/${r.discussionId}${r.commentId ? `?highlight=${r.commentId}` : ''}`;
                                                        router.push(url);
                                                    }}
                                                    variant="primary"
                                                />
                                                <ButtonAction 
                                                    icon={<CheckCircle size={14} />} 
                                                    label="Đã xử lý" 
                                                    onClick={() => handleDismissReport(r.path)}
                                                    variant="success"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                 </div>
            </div>
        )}
      </div>
    </div>
  );
}

// Modern Button Helper
function ButtonAction({ icon, label, onClick, variant }: { icon: React.ReactNode, label: string, onClick: () => void, variant: "primary" | "danger" | "success" }) {
    const styles = {
        primary: "bg-slate-800 hover:bg-blue-600 hover:border-blue-500 text-slate-300 hover:text-white border-slate-700",
        danger: "bg-slate-800 hover:bg-red-600 hover:border-red-500 text-slate-300 hover:text-white border-slate-700",
        success: "bg-slate-800 hover:bg-emerald-600 hover:border-emerald-500 text-slate-300 hover:text-white border-slate-700",
    }
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm hover:shadow-md ${styles[variant]}`}
            title={label}
        >
            {icon}
            <span>{label}</span>
        </button>
    )
}
