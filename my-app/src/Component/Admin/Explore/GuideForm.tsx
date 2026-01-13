"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { doc, setDoc, updateDoc, collection } from "firebase/firestore";
import { Save, Image as ImageIcon, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface GuideFormProps {
  initialData?: {
    id: string;
    title: string;
    author: string;
    level: string;
    type: string;
    desc: string;
    htmlContent: string;
    backgroundImage?: string;
  };
  isEditing?: boolean;
}

export default function GuideForm({ initialData, isEditing = false }: GuideFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    author: initialData?.author || "",
    level: initialData?.level || "",
    type: initialData?.type || "",
    desc: initialData?.desc || "",
    htmlContent: initialData?.htmlContent || "",
    backgroundImage: initialData?.backgroundImage || "",
  });

  // Image Upload Logic
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
      
      setFormData((prev) => ({ ...prev, backgroundImage: uploadedImage.secure_url || "" }));
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
        await updateDoc(doc(db, "guides", initialData.id), {
            ...formData,
            updatedAt: new Date().toISOString()
        });
        toast.success("Cập nhật hướng dẫn thành công!");
      } else {
        const newRef = doc(collection(db, "guides"));
        await setDoc(newRef, {
            ...formData,
            createdAt: new Date().toISOString()
        });
        toast.success("Tạo hướng dẫn mới thành công!");
      }
      router.push("/admin/explore/guides");
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Có lỗi xảy ra khi lưu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link 
            href="/admin/explore/guides" 
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
            <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          {isEditing ? "Chỉnh Sửa Hướng Dẫn" : "Viết Hướng Dẫn Mới"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Metadata */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-slate-300 mb-2">Ảnh Bìa</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative w-full aspect-video rounded-xl border-2 border-dashed border-slate-700 
                            flex flex-col items-center justify-center cursor-pointer overflow-hidden group
                            hover:border-orange-500 transition-colors bg-slate-950/50
                            ${uploading ? "opacity-50 pointer-events-none" : ""}
                        `}
                      >
                            {formData.backgroundImage ? (
                                <img 
                                    src={formData.backgroundImage} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2 group-hover:text-orange-500 transition-colors" />
                                    <span className="text-xs text-slate-500 font-medium">Chọn ảnh từ máy</span>
                                </div>
                            )}
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                      
                      {/* URL Input */}
                      <div className="mt-3">
                        <input 
                            type="text" 
                            placeholder="Hoặc dán đường dẫn (URL) ảnh tại đây..." 
                            value={formData.backgroundImage}
                            onChange={(e) => setFormData(prev => ({ ...prev, backgroundImage: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-orange-500 placeholder:text-slate-600"
                        />
                      </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Tác Giả</label>
                    <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                        placeholder="Nhập tên tác giả..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Cấp Độ</label>
                        <input
                            type="text"
                            value={formData.level}
                            onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                            placeholder="VD: Beginner..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">Loại</label>
                        <input
                            type="text"
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-orange-500 placeholder:text-slate-600"
                            placeholder="VD: Blog..."
                        />
                      </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {isEditing ? "Lưu Thay Đổi" : "Đăng Bài"}
                  </button>
              </div>
          </div>

          {/* RIGHT COLUMN: Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Tiêu Đề Bài Viết</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none focus:border-orange-500 placeholder:font-normal"
                        placeholder="Nhập tiêu đề hấp dẫn..."
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Mô Tả Ngắn (Intro)</label>
                    <textarea
                        value={formData.desc}
                        onChange={(e) => setFormData(prev => ({ ...prev, desc: e.target.value }))}
                        className="w-full h-24 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500 resize-none"
                        placeholder="Đoạn giới thiệu ngắn gọn..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Nội Dung</label>
                    <textarea
                        value={formData.htmlContent}
                        onChange={(e) => setFormData(prev => ({ ...prev, htmlContent: e.target.value }))}
                        className="w-full h-[500px] bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm outline-none focus:border-orange-500 resize-y leading-relaxed"
                        placeholder="Nhập nội dung bài viết..."
                    />
                </div>
            </div>
          </div>

      </form>
    </div>
  );
}
