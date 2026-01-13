"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { doc, setDoc, updateDoc, collection, getDocs, onSnapshot } from "firebase/firestore";
import { Save, Image as ImageIcon, ArrowLeft, Loader2, Plus, GripVertical, Trash2, Pencil, Search, Check } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// --- Interfaces ---
interface Topic {
    id: string;
    title: string;
    desc: string;
    backgroundImage?: string;
}

interface Lesson {
    id: string; // Internal UUID for the lesson item in the path (to allow duplicates if needed, or stable key)
    ref: string; // The Topic ID
    title: string;
    desc?: string;
    backgroundImage?: string;
}

interface PathFormProps {
  initialData?: {
    id: string;
    title: string;
    desc: string;
    backgroundImage?: string;
    lessons: Lesson[];
  };
  isEditing?: boolean;
}

export default function PathForm({ initialData, isEditing = false }: PathFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    desc: initialData?.desc || "",
    backgroundImage: initialData?.backgroundImage || "",
  });
  
  const [lessons, setLessons] = useState<Lesson[]>(initialData?.lessons || []);
  
  // Topic Picker State
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  // Upload State
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Topics for Picker
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "topics"), (snap) => {
        setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Topic)));
    });
    return () => unsub();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "wg9hpbkk");
    data.append("cloud_name", "dztiz0hpe");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dztiz0hpe/image/upload",
        { method: "POST", body: data }
      );
      const uploadedImage = await res.json();
      if (!res.ok) throw new Error(uploadedImage.error?.message || "Upload failed");

      setFormData((prev) => ({ ...prev, backgroundImage: uploadedImage.secure_url }));
      toast.success("Tải ảnh thành công!");
    } catch (error: any) {
        toast.error(`Lỗi upload ảnh: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddLesson = (topic: Topic) => {
    // Check for duplicates
    if (lessons.some(l => l.ref === topic.id)) {
        toast.warning("Chủ đề này đã được thêm vào lộ trình rồi!");
        return;
    }

    // Add Topic as a Lesson
    const newLesson: Lesson = {
        id: crypto.randomUUID(),
        ref: topic.id,
        title: topic.title,
        desc: topic.desc,
        backgroundImage: topic.backgroundImage
    };
    setLessons(prev => [...prev, newLesson]);
    setIsPickerOpen(false);
    toast.success("Đã thêm bài học");
  };

  const handleRemoveLesson = (lessonId: string) => {
      setLessons(prev => prev.filter(l => l.id !== lessonId));
  };

  const handleMoveLesson = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === lessons.length - 1) return;
      
      const newLessons = [...lessons];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newLessons[index], newLessons[targetIndex]] = [newLessons[targetIndex], newLessons[index]];
      setLessons(newLessons);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Vui lòng nhập tiêu đề lộ trình");

    setLoading(true);
    try {
      // Optimize storage & Sanitize data (Firebase strictly forbids undefined)
      const optimizedLessons = lessons.map(l => ({
          id: l.id || crypto.randomUUID(), 
          ref: l.ref || "unknown_ref",
          title: l.title || "Untitled Lesson"
      }));

      // Ensure no undefined values in payload
      const payload = {
          title: formData.title || "",
          desc: formData.desc || "",
          backgroundImage: formData.backgroundImage || "",
          lessons: optimizedLessons, 
          updatedAt: new Date().toISOString()
      };

      if (isEditing && initialData?.id) {
        await updateDoc(doc(db, "learning_paths", initialData.id), payload);
        toast.success("Đã cập nhật lộ trình!");
      } else {
        const newRef = doc(collection(db, "learning_paths"));
        await setDoc(newRef, { ...payload, createdAt: new Date().toISOString() });
        toast.success("Đã tạo lộ trình mới!");
      }
      router.push("/admin/explore/paths");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi lưu (Kiểm tra console)");
    } finally {
      setLoading(false);
    }
  };

  // Filter Topics for Picker (Search + Exclude already added)
  const filteredTopics = topics
    .filter(t => t.title?.toLowerCase().includes(pickerSearch.toLowerCase()))
    .filter(t => !lessons.some(l => l.ref === t.id));

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link 
            href="/admin/explore/paths" 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
            <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          {isEditing ? "Chỉnh Sửa Lộ Trình" : "Tạo Lộ Trình Mới"}
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Path Details */}
          <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Pencil size={18} className="text-blue-400" />
                      Thông tin chung
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Image */}
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Ảnh Bìa Lộ Trình</label>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full aspect-video rounded-xl border-2 border-dashed border-slate-700 hover:border-blue-500 cursor-pointer overflow-hidden relative group bg-slate-950/50 ${uploading ? "opacity-50" : ""}`}
                        >
                            {formData.backgroundImage ? (
                                <img src={formData.backgroundImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span className="text-xs">Chọn ảnh</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} accept="image/*" />
                        </div>
                        {/* URL Input */}
                        <div className="mt-3">
                            <input 
                                type="text" 
                                placeholder="Hoặc dán đường dẫn (URL) ảnh tại đây..." 
                                value={formData.backgroundImage}
                                onChange={(e) => setFormData(p => ({ ...p, backgroundImage: e.target.value }))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500 placeholder:text-slate-600"
                            />
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-slate-300">Tên Lộ Trình</label>
                            <input 
                                value={formData.title}
                                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="VD: Web Development..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-300">Mô Tả</label>
                            <textarea 
                                value={formData.desc}
                                onChange={e => setFormData(p => ({ ...p, desc: e.target.value }))}
                                className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white mt-1 h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Mô tả về lộ trình này..."
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading || uploading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Lưu Lộ Trình
                    </button>
                  </div>
              </div>
          </div>

          {/* RIGHT: Lesson Builder */}
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[500px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <GripVertical size={18} className="text-blue-400" />
                        Danh sách bài học ({lessons.length})
                    </h3>
                    <button 
                        onClick={() => setIsPickerOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-green-400 font-bold rounded-lg transition-colors border border-green-500/20 hover:border-green-500/50"
                    >
                        <Plus size={18} />
                        Thêm Bài Học
                    </button>
                  </div>

                  <div className="space-y-3">
                      {lessons.map((lesson, idx) => (
                          <div key={lesson.id} className="flex items-center gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl group hover:border-blue-500/30 transition-all">
                              {/* Order Controls */}
                              <div className="flex flex-col gap-1 text-slate-500">
                                  <button onClick={() => handleMoveLesson(idx, 'up')} className="hover:text-white disabled:opacity-30" disabled={idx === 0}>▲</button>
                                  <span className="text-xs font-bold text-center w-5">{idx + 1}</span>
                                  <button onClick={() => handleMoveLesson(idx, 'down')} className="hover:text-white disabled:opacity-30" disabled={idx === lessons.length - 1}>▼</button>
                              </div>

                              {/* Thumbnail */}
                              <div className="w-16 h-16 bg-slate-900 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700">
                                  {lesson.backgroundImage ? (
                                      <img src={lesson.backgroundImage} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={16} /></div>
                                  )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-bold truncate">{lesson.title}</h4>
                                  <p className="text-slate-500 text-xs truncate">{lesson.desc}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[10px] uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                                        Source: {topics.find(t => t.id === lesson.ref)?.title || "Unknown"}
                                    </span>
                                  </div>
                              </div>

                              {/* Actions */}
                              <button 
                                onClick={() => handleRemoveLesson(lesson.id)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      ))}

                      {lessons.length === 0 && (
                          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                              <p>Chưa có bài học nào</p>
                              <p className="text-sm mt-1">Bấm "Thêm Bài Học" để bắt đầu xây dựng lộ trình</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* TOPIC PICKER MODAL */}
      {isPickerOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white">Chọn Chủ Đề</h3>
                      <button onClick={() => setIsPickerOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                  
                  <div className="p-4 border-b border-slate-800">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                          <input 
                              autoFocus
                              value={pickerSearch}
                              onChange={e => setPickerSearch(e.target.value)}
                              placeholder="Tìm kiếm chủ đề..."
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredTopics.map(topic => (
                            <button
                                key={topic.id}
                                onClick={() => handleAddLesson(topic)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800 transition-colors group text-left border border-transparent hover:border-slate-700"
                            >
                                <div className="w-12 h-12 bg-slate-950 rounded-lg overflow-hidden flex-shrink-0">
                                    {topic.backgroundImage && <img src={topic.backgroundImage} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">{topic.title}</h4>
                                    <p className="text-slate-500 text-xs line-clamp-1">{topic.desc}</p>
                                </div>
                                <Plus size={20} className="text-slate-600 group-hover:text-blue-400" />
                            </button>
                        ))}
                        {filteredTopics.length === 0 && (
                            <p className="text-center text-slate-500 py-10">Không tìm thấy chủ đề phù hợp</p>
                        )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
