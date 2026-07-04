"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, User, Paperclip, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

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
    if ((!input.trim() && !attachedFile) || isLoading || isStreaming) return;

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
    // ✅ Không set isStreaming ngay - để loading dots hiển thị
    setStreamingMessage("");

    try {
      // Sử dụng fetch để hỗ trợ streaming
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: fullContent }],
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      // Đọc streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";
      let isFirstChunk = true;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // Tắt loading và bật streaming khi nhận chunk đầu tiên
          if (isFirstChunk) {
            setIsLoading(false);
            setIsStreaming(true);  // ✅ Chỉ set true khi thực sự bắt đầu stream
            isFirstChunk = false;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          setStreamingMessage(accumulatedText);
        }

        // Sau khi stream xong, add vào messages
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: accumulatedText },
        ]);
        setStreamingMessage("");
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "❌ **Sự cố kết nối:** Không thể liên lạc lúc này.",
        },
      ]);
      setStreamingMessage("");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Listen to toggle-chatbot event from NavBar
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("toggle-chatbot", handleToggle);
    return () => window.removeEventListener("toggle-chatbot", handleToggle);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              duration: 0.5
            }}
            style={{ width: `${width}px` }}
            className="fixed top-0 right-0 z-[70] h-full bg-slate-950 border-l border-slate-800 shadow-xl flex flex-col font-sans"
          >
            {/* Handle Resize với gradient */}
            <div
              onMouseDown={startResizing}
              className={`absolute left-0 top-0 w-2 h-full cursor-col-resize z-10 transition-all duration-300 ${
                isResizing ? "bg-blue-600" : "hover:bg-blue-600/30"
              }`}
            />

            {/* Header với gradient nổi bật */}
            <div className="relative flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900 overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="relative">
                  <div className="relative bg-blue-600 p-2.5 rounded-lg border border-blue-500">
                    <Bot size={22} className="text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight">
                    CodePro AI
                  </h3>
                  <p className="text-xs text-slate-400">Gemini 3 Flash • Streaming</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="relative z-10 p-2 text-slate-400 hover:text-white transition-all duration-300 hover:bg-slate-700/50 rounded-lg group"
              >
                <X size={20} className="transition-transform group-hover:rotate-90" />
              </button>
            </div>

            {/* Chat Content với gradient background */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-5 space-y-6 overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-950 bg-slate-950 relative"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      msg.role === "ai"
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/30"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {msg.role === "ai" ? <Bot size={18} /> : <User size={18} />}
                  </div>
                  <div
                    className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed transition-colors duration-200 ${
                      msg.role === "ai"
                        ? "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
                        : "bg-blue-600 text-white rounded-tr-none border border-blue-500"
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
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
              
              {/* Streaming message being typed */}
              {isStreaming && streamingMessage && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-600/10 text-blue-500 border border-blue-500/20">
                    <Bot size={18} />
                  </div>
                  <div className="max-w-[85%] p-3.5 rounded-2xl text-[13px] leading-relaxed bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
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
                      {streamingMessage}
                    </ReactMarkdown>
                    {/* Cursor nhấp nháy */}
                    <span className="inline-block w-1 h-4 bg-blue-500 ml-0.5 animate-pulse"></span>
                  </div>
                </div>
              )}
              
              {isLoading && !isStreaming && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-600/10 text-blue-400 border border-blue-500/30">
                    <Bot size={18} className="animate-pulse" />
                  </div>
                  <div className="p-4 rounded-xl rounded-tl-none bg-slate-900 border border-slate-800">
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer với gradient */}
            <div className="p-5 bg-slate-950 border-t border-slate-800">
              {/* Preview file đang chờ gửi */}
              {attachedFile && (
                <div className="mb-3 flex items-center justify-between bg-slate-900 border border-blue-500/30 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
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

              <div className="relative flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl px-5 py-3 focus-within:border-blue-500 transition-colors duration-200">
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
                  className={`p-2 rounded-xl transition-all duration-300 ${
                    attachedFile
                      ? "text-blue-400 bg-blue-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                  title="Đính kèm file"
                >
                  <Paperclip size={19} className="transition-transform hover:rotate-12" />
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
                  className="w-full bg-transparent text-white text-sm resize-none focus:outline-none py-2 min-h-10 max-h-32 placeholder:text-slate-500"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || isStreaming || (!input.trim() && !attachedFile)}
                  className={`p-2.5 rounded-lg transition-colors duration-200 ${
                    (input.trim() || attachedFile) && !isLoading && !isStreaming
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  <Send size={18} className="transition-transform hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
