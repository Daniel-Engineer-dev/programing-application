"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../api/firebase";

/**
 * Hook theo dõi trạng thái đăng nhập Firebase
 * @returns user hiện tại hoặc null nếu chưa đăng nhập
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Lắng nghe khi trạng thái đăng nhập thay đổi
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Dọn dẹp listener khi unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
