"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { db, storage, auth } from "@/src/api/firebase/firebase";
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
import { getCroppedImg } from "@/src/utils/cropImage";
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
    <div className="text-white bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-900 min-h-screen p-8 flex justify-center relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* --- MODAL CẮT ẢNH --- */}
      {imageToCrop && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4">
          <div className="relative w-full max-w-xl bg-slate-900 rounded-2xl overflow-hidden p-6">
            <h3 className="text-xl font-bold mb-4">Cắt ảnh đại diện</h3>

            <div className="relative h-80 w-full bg-slate-800 rounded-lg overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1} // Tỉ lệ 1:1 cho hình vuông/tròn
                cropShape="round" // Hiển thị khung tròn
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
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="px-6 py-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUploadCroppedImage}
                  disabled={isUpdating}
                  className="px-6 py-2 rounded-xl bg-blue-600 font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  {isUpdating ? "Đang xử lý..." : "Cắt & Lưu"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="relative z-10 max-w-2xl w-full">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">Hồ sơ cá nhân</h1>
        <p className="text-slate-400 mb-10 text-lg">
          Quản lý thông tin tài khoản và cài đặt bảo mật.
        </p>

        {/* Avatar Section */}
        <div className="flex items-center p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-blue-900/20 backdrop-blur-xl border border-blue-500/30 mb-10 shadow-2xl hover:shadow-blue-500/10 transition-all group">
          <div className="relative">
            <img
              src={profileData.avatar || "/avatar.png"}
              className="w-28 h-28 rounded-full border-4 border-blue-500/50 object-cover p-1 shadow-lg shadow-blue-500/20 group-hover:border-blue-400/70 transition-all"
              alt="Avatar"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
          </div>
          <div className="ml-6 flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {loading ? "Đang tải..." : profileData.username}
            </h2>
            <p className="text-slate-400 flex items-center gap-2">
              <Mail size={14} />
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
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Camera size={16} />
            {isUpdating ? "Đang xử lý..." : "Thay đổi ảnh"}
          </button>
        </div>

        <div className="space-y-8">
          {/* Account Info Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <User size={20} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Thông tin tài khoản</h3>
          </div>

          {/* Tên đăng nhập (Editable) */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <User size={14} />
              Tên đăng nhập
            </label>
            <input
              className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 w-full px-5 py-3.5 rounded-xl text-white outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20 transition-all backdrop-blur-xl"
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
            />
          </div>

          {/* Email (Editable) */}
          <div>
            <label className="block mb-3 text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Mail size={14} />
              Địa chỉ Email
            </label>
            <input
              className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 w-full px-5 py-3.5 rounded-xl text-white outline-none focus:border-blue-400 focus:shadow-lg focus:shadow-blue-500/20 transition-all backdrop-blur-xl"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
            />
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent my-10"></div>

          {/* Password Section */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Lock size={20} className="text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Bảo mật và mật khẩu</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-3 text-sm font-semibold text-slate-400">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 w-full px-5 py-3.5 rounded-xl focus:border-blue-400 outline-none transition-all text-white focus:shadow-lg focus:shadow-blue-500/20 backdrop-blur-xl"
              />
            </div>
            <div>
              <label className="block mb-3 text-sm font-semibold text-slate-400">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-gradient-to-br from-slate-900/80 to-blue-900/20 border border-blue-500/30 w-full px-5 py-3.5 rounded-xl focus:border-blue-400 outline-none transition-all text-white focus:shadow-lg focus:shadow-blue-500/20 backdrop-blur-xl"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-12">
            <button
              onClick={() => {
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="px-8 py-3.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all font-semibold flex items-center gap-2"
            >
              <X size={18} />
              Hủy bỏ
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-blue-800 disabled:to-cyan-800 px-8 py-3.5 rounded-xl font-bold shadow-2xl hover:shadow-blue-500/50 transition-all disabled:cursor-not-allowed hover:scale-105 flex items-center gap-2"
            >
              <Save size={18} />
              {isUpdating ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
