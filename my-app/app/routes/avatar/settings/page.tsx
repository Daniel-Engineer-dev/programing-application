"use client";
import React, { useState } from "react";
import Image from "next/image";
import { updateProfile } from "firebase/auth";
import { auth } from "@/src/api/firebase"; // nếu bạn dùng Firebase
import { toast } from "react-hot-toast"; // tùy chọn để hiển thị thông báo

export default function SettingsPage() {
  const user = auth.currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [theme, setTheme] = useState("light");

  const handleSave = async () => {
    try {
      if (user) {
        await updateProfile(user, {
          displayName: displayName.trim(),
          photoURL: photoURL.trim(),
        });
        toast.success("Profile updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Account Settings</h1>

      {/* Profile Section */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

        <div className="flex items-center space-x-6 mb-6">
          <Image
            src={photoURL || "/default-avatar.png"}
            alt="Avatar"
            width={80}
            height={80}
            className="rounded-full border"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avatar URL
            </label>
            <input
              type="text"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="Enter image URL"
              className="border p-2 rounded w-80"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className="border p-2 rounded w-full"
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </div>

      {/* Theme Section */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">Appearance</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setTheme("light")}
            className={`px-4 py-2 rounded-lg border ${
              theme === "light" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={`px-4 py-2 rounded-lg border ${
              theme === "dark" ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
