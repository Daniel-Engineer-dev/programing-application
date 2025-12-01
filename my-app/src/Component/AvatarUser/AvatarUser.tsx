"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  FlaskConical,
  ShoppingBag,
  Gamepad2,
  Settings,
  SunMedium,
  ChevronRight,
  LogOut,
} from "lucide-react";
//Sign out
import { signOut } from "firebase/auth";
import { auth } from "@/src/api/firebase/firebase";
import { useRouter } from "next/navigation";

type UserMenuProps = {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
};

export default function UserMenu({
  name,
  subtitle = "Access all features with our Premium subscription!",
  avatarUrl = "/avatar.png",
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
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
    router.push("/");
    await signOut(auth);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Nút avatar */}
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-white"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        <Image
          className="hover:cursor-pointer border"
          src={avatarUrl}
          alt={name}
          width={40}
          height={40}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 8 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-50 mt-1 w-[320px]"
          >
            <div className="overflow-hidden rounded-2xl border bg-slate-700 shadow-xl ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 text-white">
                <div className="h-12 w-12 overflow-hidden rounded-full ">
                  <Image src={avatarUrl} alt={name} width={52} height={52} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold">{name}</div>
                  {subtitle && (
                    <div className="mt-0.5 text-[13px] text-yellow-500">
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>

              <hr />

              {/* 3 ô nhanh */}
              <div className="grid grid-cols-3 gap-3 px-4 py-3 text-slate-300">
                <QuickTile href="/lists" name="list.png" label="My Lists" />
                <QuickTile
                  href="/notebook"
                  name="notebook.png"
                  label="Notebook"
                />
                <QuickTile
                  href="/progress"
                  name="progress.png"
                  label="Progress"
                />
              </div>

              {/* Points */}
              <div className="px-4 pb-1 text-slate-300">
                <MenuItem
                  href="/points"
                  icon={Trophy}
                  label="Points"
                  right={<span className="text-xs text-white">New</span>}
                />
              </div>

              <hr />

              <div className="px-4 py-2 text-slate-300">
                <MenuItem
                  href="/labs"
                  icon={FlaskConical}
                  label="Try New Features"
                />
                <MenuItem href="/orders" icon={ShoppingBag} label="Orders" />
                <MenuItem
                  href="/playgrounds"
                  icon={Gamepad2}
                  label="My Playgrounds"
                />
                <MenuItem
                  href="/routes/avatar/settings"
                  icon={Settings}
                  label="Settings"
                />

                {/* Appearance submenu */}
                <button
                  onClick={() => setAppearanceOpen((s) => !s)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-left text-[15px] hover:bg-blue-700 hover:text-white hover:font-bold hover:cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <SunMedium size={18} />
                    Appearance
                  </span>
                  <ChevronRight
                    size={18}
                    className={`transition-transform ${
                      appearanceOpen ? "rotate-90" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {appearanceOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="ml-8 mt-1 flex flex-col gap-1 overflow-hidden pb-1"
                    >
                      <AppearanceOption label="System" />
                      <AppearanceOption label="Light" />
                      <AppearanceOption label="Dark" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <hr />

              <div className="px-4 py-2 text-slate-300">
                <MenuItem
                  onClick={() => {
                    alert("Sign out");
                    handleLogout();
                  }}
                  icon={LogOut}
                  label="Sign Out"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function QuickTile({
  href,
  name,
  label,
}: {
  href: string;
  name: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center rounded-xl border px-4 py-3 hover:border-gray-300 hover:bg-blue-700 hover:text-white hover:font-bold"
    >
      <img src={name} className="mb-1" />
      <span className="text-[13px]">{label}</span>
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
  if (href) {
    return (
      <Link
        href={href}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-[15px] hover:bg-blue-700 hover:text-white hover:font-bold"
      >
        <span className="inline-flex items-center gap-2">
          <Icon size={18} /> {label}
        </span>
        {right}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-[15px] hover:bg-blue-700 hover:text-white hover:font-bold   hover:cursor-pointer"
      type="button"
    >
      <span className="inline-flex items-center gap-2 hover:cursor-pointer">
        <Icon size={18} /> {label}
      </span>
      {right}
    </button>
  );
}

function AppearanceOption({ label }: { label: string }) {
  return (
    <button
      className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-blue-700 hover:text-white hover:font-bold hover:cursor-pointer"
      type="button"
    >
      {label}
    </button>
  );
}
