"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { Save, Image as ImageIcon, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface TopicFormProps {
  initialData?: {
    id: string;
    title: string;
    desc: string;
    backgroundImage?: string;
    level?: string;
    type?: string;
    content?: string;
  };
  isEditing?: boolean;
}

export default function TopicForm({ initialData, isEditing = false }: TopicFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    desc: initialData?.desc || "",
    backgroundImage: initialData?.backgroundImage || "",
    level: initialData?.level || "",
    type: initialData?.type || "",
    content: initialData?.content || "",
  });

  // Image Upload Logic (Reusable from ProductForm/Profile)
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error("Upload error:", error);
      toast.error(`Lỗi khi tải ảnh: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error("Vui lòng nhập tiêu đề");

    setLoading(true);
    try {
      if (isEditing && initialData?.id) {
        await updateDoc(doc(db, "topics", initialData.id), {
            ...formData,
            updatedAt: new Date().toISOString()
        });
        toast.success("Cập nhật chủ đề thành công!");
      } else {
        // Create new
        const newRef = doc(collection(db, "topics"));
        await setDoc(newRef, {
            ...formData,
            createdAt: new Date().toISOString()
        });
        toast.success("Tạo chủ đề mới thành công!");
      }
      router.push("/admin/explore/topics");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Có lỗi xảy ra khi lưu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link 
            href="/admin/explore/topics" 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
            <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          {isEditing ? "Chỉnh Sửa Chủ Đề" : "Thêm Chủ Đề Mới"}
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid md:grid-cols-3 gap-8">
              {/* Left Column: Image */}
              <div className="col-span-1 space-y-4">
                  <label className="block text-sm font-bold text-slate-300">Ảnh Bìa</label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        relative w-full aspect-square rounded-2xl border-2 border-dashed border-slate-700 
                        flex flex-col items-center justify-center cursor-pointer overflow-hidden group
                        hover:border-green-500 transition-colors bg-slate-950/50
                        ${uploading ? "opacity-50 pointer-events-none" : ""}
                    `}
                  >
                        {formData.backgroundImage ? (
                            <img 
                                src={formData.backgroundImage} 
                                alt="Preview" 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                        ) : (
                            <div className="text-center p-4">
                                <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2 group-hover:text-green-500 transition-colors" />
                                <span className="text-sm text-slate-500 font-medium">Chọn ảnh</span>
                            </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <span className="text-white font-medium text-sm border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                Thay đổi
                             </span>
                        </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    hidden 
                    accept="image/*"
                  />
                  {uploading && <p className="text-center text-xs text-green-400 animate-pulse font-medium">Đang tải ảnh lên...</p>}

                  {/* URL Input */}
                  <div className="mt-3">
                    <input 
                        type="text" 
                        placeholder="Hoặc dán URL ảnh..." 
                        value={formData.backgroundImage}
                        onChange={(e) => setFormData(prev => ({ ...prev, backgroundImage: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-green-500 placeholder:text-slate-600"
                    />
                  </div>
              </div>

              {/* Right Column: Inputs */}
              <div className="col-span-2 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Tiêu Đề</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 font-medium"
                        placeholder="Nhập tên chủ đề..."
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Cấp Độ</label>
                        <input
                            type="text"
                            value={formData.level}
                            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 placeholder:text-slate-600"
                            placeholder="VD: Beginner..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Loại</label>
                        <input
                            type="text"
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 placeholder:text-slate-600"
                            placeholder="VD: Lesson..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Mô Tả Ngắn</label>
                    <textarea
                        value={formData.desc}
                        onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
                        className="w-full h-32 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600 resize-none"
                        placeholder="Mô tả ngắn về chủ đề này..."
                    />
                </div>
              </div>
          </div>

          {/* Bottom Section: Content */}
          <div className="col-span-3">
              <label className="block text-sm font-bold text-slate-300 mb-2">Nội Dung Chi Tiết</label>
              <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-[500px] bg-slate-950 border border-slate-800 rounded-xl px-6 py-4 text-slate-300 font-mono text-sm outline-none focus:border-green-500 resize-y leading-relaxed"
                  placeholder="Nhập nội dung bài học..."
              />
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
                type="submit"
                disabled={loading || uploading}
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isEditing ? "Lưu Thay Đổi" : "Tạo Chủ Đề"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
