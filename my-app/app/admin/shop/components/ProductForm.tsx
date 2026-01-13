"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Save, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  price: number;
  image: string;
  spec: {
    brand: string;
    material: string;
    size: string;
    function: string;
    color: string;
    warranty: string;
    details: string;
  };
};

const defaultProduct: Product = {
  id: "",
  name: "",
  price: 0,
  image: "",
  spec: {
    brand: "",
    material: "",
    size: "",
    function: "",
    color: "",
    warranty: "",
    details: "",
  },
};

export default function ProductForm({ id }: { id?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product>(defaultProduct);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        try {
            const docSnap = await getDoc(doc(db, "products", id));
            if (docSnap.exists()) {
                setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
            } else {
                alert("Không tìm thấy sản phẩm!");
                router.push("/admin/shop");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setInitialLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.id || !product.name) return alert("Vui lòng nhập ID và Tên sản phẩm!");
    
    setLoading(true);
    try {
      await setDoc(doc(db, "products", product.id), product);
      alert(id ? "Cập nhật thành công!" : "Thêm mới thành công!");
      router.push("/admin/shop");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu sản phẩm!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Product, value: any) => {
    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (field: keyof Product["spec"], value: string) => {
    setProduct((prev) => ({
      ...prev,
      spec: { ...prev.spec, [field]: value },
    }));
  };

  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "wg9hpbkk"); // Sử dụng preset đã có
        formData.append("cloud_name", "dztiz0hpe");

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/dztiz0hpe/image/upload`,
            { method: "POST", body: formData }
        );
        const data = await response.json();
        if (data.secure_url) {
             handleChange("image", data.secure_url);
        } else {
             alert("Upload thất bại: " + (data.error?.message || "Unknown error"));
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi kết nối khi tải ảnh!");
    } finally {
        setUploading(false);
    }
  };

  if (initialLoading) return <div className="p-8 text-center text-slate-400">Đang tải dữ liệu...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/admin/shop")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> Quay lại danh sách
        </button>
        <h1 className="text-2xl font-bold text-white">{id ? "Chỉnh Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Basic Info & Image */}
        <div className="space-y-6">
            {/* ID & Basic Info */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Thông tin cơ bản</h3>
                <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Mã sản phẩm (ID) <span className="text-red-500">*</span></label>
                    <input
                        required
                        disabled={!!id} // Disable ID edit if updating
                        value={product.id}
                        onChange={(e) => handleChange("id", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono"
                        placeholder="KEYBOARD-01"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">ID là duy nhất và không thể thay đổi sau khi tạo.</p>
                </div>

                <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Tên sản phẩm <span className="text-red-500">*</span></label>
                    <input
                        required
                        value={product.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                        placeholder="Bàn phím cơ..."
                    />
                </div>

                 <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Giá bán (VNĐ) <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        required
                        min={0}
                        value={product.price === 0 ? "" : product.price}
                        onChange={(e) => handleChange("price", e.target.value === "" ? 0 : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono text-amber-400 font-bold"
                    />
                </div>
            </div>

            {/* Image Preview */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
                 <h3 className="text-lg font-bold text-white mb-4">Hình ảnh</h3>
                <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Link Ảnh (URL)</label>
                    <div className="flex gap-2">
                        <input
                            value={product.image}
                            onChange={(e) => handleChange("image", e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none text-xs truncate"
                            placeholder="https://..."
                        />
                        <label className={`flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                             <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={uploading}
                             />
                             <ImageIcon size={16} className="text-blue-400" />
                             <span className="text-xs font-bold text-white">{uploading ? "..." : "Upload"}</span>
                        </label>
                    </div>
                </div>
                <div className="mt-4 aspect-square bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-center overflow-hidden relative group">
                    {product.image ? (
                        <div className="relative w-full h-full">
                            <img src={product.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-slate-500">
                            <ImageIcon size={40} className="mb-2 opacity-50" />
                            <span className="text-xs">Chưa có ảnh</span>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column: Specs */}
        <div className="md:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
            <h3 className="text-lg font-bold text-white mb-6">Thông số kỹ thuật</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Thương hiệu</label>
                    <input
                        value={product.spec.brand}
                        onChange={(e) => handleSpecChange("brand", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Chất liệu</label>
                    <input
                        value={product.spec.material}
                        onChange={(e) => handleSpecChange("material", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Kích thước</label>
                    <input
                        value={product.spec.size}
                        onChange={(e) => handleSpecChange("size", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Màu sắc</label>
                    <input
                        value={product.spec.color}
                        onChange={(e) => handleSpecChange("color", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Chức năng</label>
                    <input
                        value={product.spec.function}
                        onChange={(e) => handleSpecChange("function", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>
                 <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Bảo hành</label>
                    <input
                        value={product.spec.warranty}
                        onChange={(e) => handleSpecChange("warranty", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-1">Mô tả chi tiết</label>
                    <textarea
                        rows={4}
                        value={product.spec.details}
                        onChange={(e) => handleSpecChange("details", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:border-blue-500 outline-none resize-none"
                    />
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t border-slate-700">
        <button
            type="submit"
             disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-green-600/20 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Save size={24} />
            {loading ? "Đang lưu..." : "Lưu Sản Phẩm"}
        </button>
      </div>
    </form>
  );
}
