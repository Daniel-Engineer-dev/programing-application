import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, writeBatch, updateDoc, increment, getDocs } from "firebase/firestore";
import { db } from "@/src/api/firebase/firebase";
import { Trash2, Search, Edit, Save, X, User } from "lucide-react";

type Participant = {
    uid: string;
    username: string;
    acceptedCount: number;
    penalty: number;
    email?: string;
};

export default function ParticipantsTab({ contestId }: { contestId: string }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0 });
    const [searchTerm, setSearchTerm] = useState("");
    
    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ acceptedCount: 0, penalty: 0 });

    useEffect(() => {
        if (!contestId) return;

        const q = query(
            collection(db, "contests", contestId, "leaderboard"),
            orderBy("acceptedCount", "desc"), 
            orderBy("penalty", "asc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ 
                uid: d.id, 
                ...d.data() 
            })) as Participant[];
            setParticipants(data);
            setStats({
                total: data.length
            });
            setLoading(false);
        });

        return () => unsub();
    }, [contestId]);


    const handleDelete = async (uid: string) => {
        if (!confirm("Cảnh báo: Xóa thí sinh này sẽ xóa toàn bộ kết quả, bài làm và hủy đăng ký của họ.")) return;
        
        try {
            const batch = writeBatch(db);
            
            // 1. Delete Leaderboard & Registration
            batch.delete(doc(db, "contests", contestId, "leaderboard", uid));
            batch.delete(doc(db, "contests", contestId, "registrations", uid));
            
            // 2. Delete Virtual Participation
            batch.delete(doc(db, "contests", contestId, "virtual_participations", uid));

            // 3. Decrement Count
            batch.update(doc(db, "contests", contestId), { participants: increment(-1) });

            // 4. Delete Submissions History (Contest Scoped)
            const submissionsRef = collection(db, "contests", contestId, "user", uid, "submissions");
            const subSnap = await getDocs(submissionsRef);
            subSnap.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        } catch (e) {
            console.error(e);
            alert("Lỗi khi xóa thí sinh");
        }
    };

    const startEdit = (p: Participant) => {
        setEditingId(p.uid);
        setEditForm({ acceptedCount: p.acceptedCount, penalty: p.penalty });
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await updateDoc(doc(db, "contests", contestId, "leaderboard", editingId), {
                acceptedCount: Number(editForm.acceptedCount),
                penalty: Number(editForm.penalty)
            });
            setEditingId(null);
        } catch (e) {
            alert("Lỗi cập nhật điểm");
        }
    };

    const filtered = participants.filter(p => 
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.uid.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats & Search */}
            <div className="flex gap-4">
                <div className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase">Tổng thí sinh</p>
                        <p className="text-2xl font-mono font-bold text-white">{stats.total}</p>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500  group-focus-within:text-blue-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên hoặc UID..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 text-slate-200 transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-950/50 text-slate-400 border-b border-slate-800 text-xs uppercase font-bold">
                        <tr>
                            <th className="px-6 py-4">#</th>
                            <th className="px-6 py-4">Thí Sinh</th>
                            <th className="px-6 py-4 text-center">Số Bài AC</th>
                            <th className="px-6 py-4 text-center">Penalty (h)</th>
                            <th className="px-6 py-4 text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filtered.map((p, idx) => (
                            <tr key={`participant-${p.uid}`} className="hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-4 text-slate-500 font-mono">{idx + 1}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-200">{p.username}</p>
                                            <p className="text-[10px] text-slate-500 font-mono">{p.uid}</p>
                                        </div>
                                    </div>
                                </td>
                                
                                {editingId === p.uid ? (
                                    <>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="number" 
                                                className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-green-400 focus:border-green-500 outline-none"
                                                value={editForm.acceptedCount}
                                                onChange={e => setEditForm({...editForm, acceptedCount: Number(e.target.value)})}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="number" 
                                                className="w-20 bg-slate-950 border border-slate-700 rounded p-1 text-center font-mono text-slate-300 focus:border-blue-500 outline-none"
                                                value={editForm.penalty}
                                                onChange={e => setEditForm({...editForm, penalty: Number(e.target.value)})}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={saveEdit} className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg"><Save size={16} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg"><X size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">{p.acceptedCount}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-slate-400">
                                            {p.penalty}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => startEdit(p)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg" title="Sửa kết quả">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(p.uid)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg" title="Xóa toàn bộ">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 {filtered.length === 0 && !loading && (
                    <div className="p-12 text-center text-slate-500">Chưa có thí sinh nào.</div>
                 )}
            </div>
        </div>
    );
}
