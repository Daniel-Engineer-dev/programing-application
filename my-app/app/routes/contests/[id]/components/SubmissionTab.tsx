"use client";
import React, { useState, useRef, useEffect } from "react";
import { Problem } from "../lib/fetchContest";
import { Upload, X, Loader2, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import { useContestSubmission } from "@/src/hooks/useContestSubmission";
import { db, auth } from "@/src/api/firebase/firebase";
import {
  doc,
  runTransaction,
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  setDoc,
  increment,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

type TestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean; 
};

export default function SubmissionTab({
  problems,
  contestId,
}: {
  problems: Problem[];
  contestId: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [language, setLanguage] = useState("cpp"); 
  const [selectedProblemId, setSelectedProblemId] = useState(""); 
  const [fetchingTests, setFetchingTests] = useState(false);
  const [uid, setUid] = useState<string | undefined>(auth.currentUser?.uid);

  useEffect(() => {
     const unsub = auth.onAuthStateChanged((u) => setUid(u?.uid));
     return () => unsub();
  }, []);

  const { submitCode, isSubmitting: hookIsSubmitting, result } = useContestSubmission({ 
      contestId, 
      userId: uid 
  });
  
  const isSubmitting = fetchingTests || hookIsSubmitting;

  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đếm số dòng
  const lines = code.split("\n");
  const lineCount = lines.length;

  // Đồng bộ cuộn giữa cột số và textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Hàm xử lý khi chọn file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCode(content); 
      }
    };
    reader.readAsText(file); 

    e.target.value = "";
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setFileName(null);
    setCode(""); 
  };

  // --- HÀM NỘP BÀI CHÍNH ---
  const handleSubmit = async () => {
    if (!uid) return alert("Vui lòng đăng nhập!");
    if (!selectedProblemId) return alert("Vui lòng chọn bài tập!");
    if (!code.trim()) return alert("Mã nguồn trống!");

    setFetchingTests(true);

    try {
      // 1. Tìm thông tin bài tập
      const selectedProblemData = problems.find(
        (p) => p.id === selectedProblemId
      );

      if (!selectedProblemData || !selectedProblemData.problemID) {
        setFetchingTests(false);
        return alert("Lỗi: Không tìm thấy ID bài tập gốc (problemID)!");
      }

      const actualProblemDocId = selectedProblemData.problemID;

      // 2. Lấy Testcases
      const testCasesRef = collection(
        db,
        "problems",
        actualProblemDocId,
        "testCases"
      );

      const testCasesSnap = await getDocs(testCasesRef);
      const allTestCases: TestCase[] = [];

      testCasesSnap.forEach((doc) => {
        const t = doc.data();
        allTestCases.push({
          id: doc.id,
          input: String(t.input || ""),
          expectedOutput: String(t.expected || t.expectedOutput || ""),
          isHidden: t.isHidden === true || t.isHidden === "true",
        });
      });

      if (allTestCases.length === 0) {
        setFetchingTests(false);
        return alert(
          `Bài tập ${actualProblemDocId} chưa có dữ liệu chấm điểm.`
        );
      }
      
      setFetchingTests(false); // Hook start handling from here

      // 3. Gọi Hook xử lý nộp bài (Hỗ trợ Virtual / Real / Late)
      const submissionId = await submitCode(
          code,
          language,
          selectedProblemId,
          actualProblemDocId,
          selectedProblemData.title,
          allTestCases
      );
      
      if (submissionId) {
         // Chuyển sang tab danh sách bài nộp và highlight
         // Dùng replace để không back lại trang nộp
         router.push(`?tab=all-submissions&highlight=${submissionId}`);
      }

    } catch (error: any) {
      console.error(error);
      setFetchingTests(false);
      alert(error.message || "Lỗi hệ thống");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-semibold text-white text-center">
        Nộp bài nhanh
      </h2>
      
      <div className="space-y-6 max-w-full">
        {/* Phần chọn Bài và Ngôn ngữ */}
        <div className="space-y-4">
          <div className="grid grid-cols-6 gap-2 items-center">
            <label className="col-span-1 text-sm font-semibold text-slate-300">
              Bài:
            </label>
            <select
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
              className="col-span-5 bg-slate-800 border border-slate-700 p-2 rounded text-white outline-none focus:border-blue-500"
            >
              <option value="">-- Chọn bài tập --</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-6 gap-2 items-center">
            <label className="col-span-1 text-sm font-semibold text-slate-300">
              Ngôn ngữ:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="col-span-5 bg-slate-800 border border-slate-700 p-2 rounded text-white outline-none focus:border-blue-500"
            >
              <option value="cpp">GNU G++20 11.2.0 (cpp)</option>
              <option value="python">Python 3.10</option>
              <option value="java">Java 15</option>
              <option value="javascript">Node.js (javascript)</option>
            </select>
          </div>
        </div>

        {/* Mã nguồn */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-300">
            Mã nguồn:
          </label>
          <div className="relative flex border border-slate-700 rounded-lg overflow-hidden bg-white h-[400px]">
            <div
              ref={lineNumbersRef}
              className="w-12 bg-slate-100 border-r border-slate-200 flex flex-col pt-4 items-end pr-2 text-slate-400 font-mono text-[12px] leading-[20px] overflow-hidden select-none h-full"
            >
              {Array.from({ length: Math.max(lineCount, 30) }).map((_, i) => (
                <div key={i} className="h-[20px]">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              className="flex-1 h-full bg-transparent text-slate-900 font-mono text-[13px] p-4 pt-4 leading-[20px] outline-none resize-none overflow-y-auto whitespace-pre"
              placeholder="// Dán mã nguồn hoặc tải file lên..."
              spellCheck="false"
            />
          </div>
        </div>

        {/* Upload File */}
        <div className="flex flex-col items-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".cpp,.c,.py,.java,.js,.txt"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`group relative cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center gap-2 ${
              fileName
                ? "border-blue-500 bg-blue-500/5"
                : "border-slate-700 hover:border-blue-500 hover:bg-blue-500/5"
            }`}
          >
            {fileName && (
              <button
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-red-500 text-slate-400 hover:text-white rounded-full transition-all z-10 shadow-lg"
              >
                <X size={14} />
              </button>
            )}
            <div
              className={`p-3 rounded-full transition-colors ${
                fileName
                  ? "bg-blue-500/10"
                  : "bg-slate-800 group-hover:bg-blue-500/10"
              }`}
            >
              <Upload
                className={
                  fileName
                    ? "text-blue-500"
                    : "text-slate-400 group-hover:text-blue-500"
                }
                size={24}
              />
            </div>
            <div className="text-center">
              <p
                className={`text-sm font-medium ${
                  fileName
                    ? "text-blue-400"
                    : "text-slate-300 group-hover:text-white"
                }`}
              >
                {fileName ? `${fileName}` : "Nhấn để tải tệp lên"}
              </p>
            </div>
          </div>
        </div>

        {/* Nút Submit */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-12 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={18} />}
            {isSubmitting ? "Submitting..." : "Nộp bài"}
          </button>
        </div>
      </div>
    </div>
  );
}
