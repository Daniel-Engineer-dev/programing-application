"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  ChevronLeft,
  Search,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  updateDoc,
  arrayUnion,
  addDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "@/src/api/firebase/firebase";
import { useAuthContext } from "@/src/userHook/context/authContext";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

interface UserResult {
  uid: string;
  username: string;
  avatar?: string;
}

const ChatUI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "requests">(
    "messages"
  );
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { user: currentUser, username: currentUserName } = useAuthContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Mở/Đóng Chat từ NavBar
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-chat", handleToggle);
    return () => window.removeEventListener("toggle-chat", handleToggle);
  }, []);

  // 2. Lấy danh sách bạn bè real-time
  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(
      doc(db, "users", currentUser.uid),
      async (userDoc) => {
        if (userDoc.exists() && userDoc.data().friends) {
          const friendsIds = userDoc.data().friends as string[];
          const friendsList: Friend[] = [];
          for (const fId of friendsIds) {
            const fDoc = await getDoc(doc(db, "users", fId));
            if (fDoc.exists()) {
              friendsList.push({
                id: fDoc.id,
                name: fDoc.data().username || "User",
                avatar: fDoc.data().avatar || "",
                online: fDoc.data().online || false,
              });
            }
          }
          setFriends(friendsList);
        }
      }
    );
    return () => unsub();
  }, [currentUser]);

  // 3. Lắng nghe lời mời kết bạn gửi đến
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "friend_requests"),
      where("toId", "==", currentUser.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setIncomingRequests(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsub();
  }, [currentUser]);

  // 4. Logic Chat Real-time
  useEffect(() => {
    if (!currentUser?.uid || !selectedFriend) return;
    const chatId =
      currentUser.uid < selectedFriend.id
        ? `${currentUser.uid}_${selectedFriend.id}`
        : `${selectedFriend.id}_${currentUser.uid}`;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedFriend, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // --- HANDLERS ---

  const handleSearchUser = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", "==", searchTerm.trim())
      );
      const snap = await getDocs(q);
      setSearchResults(
        snap.docs.map((d) => ({
          uid: d.id,
          username: d.data().username,
          avatar: d.data().avatar,
        }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const onAddFriend = async (target: UserResult) => {
    if (!currentUser?.uid) return;
    try {
      await setDoc(
        doc(db, "friend_requests", `${currentUser.uid}_${target.uid}`),
        {
          fromId: currentUser.uid,
          fromName: currentUserName,
          toId: target.uid,
          toName: target.username,
          status: "pending",
          timestamp: serverTimestamp(),
        }
      );
      alert("Đã gửi lời mời!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcceptFriend = async (req: any) => {
    if (!currentUser?.uid) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        friends: arrayUnion(req.fromId),
      });
      await updateDoc(doc(db, "users", req.fromId), {
        friends: arrayUnion(currentUser.uid),
      });
      await updateDoc(doc(db, "friend_requests", req.id), {
        status: "accepted",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !selectedFriend) return;
    const chatId =
      currentUser.uid < selectedFriend.id
        ? `${currentUser.uid}_${selectedFriend.id}`
        : `${selectedFriend.id}_${currentUser.uid}`;
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setNewMessage("");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 right-4 z-60 w-[360px] h-[550px] bg-[#1a1d21] border border-gray-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden backdrop-blur-md text-white"
        >
          {!selectedFriend ? (
            <>
              {/* Header & Tab Menu */}
              <div className="bg-[#24292e] border-b border-gray-700">
                <div className="p-4 flex justify-between items-center">
                  <h3 className="font-bold">Kết nối</h3>
                  <button onClick={() => setIsOpen(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="flex text-[11px] font-bold tracking-widest cursor-pointer">
                  <button
                    onClick={() => {
                      setActiveTab("messages");
                      setIsSearching(false);
                    }}
                    className={`flex-1 py-3 ${
                      activeTab === "messages"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                    }`}
                  >
                    TIN NHẮN
                  </button>
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={`flex-1 py-3 flex justify-center gap-2 ${
                      activeTab === "requests"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                    }`}
                  >
                    LỜI MỜI{" "}
                    {incomingRequests.length > 0 && (
                      <span className="bg-red-500 text-white px-1.5 rounded-full text-[9px]">
                        {incomingRequests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {activeTab === "messages" ? (
                <>
                  <div className="p-3">
                    <div className="relative flex items-center bg-[#0d1117] rounded-xl px-3 py-2 border border-gray-700 focus-within:border-blue-500 transition-all">
                      <Search size={16} className="text-gray-500 mr-2" />
                      <input
                        type="text"
                        placeholder="Tìm username..."
                        className="bg-transparent text-sm text-white outline-none w-full"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (!e.target.value) setIsSearching(false);
                        }}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearchUser()
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {isSearching ? (
                      <div className="p-2">
                        {searchResults.map((u) => (
                          <div
                            key={u.uid}
                            className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                                {u.username[0].toUpperCase()}
                              </div>
                              <span className="text-white text-sm">
                                {u.username}
                              </span>
                            </div>
                            <button
                              onClick={() => onAddFriend(u)}
                              className="p-2 bg-blue-600/20 text-blue-500 rounded-lg hover:bg-blue-600 hover:text-white"
                            >
                              <UserPlus size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      friends.map((f) => (
                        <div
                          key={f.id}
                          onClick={() => setSelectedFriend(f)}
                          className="p-4 flex items-center gap-3 hover:bg-white/5 cursor-pointer border-b border-gray-800/30"
                        >
                          <img
                            src={
                              f.avatar || `https://i.pravatar.cc/150?u=${f.id}`
                            }
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1 font-semibold text-sm truncate">
                            {f.name}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 p-2 overflow-y-auto">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 bg-white/5 rounded-xl mb-2 flex items-center justify-between border border-gray-800"
                    >
                      <div>
                        <p className="text-white text-sm font-bold">
                          {req.fromName}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          Muốn kết bạn
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptFriend(req)}
                          className="bg-blue-600 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold"
                        >
                          Đồng ý
                        </button>
                        <button className="bg-gray-800 text-gray-400 text-[10px] px-3 py-1.5 rounded-lg">
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Khung Chat */}
              <div className="p-3 bg-[#24292e] border-b border-gray-700 flex items-center gap-3">
                <button onClick={() => setSelectedFriend(null)}>
                  <ChevronLeft size={24} />
                </button>
                <div className="flex-1 font-bold text-sm truncate">
                  {selectedFriend.name}
                </div>
                <button onClick={() => setIsOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0d1117] flex flex-col"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[80%] p-2 rounded-xl text-[13px] ${
                      msg.senderId === currentUser?.uid
                        ? "bg-blue-600 self-end rounded-tr-none"
                        : "bg-gray-700 self-start rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-[#1a1d21] border-t border-gray-700 flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-[#0d1117] border border-gray-700 rounded-full px-4 py-2 text-sm outline-none"
                />
                <button type="submit" className="text-blue-500">
                  <Send size={20} />
                </button>
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatUI;
