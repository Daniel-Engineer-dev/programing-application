"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, User, Copy, Check } from "lucide-react"; // Thêm icon cho Copy
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "../CodeBlock/CodeBlock";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Xin chào! Tôi là **CodePro AI**. Tôi có thể giúp bạn giải thích thuật toán, tối ưu mã nguồn hoặc gỡ lỗi. Bạn cần hỗ trợ gì hôm nay? 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // --- LOGIC KÉO GIÃN (RESIZE) - FIX LỖI ---
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 350 && newWidth < window.innerWidth * 0.8) {
          setWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/chatbot", {
        messages: [...messages, userMsg],
      });

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: res.data.content },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "❌ **Sự cố kết nối:** Không thể liên lạc lúc này.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            style={{ width: `${width}px` }} // QUAN TRỌNG: Gán width động vào style
            className="fixed top-0 right-0 z-50 h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col font-sans"
          >
            {/* THANH KÉO GIÃN - Handle to Resize */}
            <div
              onMouseDown={startResizing}
              className={`absolute left-0 top-0 w-1.5 h-full cursor-col-resize z-10 transition-colors ${
                isResizing ? "bg-blue-500" : "hover:bg-blue-500/30"
              }`}
            />

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base tracking-tight">
                    CodePro AI
                  </h3>
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest">
                      Trực tuyến
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* CHAT CONTENT */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === "ai"
                        ? "bg-blue-600/10 text-blue-500 border border-blue-500/20"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {msg.role === "ai" ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed ${
                      msg.role === "ai"
                        ? "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                        : "bg-blue-600 text-white rounded-tr-none"
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <CodeBlock
                              language={match[1]}
                              code={String(children).replace(/\n$/, "")}
                            />
                          ) : (
                            <code
                              className="bg-slate-800 px-1 rounded text-pink-400"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}

              {/* LOADING INDICATOR */}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                    <Bot size={18} className="text-blue-500 animate-pulse" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 focus-within:border-blue-500/50 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), handleSend())
                  }
                  placeholder="Hỏi tôi bất cứ điều gì..."
                  className="w-full bg-transparent text-white text-sm resize-none focus:outline-none py-2 min-h-10 max-h-32"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={`p-2 rounded-xl transition-all ${
                    input.trim() && !isLoading
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-slate-800 text-slate-600"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 z-50 bg-blue-600 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 group"
        >
          <Bot size={24} />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold text-sm whitespace-nowrap">
            Trò chuyện với AI
          </span>
        </motion.button>
      )}
    </>
  );
}
