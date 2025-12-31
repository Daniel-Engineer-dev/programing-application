"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, User, Paperclip, FileText } from "lucide-react"; // Thêm icon Paperclip và FileText
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

  // State quản lý file đang được đính kèm
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    content: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC KÉO GIÃN (RESIZE) ---
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

  // --- XỬ LÝ FILE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Chỉ cho phép file văn bản hoặc code
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAttachedFile({
        name: file.name,
        content: content,
      });
    };
    reader.readAsText(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedFile) || isLoading) return;

    // Tạo nội dung tin nhắn bao gồm cả nội dung file nếu có
    let fullContent = input;
    if (attachedFile) {
      fullContent = `Nội dung từ file "${attachedFile.name}":\n\`\`\`\n${
        attachedFile.content
      }\n\`\`\`\n\nCâu hỏi: ${input || "Hãy phân tích nội dung file này."}`;
    }

    const userMsg: Message = {
      role: "user",
      content: input || `Gửi file: ${attachedFile?.name}`,
    };

    // Lưu tin nhắn hiển thị ngắn gọn nhưng gửi đi nội dung đầy đủ
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFile(null); // Reset file sau khi gửi
    setIsLoading(true);

    try {
      const res = await axios.post("/api/chatbot", {
        messages: [...messages, { role: "user", content: fullContent }],
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
            style={{ width: `${width}px` }}
            className="fixed top-0 right-0 z-50 h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col font-sans"
          >
            {/* Handle Resize */}
            <div
              onMouseDown={startResizing}
              className={`absolute left-0 top-0 w-1.5 h-full cursor-col-resize z-10 transition-colors ${
                isResizing ? "bg-blue-500" : "hover:bg-blue-500/30"
              }`}
            />

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-linear-to-br from-blue-500 to-indigo-600 p-2 rounded-xl">
                  <Bot size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-white text-base tracking-tight">
                  CodePro AI
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Content */}
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
              {isLoading && (
                <div className="flex gap-3 items-center">
                  <Bot size={18} className="text-blue-500 animate-pulse" />
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              {/* Preview file đang chờ gửi */}
              {attachedFile && (
                <div className="mb-2 flex items-center justify-between bg-slate-900 border border-blue-500/30 p-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="text-blue-400" />
                    <span className="text-xs text-slate-300 truncate">
                      {attachedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="relative flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 focus-within:border-blue-500/50 transition-all">
                {/* Nút Upload Hidden */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".txt,.js,.py,.cpp,.java,.c,.h,.ts,.tsx,.json,.md"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-1.5 rounded-lg transition-colors ${
                    attachedFile
                      ? "text-blue-500"
                      : "text-slate-500 hover:text-white"
                  }`}
                  title="Đính kèm file"
                >
                  <Paperclip size={20} />
                </button>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), handleSend())
                  }
                  placeholder="Hỏi tôi hoặc gửi code..."
                  className="w-full bg-transparent text-white text-sm resize-none focus:outline-none py-2 min-h-10 max-h-32"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !attachedFile)}
                  className={`p-2 rounded-xl transition-all ${
                    (input.trim() || attachedFile) && !isLoading
                      ? "bg-blue-600 text-white"
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
