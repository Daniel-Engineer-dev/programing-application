"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/authContext";
import { db, storage, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { getCroppedImg } from "@/utils/cropImage";
import Cropper from "react-easy-crop";
import { User, Mail, Lock, Camera, Save, X } from "lucide-react";
export default function ProfilePage() {
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    avatar: "",
  });

  // State hỗ trợ thay đổi
  const [initialUsername, setInitialUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const fetchedData = {
            username: data.username || "",
            email: data.email || user.email || "",
            avatar: data.avatar || user.photoURL || "/avatar.png",
          };
          setProfileData(fetchedData);
          setInitialUsername(data.username || ""); // Lưu để kiểm tra trùng
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [user]);
  // 1. Khi chọn file, chỉ đọc file để hiện lên khung cắt, chưa upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        setImageToCrop(reader.result as string);
      };
    }
  };

  const onCropComplete = (activeArea: any, completedAreaPixels: any) => {
    setCroppedAreaPixels(completedAreaPixels);
  };

  // 2. Hàm thực hiện cắt và gửi lên Cloudinary
  const handleUploadCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    if (!user || !user.uid) return;
    setIsUpdating(true);
    try {
      // Cắt ảnh
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "avatar.jpg", {
        type: "image/jpeg",
      });

      // Upload lên Cloudinary
      const formData = new FormData();
      formData.append("file", croppedFile);
      formData.append("upload_preset", "wg9hpbkk");
      formData.append("cloud_name", "dztiz0hpe");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dztiz0hpe/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await response.json();
      const downloadURL = data.secure_url;

      // Cập nhật Firestore
      await updateDoc(doc(db, "users", user.uid), { avatar: downloadURL });

      setProfileData((prev) => ({ ...prev, avatar: downloadURL }));
      setImageToCrop(null); // Đóng khung cắt
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xử lý ảnh!");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;

    // Validate mật khẩu
    if (newPassword && newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsUpdating(true);
    try {
      // 1. Kiểm tra và cập nhật Username (Firestore)
      if (profileData.username !== initialUsername) {
        // Kiểm tra xem username mới có bị trùng không
        const q = query(
          collection(db, "users"),
          where("username", "==", profileData.username)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          alert("Tên đăng nhập này đã có người sử dụng!");
          setIsUpdating(false);
          return;
        }
        await updateDoc(doc(db, "users", user.uid), {
          username: profileData.username,
        });
        setInitialUsername(profileData.username);
      }

      // 2. Cập nhật Email (chỉ trong Firestore, bỏ qua Firebase Auth để không cần xác thực)
      if (profileData.email !== user.email) {
        await updateDoc(doc(db, "users", user.uid), {
          email: profileData.email,
        });
      }

      // 3. Cập nhật Mật khẩu
      if (newPassword) {
        await updatePassword(user, newPassword);
        setNewPassword("");
        setConfirmPassword("");
      }

      alert("Cập nhật tất cả thông tin thành công!");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        alert(
          "Hành động bảo mật cao: Vui lòng đăng xuất và đăng nhập lại để thực hiện thay đổi này."
        );
      } else {
        alert("Lỗi: " + error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="text-white bg-slate-950 min-h-screen p-8 flex justify-center relative">
      {/* --- MODAL CẮT ẢNH --- */}
      {imageToCrop && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-xl bg-slate-900 rounded-xl overflow-hidden p-6 border border-slate-800">
            <h3 className="text-xl font-bold mb-4">Cắt ảnh đại diện</h3>

            <div className="relative h-80 w-full bg-slate-800 rounded-lg overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400 text-nowrap">
                  Phóng to
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadCroppedImage}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg bg-blue-600 font-bold hover:bg-blue-500 text-white text-sm transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Đang xử lý..." : "Cắt & Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2 text-white">Hồ sơ cá nhân</h1>
        <p className="text-slate-450 mb-8 text-base">
          Quản lý thông tin tài khoản và cài đặt bảo mật.
        </p>

        {/* Avatar Section */}
        <div className="flex items-center p-6 rounded-xl bg-slate-900 border border-slate-800 mb-8 transition-colors group">
          <div className="relative">
            <img
              src={profileData.avatar || "/avatar.png"}
              className="w-24 h-24 rounded-full border-2 border-slate-700 object-cover p-0.5 transition-all"
              alt="Avatar"
            />
          </div>
          <div className="ml-6 flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {loading ? "Đang tải..." : profileData.username}
            </h2>
            <p className="text-slate-450 flex items-center gap-2 text-sm">
              <Mail size={14} className="text-slate-500" />
              {loading ? "..." : profileData.email}
            </p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/*"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdating}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={16} />
            {isUpdating ? "Đang xử lý..." : "Thay đổi ảnh"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Account Info Header */}
          <div className="flex items-center gap-2 mb-4">
            <User size={18} className="text-slate-400" />
            <h3 className="text-lg font-bold text-white">Thông tin tài khoản</h3>
          </div>

          {/* Tên đăng nhập (Editable) */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} />
              Tên đăng nhập
            </label>
            <input
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 w-full px-4 py-2.5 rounded-lg text-white outline-none transition-colors"
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
            />
          </div>

          {/* Email (Editable) */}
          <div>
            <label className="block mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={12} />
              Địa chỉ Email
            </label>
            <input
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 w-full px-4 py-2.5 rounded-lg text-white outline-none transition-colors"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
            />
          </div>

          <div className="h-px bg-slate-900 my-8"></div>

          {/* Password Section */}
          <div className="flex items-center gap-2 mb-4">
            <Lock size={18} className="text-slate-400" />
            <h3 className="text-lg font-bold text-white">Bảo mật và mật khẩu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 w-full px-4 py-2.5 rounded-lg text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-blue-600 w-full px-4 py-2.5 rounded-lg text-white outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8">
            <button
              onClick={() => {
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors font-semibold text-sm flex items-center gap-2"
            >
              <X size={16} />
              Hủy bỏ
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 px-6 py-2.5 rounded-lg font-bold text-white transition-colors disabled:cursor-not-allowed text-sm flex items-center gap-2"
            >
              <Save size={16} />
              {isUpdating ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
