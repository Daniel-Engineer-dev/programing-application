"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { db, storage, auth } from "@/src/api/firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

export default function ProfilePage() {
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    avatar: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Lấy dữ liệu từ collection 'users' dùng UID trực tiếp
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfileData({
            username: data.username || "Chưa thiết lập",
            email: data.email || user.email || "",
            avatar: data.avatar || user.photoURL || "/avatar.png",
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // 2. Xử lý tải ảnh lên máy local
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUpdating(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Cập nhật Firestore
      await updateDoc(doc(db, "users", user.uid), { avatar: downloadURL });

      setProfileData((prev) => ({ ...prev, avatar: downloadURL }));
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (error) {
      alert("Lỗi khi tải ảnh lên!");
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Xử lý Lưu thay đổi (Mật khẩu & Email)
  const handleSaveChanges = async () => {
    if (!user) return;
    if (newPassword && newPassword !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsUpdating(true);
    try {
      // Cập nhật mật khẩu nếu có nhập
      if (newPassword) {
        await updatePassword(user, newPassword);
        alert("Đã cập nhật mật khẩu mới!");
      }

      alert("Cập nhật thông tin thành công!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        alert("Hành động này yêu cầu bạn phải đăng nhập lại gần đây.");
      } else {
        alert("Lỗi: " + error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="text-white bg-slate-950 min-h-screen p-8 flex justify-center">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2">Hồ sơ</h1>
        <p className="text-slate-400 mb-8">
          Thông tin cá nhân và quản lý tài khoản.
        </p>

        {/* Avatar Section */}
        <div className="flex items-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800 mb-10">
          <div className="relative group">
            <img
              src={profileData.avatar}
              className="w-24 h-24 rounded-full border-2 border-blue-500/50 object-cover p-1"
              alt="Avatar"
            />
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-bold text-white">
              {loading ? "Đang tải..." : profileData.username}
            </h2>
            <p className="text-slate-400">
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
            className="ml-auto bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all"
          >
            {isUpdating ? "Đang xử lý..." : "Thay đổi ảnh"}
          </button>
        </div>

        <div className="space-y-6">
          {/* Tên đăng nhập (Read Only) */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <input
              className="bg-slate-900/80 border border-slate-800 w-full px-4 py-3 rounded-xl text-slate-400 cursor-not-allowed outline-none"
              value={profileData.username}
              readOnly
            />
            <p className="mt-2 text-xs text-slate-500 italic">
              Tên đăng nhập được liên kết cố định với tài khoản.
            </p>
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-400 uppercase tracking-wider">
              Địa chỉ Email
            </label>
            <input
              className="bg-slate-900/80 border border-slate-800 w-full px-4 py-3 rounded-xl text-slate-400 cursor-not-allowed outline-none"
              value={profileData.email}
              readOnly
            />
          </div>

          <div className="h-px bg-slate-800 my-8"></div>

          {/* Password Section */}
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Đổi mật khẩu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-400">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/80 border border-slate-800 w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-400">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900/80 border border-slate-800 w-full px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-10">
            <button
              onClick={() => {
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="px-8 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-semibold"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSaveChanges}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 px-8 py-3 rounded-xl font-bold shadow-lg transition-all"
            >
              {isUpdating ? "Đang lưu..." : "Lưu thông tin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
