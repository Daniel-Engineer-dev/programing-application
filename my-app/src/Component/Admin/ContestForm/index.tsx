"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ParticipantsTab from "./ParticipantsTab";
import { ArrowLeft, Save, Trophy, Calendar, Clock, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import ProblemPicker from "./ProblemPicker";
import { db } from "@/src/api/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";

type ProblemItem = {
  id: string; // The Label like A, B, C...
  problemID: string; // The actual ref ID
  title: string;
};

type ContestData = {
  id?: string; // Optional for creation
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problems: ProblemItem[];
};

type Props = {
  initialData?: any;
  onSubmit: (data: any) => void;
  isEdit: boolean;
};


// ... imports

// ...
export default function ContestForm({ initialData, onSubmit, isEdit }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'general' | 'participants'>('general');
  const [formData, setFormData] = useState<ContestData>({
    id: "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    startTime: "",
    endTime: "",
    problems: initialData?.problems || [],
  });

  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (initialData) {
        // Helper to format Date/ISO to "YYYY-MM-DDThh:mm" for input
        const toInputFormat = (isoStr: string) => {
            if (!isoStr) return "";
            try {
                // Parse the ISO string to a Date object first
                const date = new Date(isoStr);
                if (isNaN(date.getTime())) return "";

                // Get local ISO string (part before the 'Z'/'GMT') offset
                // Trick: use the same shim as the legacy converter or simple string manipulation if it's already standard ISO
                // Actually, simplest way for local datetime input:
                const pad = (n: number) => n < 10 ? '0'+n : n;
                return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            } catch (e) {
                return "";
            }
        };

        let startStr = "";
        let endStr = "";

        // Case 1: Legacy "time" string
        if (!initialData.startTime && initialData.time) {
             let timeStr = initialData.time
                .replace(" at ", " ")
                .replace(/UTC([+-]\d+)/, "GMT$1")
                .replace(/\u202F/g, " ");
             
             if (timeStr.match(/00:\d{2}:\d{2}\s*AM/)) {
                timeStr = timeStr.replace("00:", "12:");
             }
             
             const startDate = new Date(timeStr);
             startStr = toInputFormat(startDate.toISOString());

             if (initialData.length) {
                 const endDate = new Date(startDate.getTime() + Number(initialData.length) * 60 * 1000);
                 endStr = toInputFormat(endDate.toISOString());
             }
        } 
        // Case 2: Standard "startTime" / "endTime" ISO fields
        else {
             startStr = toInputFormat(initialData.startTime);
             endStr = toInputFormat(initialData.endTime);
        }

        setFormData(prev => ({
            ...prev,
            title: initialData.title || "",
            description: initialData.description || "",
            problems: initialData.problems || [],
            startTime: startStr,
            endTime: endStr
        }));
    }
  }, [initialData]);





  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict Input Validation
    if (!formData.title?.trim()) return alert("Vui lòng nhập tên cuộc thi!");
    if (!isEdit && !formData.id?.trim()) return alert("Vui lòng nhập ID cuộc thi!");
    if (!formData.startTime || !formData.endTime) return alert("Vui lòng chọn đầy đủ thời gian bắt đầu và kết thúc!");
    if (formData.problems.length === 0) return alert("Vui lòng thêm ít nhất một bài tập vào cuộc thi!");

    // Date Logic Validation
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);

    if (end <= start) {
        alert("Thời gian kết thúc phải sau thời gian bắt đầu!");
        return;
    }

    const lengthMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
    
    // Format: "January 5, 2026 at 12:00:00 AM UTC+7"
    // Note: date-fns 'hh' is 01-12. If the user strictly needs 00 AM, that's non-standard.
    // We will use standard 12-hour format which the app parses correctly.
    // Hardcoding UTC+7 as per user context and screenshot.
    const timeStr = `${format(start, "MMMM d, yyyy 'at' hh:mm:ss a")} UTC+7`;

    // Exclude startTime and endTime from database payload
    const { startTime, endTime, ...rest } = formData;

    const submissionData = {
        ...rest,
        id: formData.id, // Pass ID for creation
        time: timeStr, 
        length: lengthMinutes,
        participants: initialData?.participants ?? 0 
    };

    onSubmit(submissionData);
  };

  const handleDelete = async () => {
      if (!initialData?.id) return;
      if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa cuộc thi này? Hành động này không thể hoàn tác!")) return;
      
      try {
          // Assuming db is imported
          await import("firebase/firestore").then(async ({ deleteDoc, doc }) => {
               await deleteDoc(doc(db, "contests", initialData.id));
          });
          
          router.push("/admin/contests");
          router.refresh(); // Ensure the list is fresh
      } catch (e) {
          console.error(e);
          alert("Lỗi khi xóa cuộc thi");
      }
  };

  const activeProblemIds = formData.problems.map(p => p.problemID);

  const handleAddProblem = (p: { id: string, title: string }) => {
    const nextLabel = String.fromCharCode(65 + formData.problems.length); // A, B, C...
    const newProblem: ProblemItem = {
        id: nextLabel,
        problemID: p.id,
        title: p.title
    };

    setFormData(prev => ({
        ...prev,
        problems: [...prev.problems, newProblem]
    }));
    setShowPicker(false);
  };

  const removeProblem = (problemID: string) => {
    setFormData(prev => {
        const filtered = prev.problems.filter(p => p.problemID !== problemID);
        // Re-assign labels A, B, C...
        const remapped = filtered.map((p, idx) => ({
            ...p,
            id: String.fromCharCode(65 + idx)
        }));
        return { ...prev, problems: remapped };
    });
  };
// ...
  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <Link href="/admin/contests" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-bold uppercase tracking-wider">
            <ArrowLeft size={16} /> Quay lại danh sách
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-100 flex items-center gap-3">
                <span className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-500/30 text-yellow-500">
                    <Trophy size={32} />
                </span>
                {isEdit ? `Chỉnh Sửa: ${initialData.title}` : "Tạo Cuộc Thi Mới"}
            </h1>
      </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto mb-8 w-fit mx-auto">
        {[
            { id: 'general', label: 'Thông Tin & Bài Tập' },
            { id: 'participants', label: 'Thí Sinh & Kết Quả' }
        ].map(t => (
            <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === t.id 
                    ? "bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-sm border border-slate-600" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
            >
                {t.label}
            </button>
        ))}
      </div>

      {activeTab === 'participants' && initialData && initialData.id ? (
          <ParticipantsTab contestId={initialData.id} />
      ) : (activeTab === 'participants' && !initialData?.id) ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
              Vui lòng tạo cuộc thi trước khi quản lý thí sinh.
          </div>
      ) : (
      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
             {/* General Info Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-slate-300 border-b border-slate-800 pb-4">Thông Tin Chung</h3>
                
                {!isEdit && (
                    <div className="space-y-2 group">
                        <label className="text-sm font-medium text-slate-400 group-focus-within:text-yellow-400 transition-colors uppercase text-xs font-bold">
                            ID Cuộc Thi (Slug URL) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            required
                            pattern="[a-z0-9-_]+"
                            title="Chỉ dùng chữ thường, số, gạch ngang (-) hoặc gạch dưới (_)"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-slate-100 transition-all font-mono font-bold text-lg placeholder:text-slate-700 shadow-inner"
                            placeholder="vd: weekly-contest-101"
                            value={formData.id}
                            onChange={e => setFormData({...formData, id: e.target.value})}
                        />
                        <p className="text-xs text-slate-500">ID này sẽ xuất hiện trên URL. Không thể thay đổi sau khi tạo.</p>
                    </div>
                )}

                <div className="space-y-2 group">
                    <label className="text-sm font-medium text-slate-400 group-focus-within:text-yellow-400 transition-colors uppercase text-xs font-bold">Tên Cuộc Thi</label>
                    <input 
                        type="text" 
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-slate-100 transition-all font-bold text-lg placeholder:text-slate-700 shadow-inner"
                        placeholder="VD: Weekly Contest 101"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                </div>

                <div className="space-y-2 group">
                    <label className="text-sm font-medium text-slate-400 group-focus-within:text-yellow-400 transition-colors uppercase text-xs font-bold">Mô Tả / Nội Quy</label>
                    <textarea 
                        rows={5}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 text-slate-300 transition-all shadow-inner resize-none"
                        placeholder="Mô tả nội dung cuộc thi, luật lệ..."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>
            </div>

             {/* Additional Info Card */}
            {/* REMOVED allowedLanguages input to revert to stable state */}

            {/* Time Settings Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                 <h3 className="text-lg font-bold text-slate-300 border-b border-slate-800 pb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-400" /> Thời Gian Tổ Chức
                 </h3>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2 group">
                        <label className="text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors uppercase text-xs font-bold">Thời Gian Bắt Đầu</label>
                        <input 
                            type="datetime-local" 
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-slate-200 transition-all shadow-inner [color-scheme:dark]"
                            value={formData.startTime}
                            onChange={e => setFormData({...formData, startTime: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2 group">
                        <label className="text-sm font-medium text-slate-400 group-focus-within:text-blue-400 transition-colors uppercase text-xs font-bold">Thời Gian Kết Thúc</label>
                        <input 
                            type="datetime-local" 
                            required
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-slate-200 transition-all shadow-inner [color-scheme:dark]"
                            value={formData.endTime}
                            onChange={e => setFormData({...formData, endTime: e.target.value})}
                        />
                    </div>
                 </div>
            </div>
        </div>

        {/* Right Column: Problems */}
        <div className="col-span-1 space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 h-full flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                     <h3 className="text-lg font-bold text-slate-300">Danh Sách Bài Tập</h3>
                     <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-bold">{formData.problems.length}</span>
                </div>
                
                <div className="flex-1 space-y-3 min-h-[300px]">
                    {formData.problems.map((p, idx) => (
                        <div key={p.problemID || idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-all gap-3">
                            <span className="text-yellow-500 font-bold text-sm w-6 h-6 flex-shrink-0 flex items-center justify-center bg-yellow-500/10 rounded">{p.id}</span>
                            
                            <div className="flex-1 min-w-0">
                                <input 
                                    type="text"
                                    value={p.title}
                                    onChange={(e) => {
                                        const newProblems = [...formData.problems];
                                        newProblems[idx].title = e.target.value;
                                        setFormData({...formData, problems: newProblems});
                                    }}
                                    className="w-full bg-transparent border-b border-transparent hover:border-slate-700 focus:border-yellow-500 focus:outline-none text-slate-200 font-bold text-sm py-1 transition-all"
                                    placeholder="Tên bài tập..."
                                />
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    ID: {p.problemID ? p.problemID.slice(0, 8) : "N/A"}...
                                </div>
                            </div>

                            <button 
                                type="button"
                                onClick={() => removeProblem(p.problemID)}
                                className="text-slate-600 hover:text-red-400 p-1.5 hover:bg-slate-900 rounded-lg transition-colors flex-shrink-0"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {formData.problems.length === 0 && (
                        <div className="text-center py-12 px-4 text-slate-500 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                            Chưa có bài tập nào.
                        </div>
                    )}
                </div>

                <button 
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-all border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2"
                >
                    <Plus size={18} /> Thêm Bài Tập
                </button>
            </div>
            
            <button 
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
                <Save size={20} /> {isEdit ? "Lưu Thay Đổi" : "Tạo Cuộc Thi"}
            </button>
        </div>
      </form>
      )}

      {showPicker && (
         <ProblemPicker 
            excludeIds={activeProblemIds} 
            onSelect={handleAddProblem} 
            onClose={() => setShowPicker(false)} 
         />
      )}
    </div>
  );
}
