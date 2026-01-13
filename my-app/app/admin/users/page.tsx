"use client";

import { useState, useEffect } from "react";
import { db } from "@/src/api/firebase/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy, writeBatch, deleteDoc, where } from "firebase/firestore";
import { Search, Shield, User, Ban, Trash2 } from "lucide-react";

type UserData = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin" | "moderator";
  avatar?: string;
  isBanned?: boolean;
};

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(list);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: string) => {
    const action = newRole === 'admin' ? "thăng cấp lên Admin" : "hạ cấp xuống User";
    if (!confirm(`Bạn có chắc muốn ${action}?`)) return;
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole as any } : u));
    } catch (error) {
      alert("Cập nhật thất bại");
    }
  };

  /* --- DEEP CLEAN HELPER --- */
  const deleteQueryBatch = async (queryRef: any) => {
      const snapshot = await getDocs(queryRef);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
      });
      await batch.commit();
  };

  const handleDeleteUser = async (uid: string, username: string) => {
    if (!confirm(`CẢNH BÁO NGUY HIỂM: Hành động này KHÔNG THỂ hoàn tác!

Bạn đang chuẩn bị XÓA VĨNH VIỄN người dùng "${username}".
Hệ thống sẽ thực hiện "Deep Clean" để xóa toàn bộ dữ liệu sau:

1. 👤 Hồ sơ người dùng & Cài đặt (Profile, Settings)
2. 📝 Toàn bộ Code đã nộp & Lịch sử chấm bài (Submissions)
3. 💾 Danh sách bài tập đã lưu & Lộ trình học (Saved Challenges, My List)
4. 🛒 Lịch sử mua hàng & Giao dịch (Orders)
5. 💬 Bài viết thảo luận & Giải pháp chia sẻ (Discussions, Solutions)
6. 🤝 Lời mời kết bạn (Friend Requests - Gửi & Nhận)
7. 📒 Ghi chú cá nhân (Notes)
8. 🏆 Dữ liệu thi đấu (Contest Registrations, Leaderboard, Virtual)

Bạn có CHẮC CHẮN muốn tiếp tục xóa không?`)) return;
    
    // Double confirmation
    const confirmName = prompt(`Nhập lại tên người dùng "${username}" để xác nhận xóa:`);
    if (confirmName !== username) {
        alert("Tên nhập không khớp. Hủy thao tác.");
        return;
    }

    setProcessingId(uid);
    // User Feedback
    alert("Hệ thống đang tiến hành xóa dữ liệu. Vui lòng không tắt trình duyệt...");

    try {
        /* 1. DELETE GLOBAL USER DATA (Discussions) */
        // Assuming "userId" is the field. If "authorId", we might miss. Standardize on userId.
        const discussQuery = query(collection(db, "discussions"), where("userId", "==", uid));
        await deleteQueryBatch(discussQuery);

        /* 1.5. DELETE SOCIAL DATA (Friend Requests & Community Solutions) */
        // Friend Requests (Sent)
        const sentRequestsQuery = query(collection(db, "friend_requests"), where("fromId", "==", uid));
        await deleteQueryBatch(sentRequestsQuery);

        // Friend Requests (Received)
        const receivedRequestsQuery = query(collection(db, "friend_requests"), where("toId", "==", uid));
        await deleteQueryBatch(receivedRequestsQuery);

        // Community Solutions
        const solutionsQuery = query(collection(db, "community_solutions"), where("userId", "==", uid));
        await deleteQueryBatch(solutionsQuery);

        /* 2. DELETE USER SUBCOLLECTIONS (Private Data) */
        // These are collections INSIDE users/{uid}/...
        await deleteQueryBatch(collection(db, "users", uid, "submissions"));
        await deleteQueryBatch(collection(db, "users", uid, "savechallenges")); // User's custom problem lists
        await deleteQueryBatch(collection(db, "users", uid, "notes"));
        await deleteQueryBatch(collection(db, "users", uid, "notifications"));
        await deleteQueryBatch(collection(db, "users", uid, "orders")); // Purchase history
        await deleteQueryBatch(collection(db, "users", uid, "interactions")); // Saved/Completed Topics & Guides

        /* 3. DELETE CONTEST DATA (Scattered Data) */
        const contestsSnap = await getDocs(collection(db, "contests"));
        const contestDeletes: Promise<void>[] = [];

        // Chunking contests to avoid memory issues (though unlikely for <100 contests)
        for (const contestDoc of contestsSnap.docs) {
            const cid = contestDoc.id;
            contestDeletes.push((async () => {
                const batch = writeBatch(db);
                // Single Docs
                batch.delete(doc(db, "contests", cid, "registrations", uid));
                batch.delete(doc(db, "contests", cid, "leaderboard", uid));
                batch.delete(doc(db, "contests", cid, "virtual_participations", uid));
                await batch.commit();

                // Sub-collection: Contest Submissions
                await deleteQueryBatch(collection(db, "contests", cid, "user", uid, "submissions"));
            })());
        }
        await Promise.all(contestDeletes);

        /* 4. DELETE SHOP/BILLING (Optional/Future Proof) */
        // await deleteQueryBatch(query(collection(db, "orders"), where("userId", "==", uid)));

        /* 5. FINALLY: DELETE USER PROFILE */
        await deleteDoc(doc(db, "users", uid));

        // Update UI
        setUsers(prev => prev.filter(u => u.id !== uid));
        alert(`Đã xóa sạch sẽ toàn bộ dữ liệu của ${username} khỏi hệ thống.`);

    } catch (error) {
        console.error("Delete failed:", error);
        alert("Có lỗi xảy ra khi xóa dữ liệu. Chi tiết trong console.");
    } finally {
        setProcessingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800/50">
        <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent flex items-center gap-3">
                <Shield className="text-purple-400" size={36} />
                Quản Lý Người Dùng
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Trung tâm phân quyền và kiểm soát tài khoản</p>
        </div>
        <div className="relative w-full md:w-96 group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl opacity-20 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
            <div className="relative flex items-center bg-slate-950 rounded-xl">
                <Search className="absolute left-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm user theo tên..." 
                    className="w-full bg-transparent border-none rounded-xl pl-11 pr-4 py-3 text-sm outline-none text-slate-200 placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl relative min-h-[500px] flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none"></div>
        
        <div className="flex-1 overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800/50">
                        <th className="px-8 py-5">Người Dùng</th>
                        <th className="px-8 py-5">Email</th>
                        <th className="px-8 py-5">Vai Trò</th>
                        <th className="px-8 py-5 text-right">Hành Động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-purple-500/5 transition-all duration-200 group">
                            <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-slate-700/50 shadow-md group-hover:border-purple-500/30 transition-colors">
                                         {user.avatar ? (
                                             <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                                         ) : (
                                             <User size={20} className="text-slate-400 group-hover:text-purple-400 transition-colors"/>
                                         )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="font-bold text-slate-200 text-base">{user.username || "Chưa đặt tên"}</div>
                                        <div className="text-[10px] text-slate-500 font-mono bg-slate-950/50 px-1.5 py-0.5 rounded w-fit mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity">ID: {user.id.slice(0, 8)}...</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-4 text-slate-400 font-medium">{user.email}</td>
                            <td className="px-8 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border shadow-sm ${
                                    user.role === 'admin' 
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10' 
                                    : user.role === 'moderator' 
                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-yellow-500/10' 
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/10'
                                }`}>
                                    {user.role === 'admin' && <Shield size={12} fill="currentColor" className="opacity-50" />}
                                    {user.role === 'admin' ? 'Quản Trị Viên' : 'Thành Viên'}
                                </span>
                            </td>
                            <td className="px-8 py-4 text-right">
                                <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 duration-300">
                                    <button 
                                        onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                        className={`p-2.5 rounded-xl transition-all border shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                                            user.role === 'admin' 
                                            ? "bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700" 
                                            : "bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-purple-500/20"
                                        }`}
                                        title={user.role === 'admin' ? "Hạ cấp xuống User" : "Thăng cấp lên Admin"}
                                    >
                                        {user.role === 'admin' ? <Ban size={16} strokeWidth={2.5} /> : <Shield size={16} strokeWidth={2.5} />}
                                    </button>
                                    
                                    <button
                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                        disabled={processingId === user.id}
                                        className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-red-500 shadow-sm hover:shadow-lg hover:shadow-red-500/20 hover:-translate-y-0.5"
                                        title="Xóa vĩnh viễn người dùng"
                                    >
                                        {processingId === user.id ? <span className="text-xs animate-spin font-bold">...</span> : <Trash2 size={16} strokeWidth={2.5} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredUsers.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <Search size={32} opacity={0.5} />
                    </div>
                    <p className="font-medium">Không tìm thấy người dùng nào.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
