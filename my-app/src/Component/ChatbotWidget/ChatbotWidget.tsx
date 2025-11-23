"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react"; // icon từ lucide-react
import { motion, AnimatePresence } from "framer-motion";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 bg-white shadow-lg rounded-2xl border border-gray-200"
          >
            <div className="mb-3 w-80 bg-white shadow-lg rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-semibold text-gray-800">Chatbot</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 hover:cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-3 h-64 overflow-y-auto text-sm text-gray-700">
                <p className="text-gray-500 italic text-center">
                  👋 Xin chào! Tôi có thể giúp gì cho bạn?
                </p>
              </div>

              <div className="p-3 border-t">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-105 hover:cursor-pointer"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}
