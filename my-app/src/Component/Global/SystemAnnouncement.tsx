"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/src/api/firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Bell, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function SystemAnnouncement() {
  const pathname = usePathname();
  
  const [show, setShow] = useState(false);
  const [content, setContent] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const lastSeenRef = useRef(""); // Track the last version we processed


  useEffect(() => {
    // Realtime listen to config
    const unsub = onSnapshot(doc(db, "system", "config"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const ann = data.announcement;

        if (ann && ann.active) {
          // Check expiration immediately
          if (ann.expiresAt) {
              const now = new Date();
              const expire = new Date(ann.expiresAt);
              if (now > expire) {
                  setShow(false);
                  return;
              }
              setExpiresAt(ann.expiresAt);
          } else {
              setExpiresAt(null);
          }

          const serverTime = ann.updatedAt;
          const sessionKey = `seen_ann_${serverTime}`;
          const isSeenSession = sessionStorage.getItem(sessionKey);

          // If this is a new update (or first load) AND not seen in this session
          if (serverTime !== lastSeenRef.current && !isSeenSession) {
              setContent(ann.content);
              lastSeenRef.current = serverTime;
              setShow(true);
          }
        } else {
            // Admin turned it off -> hide immediately
            setShow(false);
            setExpiresAt(null);
        }
      }
    });

    return () => unsub();
  }, []);

  // Auto-close timer
  useEffect(() => {
      if (!show || !expiresAt) return;
      
      const now = new Date().getTime();
      const expireTime = new Date(expiresAt).getTime();
      const timeLeft = expireTime - now;

      if (timeLeft <= 0) {
          setShow(false);
          return;
      }

      // Set timer to close exactly when time is up
      const timer = setTimeout(() => {
          setShow(false);
          // Optional: clear session storage? No, just close UI.
      }, timeLeft);

      return () => clearTimeout(timer);
  }, [show, expiresAt]);

  const handleClose = () => {
    setShow(false);
    // Save to Session Storage -> Persists on Reload, Clears on Browser Close
    if (lastSeenRef.current) {
        sessionStorage.setItem(`seen_ann_${lastSeenRef.current}`, "true");
    }
  };

  // Hide if not active OR if current page is Admin Panel
  if (!show || pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-purple-500/50 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.4)] w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-full animate-bounce">
                <Bell className="text-white" size={24} />
             </div>
             <h3 className="text-xl font-bold text-white uppercase tracking-wider">Thông báo hệ thống</h3>
        </div>
        
        <div className="p-8 text-center">
            <p className="text-lg text-white font-medium leading-relaxed whitespace-pre-wrap">
                {content}
            </p>
        </div>

        <div className="p-4 bg-slate-950/50 flex justify-center">
             <button 
                onClick={handleClose}
                className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 shadow-lg active:scale-95"
            >
                Đã hiểu / OK
            </button>
        </div>
      </div>
    </div>
  );
}
