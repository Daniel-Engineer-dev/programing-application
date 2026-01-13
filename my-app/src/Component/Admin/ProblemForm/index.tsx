"use client";

import { useEffect, useState } from "react";
import { ProblemFormData, INITIAL_PROBLEM_DATA } from "./types";
import { db } from "@/src/api/firebase/firebase";
import { collection, addDoc, doc, updateDoc, writeBatch, serverTimestamp, getDoc, getDocs, deleteDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import BasicInfoTab from "./BasicInfoTab";
import DescriptionTab from "./DescriptionTab";
import ExamplesTab from "./ExamplesTab";
import TestCasesTab from "./TestCasesTab";
import EditorialTab from "./EditorialTab";
import CodeTemplatesTab from "./CodeTemplatesTab";
import { Save, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

type Props = {
  problemId?: string; // If provided, edit mode
};

export default function ProblemForm({ problemId }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<ProblemFormData>(INITIAL_PROBLEM_DATA);
  const [loading, setLoading] = useState(!!problemId);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "desc" | "templates" | "examples" | "testcases" | "editorial">("info");
  const [error, setError] = useState("");

  // Load data if edit mode
  useEffect(() => {
    if (problemId) {
      loadProblem(problemId);
    }
  }, [problemId]);

  const loadProblem = async (id: string) => {
    try {
      const docRef = doc(db, "problems", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        
        // Load Sub-collection Test Cases
        const tcSnap = await getDocs(collection(db, "problems", id, "testCases"));
        const testCases = tcSnap.docs.map(d => ({ 
            input: d.data().input || "", 
            output: d.data().output || d.data().expectedOutput || d.data().expected || "",
            isHidden: d.data().isHidden || false
        }));

        setFormData({
            ...INITIAL_PROBLEM_DATA,
            ...data,
            title: data.title || "", // Prevent null
            description: data.description || "", // Prevent null
            difficulty: data.difficulty || "Easy",
            id: snap.id,
            testCases,
        } as ProblemFormData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load problem data.");
    } finally {
      setLoading(false);
    }
  };

  const updateData = (updates: Partial<ProblemFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    // --- VALIDATION ---
    if (!formData.title.trim()) return setError("Vui lòng nhập Tiêu đề bài tập.");
    if (formData.tags.length === 0) return setError("Vui lòng thêm ít nhất 1 Tag (thể loại).");
    if (!formData.description.trim()) return setError("Vui lòng nhập Mô tả bài toán.");
    
    const validConstraints = formData.constraints.filter(c => c.trim().length > 0);
    if (validConstraints.length === 0) return setError("Vui lòng nhập ít nhất 1 Ràng buộc (Constraints).");

    const validExamples = formData.examples.filter(e => e.input.trim() && e.output.trim());
    if (validExamples.length === 0) return setError("Vui lòng nhập ít nhất 1 Ví dụ (Input/Output).");

    if (formData.testCases.length === 0) return setError("Vui lòng nhập ít nhất 1 Test Case.");
    
    // Check if at least one Driver Code is provided (Crucial for runner)
    const hasDriverCode = Object.values(formData.driverCodes).some(code => code.trim().length > 0);
    if (!hasDriverCode) return setError("Vui lòng nhập Driver Code (Code chấm) cho ít nhất 1 ngôn ngữ.");

    // Check Default Code corresponding to Driver Code? (Optional but good practice)
    // For now strict on Driver Code.

    setSaving(true);
    setError("");

    try {
      // 1. Prepare Main Doc Data
      const { testCases, ...mainDocData } = formData;
      
      let finalId = problemId;

      if (!problemId) {
        // CREATE
        const customId = formData.id?.trim();
        
        if (customId) {
            // Check if ID exists
            const existing = await getDoc(doc(db, "problems", customId));
            if (existing.exists()) {
                setError(`ID "${customId}" đã tồn tại. Vui lòng chọn ID khác.`);
                setSaving(false);
                return;
            }
            
            await setDoc(doc(db, "problems", customId), {
                ...mainDocData,
                createdAt: serverTimestamp(),
                likes: [], dislikes: [], stars: [],
            });
            finalId = customId;
        } else {
            const docRef = await addDoc(collection(db, "problems"), {
                ...mainDocData,
                createdAt: serverTimestamp(),
                likes: [], dislikes: [], stars: [],
            });
            finalId = docRef.id;
        }
      } else {
        // UPDATE
        await updateDoc(doc(db, "problems", problemId), {
            ...mainDocData,
            updatedAt: serverTimestamp(),
        });
      }

      if (finalId) {
        // 2. Handle Test Cases (Sub-collection)
        // Strategy: Delete all existing matches (simple wipe) and re-add. 
        // Note: For production with millions of users, better strategy needed. For now, this ensures data integrity.
        
        const batch = writeBatch(db);
        const tcRef = collection(db, "problems", finalId, "testCases");
        
        // Get existing to delete
        const existingSnaps = await getDocs(tcRef);
        existingSnaps.forEach(d => batch.delete(d.ref));
        
        // Add new
        testCases.forEach((tc, idx) => {
            const newDocRef = doc(tcRef, `testCase${idx + 1}`); // naming conventionally
            batch.set(newDocRef, tc);
        });

        await batch.commit();
        
        // Verify by simple alert or redirect
        alert("Problem saved successfully!");
        router.push("/admin/problems");
      }

    } catch (err) {
      console.error(err);
      setError("Failed to save problem. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải dữ liệu bài tập...</div>;

  const tabs = [
    { id: 'info', label: 'Thông Tin Cơ Bản' },
    { id: 'desc', label: 'Đề Bài' },
    { id: 'templates', label: 'Code Mẫu & Driver' },
    { id: 'examples', label: 'Ví Dụ & Ràng Buộc' },
    { id: 'testcases', label: 'Test Cases' },
    { id: 'editorial', label: 'Lời Giải' },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-950/80 sticky top-0 z-10 backdrop-blur-xl py-6 border-b border-slate-800 px-2 lg:-mx-2 lg:px-6 shadow-2xl shadow-slate-950/50">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-in slide-in-from-left-2">
                {problemId ? `Chỉnh Sửa: ${formData.title}` : "Tạo Bài Tập Mới"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">Quản lý nội dung bài tập, ví dụ và bộ test</p>
        </div>
        
        <div className="flex gap-4 items-center">
            {error && <span className="text-red-400 text-sm flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"><AlertCircle size={14} /> {error}</span>}
            
            {problemId && (
                <button 
                    onClick={async () => {
                         if (!confirm("CẢNH BÁO: Xóa bài tập này sẽ mất vĩnh viễn dữ liệu và test cases. Bạn có chắc không?")) return;
                         try {
                              setSaving(true);
                              await deleteDoc(doc(db, "problems", problemId));
                              router.push("/admin/problems");
                              router.refresh();
                         } catch(e) {
                             console.error(e);
                             setError("Xóa thất bại");
                             setSaving(false);
                         }
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 transition-all font-bold border border-red-500/20 hover:border-red-500/40"
                >
                    <Trash2 size={20} />
                </button>
            )}

            <button 
                onClick={handleSubmit} 
                disabled={saving}
                className="group relative bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5"
            >
                {saving ? (
                    "Đang lưu..." 
                ) : (
                    <>
                        <Save size={20} className="group-hover:scale-110 transition-transform" /> 
                        Lưu Thay Đổi
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto">
        {tabs.map(t => (
            <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === t.id 
                    ? "bg-slate-800 text-white shadow-sm" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
            >
                {t.label}
            </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 min-h-[500px]">
        {activeTab === 'info' && <BasicInfoTab data={formData} onChange={updateData} isEditMode={!!problemId} />}
        {activeTab === 'desc' && <DescriptionTab data={formData} onChange={updateData} />}
        {activeTab === 'templates' && <CodeTemplatesTab data={formData} onChange={updateData} />}
        {activeTab === 'examples' && <ExamplesTab data={formData} onChange={updateData} />}
        {activeTab === 'testcases' && <TestCasesTab data={formData} onChange={updateData} />}
        {activeTab === 'editorial' && <EditorialTab data={formData} onChange={updateData} />}
      </div>
    </div>
  );
}
