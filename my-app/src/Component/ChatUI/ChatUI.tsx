"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  ChevronLeft,
  Search,
  UserPlus,
  MessageSquare,
  Users,
  Circle,
  Clock,
  Smile,
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
  const [activeTab, setActiveTab] = useState<"messages" | "requests" | "pending">(
    "messages"
  );
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<{[friendId: string]: number}>({});

  // Emoji categories
  const emojiCategories = [
    {
      name: 'Smileys',
      emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎']
    },
    {
      name: 'Gestures',
      emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃']
    },
    {
      name: 'Hearts',
      emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟']
    },
    {
      name: 'Objects',
      emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🎮', '🎯', '🎲', '🎰', '🎳', '🎸', '🎹', '🎺', '🎻', '🥁', '🎤', '🎧']
    }
  ];

  const { user: currentUser, username: currentUserName } = useAuthContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef<{[key: string]: number}>({});

  // Helper function to update unread count
  const updateUnreadCount = (count: number) => {
    localStorage.setItem('chatUnreadCount', String(count));
    window.dispatchEvent(new CustomEvent('chat-unread-updated'));
  };

  // 1. Mở/Đóng Chat từ NavBar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
      // Clear unread count when opening chat
      if (!isOpen) {
        updateUnreadCount(0);
      }
    };
    window.addEventListener("toggle-chat", handleToggle);
    return () => window.removeEventListener("toggle-chat", handleToggle);
  }, [isOpen]);

  // Track unread messages from all friends
  useEffect(() => {
    if (!currentUser?.uid || friends.length === 0) return;

    const unsubscribers: (() => void)[] = [];
    let totalUnread = 0;

    friends.forEach((friend) => {
      const chatId =
        currentUser.uid < friend.id
          ? `${currentUser.uid}_${friend.id}`
          : `${friend.id}_${currentUser.uid}`;

      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("timestamp", "desc")
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const currentCount = snapshot.size;
        const previousCount = previousMessageCountRef.current[chatId] || 0;

        // Only count as unread if:
        // 1. There are new messages (count increased)
        // 2. Chat is not currently open
        // 3. The latest message is not from current user
        if (currentCount > previousCount && !isOpen) {
          const latestMsg = snapshot.docs[0]?.data();
          if (latestMsg?.senderId !== currentUser.uid) {
            totalUnread += (currentCount - previousCount);
            updateUnreadCount(totalUnread);
          }
        }

        previousMessageCountRef.current[chatId] = currentCount;
      });

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [currentUser, friends, isOpen]);

  // Track unread messages per friend
  useEffect(() => {
    if (!currentUser?.uid || friends.length === 0) return;

    const unsubscribers: (() => void)[] = [];
    const unreadCounts: {[friendId: string]: number} = {};

    friends.forEach((friend) => {
      const chatId =
        currentUser.uid < friend.id
          ? `${currentUser.uid}_${friend.id}`
          : `${friend.id}_${currentUser.uid}`;

      const q = query(
        collection(db, "chats", chatId, "messages"),
        where("senderId", "==", friend.id),
        orderBy("timestamp", "desc")
      );

      const unsub = onSnapshot(q, (snapshot) => {
        // Count unread messages (messages from friend that user hasn't seen)
        const lastSeenKey = `lastSeen_${chatId}`;
        const lastSeenTime = localStorage.getItem(lastSeenKey);
        
        let unreadCount = 0;
        snapshot.docs.forEach((doc) => {
          const msgData = doc.data();
          if (!lastSeenTime || (msgData.timestamp && msgData.timestamp.toMillis() > parseInt(lastSeenTime))) {
            unreadCount++;
          }
        });

        unreadCounts[friend.id] = unreadCount;
        setUnreadMessages({...unreadCounts});
      });

      unsubscribers.push(unsub);
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [currentUser, friends]);

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

  // Lắng nghe lời mời kết bạn đã gửi (outgoing)
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "friend_requests"),
      where("fromId", "==", currentUser.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setOutgoingRequests(
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
    
    console.log('Sending message to chatId:', chatId);
    console.log('Current user:', currentUser.uid);
    console.log('Friend:', selectedFriend.id);
    
    try {
      // Ensure chat document exists first
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        // Create the chat document
        await setDoc(chatRef, {
          participants: [currentUser.uid, selectedFriend.id],
          createdAt: serverTimestamp(),
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
        });
        console.log('Created new chat document');
      } else {
        // Update last message
        await updateDoc(chatRef, {
          lastMessage: newMessage,
          lastMessageTime: serverTimestamp(),
        });
      }
      
      // Add message to subcollection
      const messageRef = await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        timestamp: serverTimestamp(),
      });
      
      console.log('Message sent successfully:', messageRef.id);
      setNewMessage("");
    } catch (e) {
      console.error('Error sending message:', e);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  const pendingCount = outgoingRequests.filter(
    (req) => req.status === "pending" || req.status === "rejected"
  ).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-16 right-4 z-[60] w-[380px] h-[600px] bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-white/10 shadow-2xl rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl text-white"
        >
          {!selectedFriend ? (
            <>
              {/* Header & Tab Menu */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/10 backdrop-blur-xl">
                <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                      <MessageSquare size={18} className="text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      Kết nối
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="flex text-[11px] font-bold tracking-widest cursor-pointer">
                  <button
                    onClick={() => {
                      setActiveTab("messages");
                      setIsSearching(false);
                    }}
                    className={`flex-1 py-3 transition-all ${
                      activeTab === "messages"
                        ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/10"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    TIN NHẮN
                  </button>
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 py-3 flex justify-center gap-2 transition-all ${
                      activeTab === "pending"
                        ? "text-amber-400 border-b-2 border-amber-500 bg-amber-500/10"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Clock size={14} />
                    CHỜ XÁC NHẬN
                    {pendingCount > 0 && (
                      <span className="bg-amber-500 text-white px-1.5 rounded-full text-[9px] flex items-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("requests")}
                    className={`flex-1 py-3 flex justify-center gap-2 transition-all ${
                      activeTab === "requests"
                        ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/10"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    LỜI MỜI
                    {incomingRequests.length > 0 && (
                      <span className="bg-red-500 text-white px-1.5 rounded-full text-[9px] flex items-center animate-pulse">
                        {incomingRequests.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {activeTab === "messages" ? (
                <>
                  <div className="p-3">
                    <div className="relative flex items-center bg-slate-800/50 backdrop-blur-xl rounded-xl px-3 py-2.5 border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                      <Search size={16} className="text-slate-400 mr-2" />
                      <input
                        type="text"
                        placeholder="Tìm username..."
                        className="bg-transparent text-sm text-white outline-none w-full placeholder:text-slate-500"
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
                      <div className="p-2 space-y-2">
                        {searchResults.length > 0 ? (
                          searchResults.map((u) => (
                            <div
                              key={u.uid}
                              className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-indigo-500/30"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                  {u.username[0].toUpperCase()}
                                </div>
                                <span className="text-white text-sm font-medium">
                                  {u.username}
                                </span>
                              </div>
                              <button
                                onClick={() => onAddFriend(u)}
                                className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/50 hover:scale-105"
                              >
                                <UserPlus size={18} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-slate-400">
                            <Search size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Không tìm thấy người dùng</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {friends.length > 0 ? (
                          friends.map((f) => {
                            const unreadCount = unreadMessages[f.id] || 0;
                            return (
                            <div
                              key={f.id}
                              onClick={() => {
                                setSelectedFriend(f);
                                // Mark messages as read
                                const chatId =
                                  currentUser!.uid < f.id
                                    ? `${currentUser!.uid}_${f.id}`
                                    : `${f.id}_${currentUser!.uid}`;
                                localStorage.setItem(`lastSeen_${chatId}`, Date.now().toString());
                                // Clear unread count for this friend
                                setUnreadMessages(prev => ({...prev, [f.id]: 0}));
                              }}
                              className="p-3 flex items-center gap-3 hover:bg-white/5 cursor-pointer transition-all rounded-xl mx-2 border border-transparent hover:border-indigo-500/30 relative"
                            >
                              <div className="relative">
                                <img
                                  src={
                                    f.avatar || `https://i.pravatar.cc/150?u=${f.id}`
                                  }
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                                  alt={f.name}
                                />
                                {f.online && (
                                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate text-white">
                                  {f.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <Circle
                                    size={8}
                                    className={`${
                                      f.online
                                        ? "text-green-400 fill-green-400"
                                        : "text-slate-500 fill-slate-500"
                                    }`}
                                  />
                                  <span
                                    className={
                                      f.online ? "text-green-400" : "text-slate-500"
                                    }
                                  >
                                    {f.online ? "Đang hoạt động" : "Ngoại tuyến"}
                                  </span>
                                </div>
                              </div>
                              {/* Unread badge */}
                              {unreadCount > 0 && (
                                <div className="ml-auto">
                                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] px-1.5 flex items-center justify-center animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                          })
                        ) : (
                          <div className="text-center py-16 text-slate-400">
                            <Users size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Chưa có bạn bè</p>
                            <p className="text-xs mt-1 text-slate-500">
                              Tìm kiếm và kết bạn ngay!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : activeTab === "pending" ? (
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={18} className="text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">
                        Lời mời đã gửi
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {pendingCount} lời mời
                    </div>
                  </div>

                  {outgoingRequests.filter(req => req.status !== "accepted").length > 0 ? (
                    <div className="space-y-2">
                      {outgoingRequests.filter(req => req.status !== "accepted").map((req) => (
                        <div
                          key={req.id}
                          className="p-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-yellow-600 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                                {req.toName?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-white truncate">
                                  {req.toName || "Unknown"}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs">
                                  {req.status === "pending" ? (
                                    <>
                                      <Clock size={10} className="text-amber-400" />
                                      <span className="text-amber-400">Chờ xác nhận</span>
                                    </>
                                  ) : req.status === "accepted" ? (
                                    <>
                                      <Circle size={10} className="text-green-400 fill-green-400" />
                                      <span className="text-green-400">Đã chấp nhận</span>
                                    </>
                                  ) : (
                                    <>
                                      <Circle size={10} className="text-red-400 fill-red-400" />
                                      <span className="text-red-400">Đã từ chối</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {req.status === "pending" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await updateDoc(doc(db, "friend_requests", req.id), {
                                      status: "cancelled",
                                    });
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-slate-400">
                      <Clock size={40} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Chưa gửi lời mời kết bạn nào</p>
                      <p className="text-xs mt-1 text-slate-500">
                        Tìm kiếm và gửi lời mời kết bạn!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {incomingRequests.length > 0 ? (
                    incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-xl border border-purple-500/30 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-sm font-bold">
                            {req.fromName}
                          </p>
                          <p className="text-xs text-purple-300">
                            Muốn kết bạn với bạn
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptFriend(req)}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-purple-500/50"
                          >
                            Đồng ý
                          </button>
                          <button className="bg-slate-700/50 text-slate-300 text-xs px-4 py-2 rounded-lg hover:bg-slate-700 transition-all">
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-slate-400">
                      <UserPlus size={40} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Không có lời mời kết bạn</p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Khung Chat */}
              <div className="p-3 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/10 backdrop-blur-xl flex items-center gap-3">
                <button
                  onClick={() => setSelectedFriend(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="relative">
                  <img
                    src={
                      selectedFriend.avatar ||
                      `https://i.pravatar.cc/150?u=${selectedFriend.id}`
                    }
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20"
                    alt={selectedFriend.name}
                  />
                  {selectedFriend.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate text-white">
                    {selectedFriend.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Circle
                      size={6}
                      className={`${
                        selectedFriend.online
                          ? "text-green-400 fill-green-400"
                          : "text-slate-500 fill-slate-500"
                      }`}
                    />
                    <span
                      className={
                        selectedFriend.online ? "text-green-400" : "text-slate-500"
                      }
                    >
                      {selectedFriend.online ? "Đang hoạt động" : "Ngoại tuyến"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50 flex flex-col"
              >
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-lg ${
                        msg.senderId === currentUser?.uid
                          ? "bg-gradient-to-br from-indigo-600 to-purple-600 self-end rounded-tr-none"
                          : "bg-slate-700 self-start rounded-tl-none"
                      }`}
                    >
                      {msg.text}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-400">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Bắt đầu cuộc trò chuyện</p>
                  </div>
                )}
              </div>
              <div className="relative">
                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-16 left-3 right-3 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl max-h-64 overflow-y-auto custom-scrollbar z-50"
                    >
                      {emojiCategories.map((category) => (
                        <div key={category.name} className="mb-4">
                          <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                            {category.name}
                          </div>
                          <div className="grid grid-cols-8 gap-2">
                            {category.emojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  setNewMessage((prev) => prev + emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="text-2xl hover:bg-white/10 rounded-lg p-1.5 transition-all hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-slate-900/50 border-t border-white/10 flex gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2.5 rounded-full transition-all ${
                      showEmojiPicker
                        ? 'bg-indigo-500/20 text-indigo-400'
                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-indigo-400'
                    }`}
                  >
                    <Smile size={18} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!newMessage.trim()}
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          )}

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(99, 102, 241, 0.5);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(99, 102, 241, 0.7);
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatUI;
