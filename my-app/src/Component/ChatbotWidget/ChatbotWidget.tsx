"use client";

import { useState } from "react";
import { Bot, X, Send, Paperclip, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");

  // Hàm giả lập gửi tin nhắn
  const handleSend = () => {
    if (!input.trim()) return;
    // Logic gửi tin nhắn ở đây
    setInput("");
  };

  return (
    <>
      {/* 1. Sidebar Panel (Sider Fusion Style) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (Tùy chọn: nếu muốn click ra ngoài để đóng thì uncomment dòng dưới) */}
            {/* <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            /> */}

            <motion.div
              initial={{ x: "100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-full w-full sm:w-[450px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col"
            >
              {/* --- Header --- */}
              <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      AI Assistant
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Ready to help
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút đóng/thu nhỏ */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors hover:cursor-pointer"
                  title="Close sidebar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* --- Chat Content Area --- */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {/* Tin nhắn mẫu từ AI */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none text-slate-200 text-sm leading-relaxed max-w-[85%] shadow-sm">
                    <p>
                      Xin chào! 👋 Tôi là trợ lý AI được tích hợp ngay bên cạnh
                      trình duyệt của bạn.
                    </p>
                    <p className="mt-2">
                      Tôi có thể giúp bạn giải thích code, viết bài, hoặc trả
                      lời câu hỏi. Bạn cần giúp gì không?
                    </p>
                  </div>
                </div>

                {/* Tin nhắn mẫu từ User */}
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">ME</span>
                  </div>
                  <div className="bg-blue-600 p-3 rounded-2xl rounded-tr-none text-white text-sm leading-relaxed max-w-[85%] shadow-md">
                    <p>Làm thế nào để fix lỗi 500 trong Next.js?</p>
                  </div>
                </div>
              </div>

              {/* --- Footer Input --- */}
              <div className="p-4 border-t border-slate-700 bg-slate-900">
                <div className="relative flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-600 focus-within:border-blue-500 transition-colors">
                  <button className="p-2 text-slate-400 hover:text-white transition-colors">
                    <Paperclip size={20} />
                  </button>

                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="w-full bg-transparent text-white text-sm resize-none focus:outline-none max-h-32 py-2"
                    rows={1}
                    style={{ minHeight: "40px" }} // Auto grow height logic can be added here
                  />

                  <button
                    onClick={handleSend}
                    className={`p-2 rounded-lg transition-all ${
                      input.trim()
                        ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg"
                        : "bg-slate-700 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-slate-500">
                    AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin.
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. Floating Toggle Button (Nút mở sidebar) */}
      {/* Chỉ hiện nút khi sidebar đóng, hoặc luôn hiện tùy ý thích */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all group hover:cursor-pointer"
        >
          {/* Hiệu ứng tooltip */}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none">
            Mở Chatbot
          </span>
          <Bot size={25} />
        </motion.button>
      )}
    </>
  );
}
