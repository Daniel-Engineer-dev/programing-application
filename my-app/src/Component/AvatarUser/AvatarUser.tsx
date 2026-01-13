"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Trophy, ShoppingBag, Settings, LogOut, User } from "lucide-react";
// Sign out
import { signOut } from "firebase/auth";
import { auth, db } from "@/src/api/firebase/firebase";
import { useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { useAuthContext } from "@/src/userHook/context/authContext";

type UserMenuProps = {
  name: string; // Tên mặc định truyền từ Props
};

export default function UserMenu({ name }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuthContext();
  const [userData, setUserData] = useState<{
    username?: string;
    email?: string;
    avatar?: string;
  }>({});
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Lắng nghe dữ liệu người dùng thời gian thực từ collection "users"
  useEffect(() => {
    if (!user?.uid) return;

    // Truy cập trực tiếp vào document có ID là UID (theo cấu trúc mới)
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onEsc);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Ưu tiên lấy username từ Firestore, nếu chưa có thì dùng props name
  const displayName = userData.username || name || "User";
  const avatarUrl = userData.avatar || user?.photoURL || "/avatar.png";

  return (
    <div className="relative" ref={ref}>
      {/* Nút avatar trên NavBar */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-blue-500 bg-white transition-transform active:scale-90"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Image
          className="object-cover"
          src={avatarUrl}
          alt={displayName}
          width={40}
          height={40}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 8 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-1 w-[300px]"
          >
            <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl ring-1 ring-black/10">
              {/* Header Profile */}
              <div className="flex items-center gap-3 px-4 py-5 text-white bg-slate-800/50">
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-blue-500">
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={48}
                    height={48}
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-bold">
                    {displayName}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {userData.email || user?.email}
                  </div>
                </div>
              </div>

              {/* 3 Quick Tiles (Sửa đường dẫn phù hợp với hệ thống setting mới) */}
              <div className="grid grid-cols-3 gap-2 px-3 py-3 border-t border-slate-800">
                <QuickTile
                  href="/routes/avatar/settings/saved"
                  iconPath="/list.png"
                  label="Danh sách"
                />
                <QuickTile
                  href="/routes/avatar/settings/notes"
                  iconPath="/notebook.png"
                  label="Ghi chú"
                />
                <QuickTile
                  href="/routes/avatar/settings/history"
                  iconPath="/progress.png"
                  label="Lịch sử"
                />
              </div>

              <div className="px-3 py-2 border-t border-slate-800 space-y-1">
                <MenuItem
                  href="/routes/avatar/points"
                  icon={Trophy}
                  label="Điểm thưởng"
                  right={
                    <span className="bg-yellow-600 text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold">
                      Mới
                    </span>
                  }
                />
                <MenuItem
                  href="/routes/avatar/settings/buy"
                  icon={ShoppingBag}
                  label="Mua hàng"
                />
                <MenuItem
                  href="/routes/avatar/settings"
                  icon={User}
                  label="Hồ sơ"
                />
              </div>

              {/* Sign Out Button */}
              <div className="px-3 py-2 border-t border-slate-800 bg-slate-950/30">
                <MenuItem
                  onClick={handleLogout}
                  icon={LogOut}
                  label="Đăng xuất"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub Components ---

function QuickTile({
  href,
  iconPath,
  label,
}: {
  href: string;
  iconPath: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-xl py-3 transition-colors hover:bg-blue-600/20 group"
    >
      <img
        src={iconPath}
        className="w-6 h-6 mb-1 opacity-80 group-hover:opacity-100 transition-opacity"
        alt={label}
      />
      <span className="text-[11px] text-slate-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </Link>
  );
}

function MenuItem({
  href,
  onClick,
  icon: Icon,
  label,
  right,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  right?: React.ReactNode;
}) {
  const content = (
    <>
      <span className="inline-flex items-center gap-3">
        <Icon size={18} className="text-slate-400 group-hover:text-blue-400" />
        <span className="text-slate-200 group-hover:text-white transition-colors">
          {label}
        </span>
      </span>
      {right}
    </>
  );

  const className =
    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[14px] transition-all hover:bg-slate-800 group cursor-pointer font-medium";

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button onClick={onClick} className={className} type="button">
      {content}
    </button>
  );
}
