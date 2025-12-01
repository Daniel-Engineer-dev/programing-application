// app/problems/[id]/EditorPanel.tsx
"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";

export default function EditorPanel() {
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("// Viết code của bạn ở đây");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false); // Để đổi màu text nếu lỗi

  // Hàm xử lý khi bấm nút "Chạy"
  const handleRun = async () => {
    setIsLoading(true);
    setOutput("");
    setIsError(false);

    try {
      const response = await axios.post("/routes/piston", {
        source_code: code,
        language: language,
        stdin: "", // Bạn có thể thêm ô nhập input nếu muốn
      });

      const result = response.data;

      // stdout: Kết quả chạy thành công
      // stderr: Lỗi runtime hoặc lỗi biên dịch
      if (result.stderr) {
        setOutput(result.stderr);
        setIsError(true);
      } else {
        setOutput(
          result.stdout || "Chương trình chạy xong không có kết quả hiển thị."
        );
      }
    } catch (error) {
      setOutput("Lỗi kết nối tới server.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[55%] flex flex-col mt-2 mr-5 mb-15 ml-1 rounded-2xl border-slate-700 border h-[90vh]">
      {/* Header */}
      <div className="p-3 flex items-center justify-between bg-slate-950 rounded-t-2xl border-b border-slate-700">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded border px-2 py-1 text-sm border-slate-700 bg-slate-800 text-white font-bold cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="javascript">Javascript</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={handleRun}
            disabled={isLoading}
            className={`rounded px-4 py-1 text-sm font-semibold transition-all flex items-center gap-2 ${
              isLoading
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-500"
            }`}
          >
            {isLoading ? (
              // Icon loading xoay
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Đang chạy...
              </>
            ) : (
              "▶ Chạy code"
            )}
          </button>
          <button className="rounded bg-blue-600 text-white px-4 py-1 text-sm font-semibold hover:bg-blue-500">
            Nộp bài
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(val: string | undefined) => setCode(val || "")}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Output Panel */}
      <div className="h-[30%] bg-slate-950 p-4 text-sm border-t border-slate-700 flex flex-col rounded-b-2xl">
        <h3 className="text-xs font-bold uppercase text-gray-400 mb-2 tracking-wider">
          Terminal Output:
        </h3>
        <pre
          className={`w-full h-full overflow-auto bg-slate-900 p-3 rounded-lg font-mono text-sm border border-slate-800 whitespace-pre-wrap ${
            isError
              ? "text-red-400 border-red-900/50 bg-red-900/10"
              : "text-gray-200"
          }`}
        >
          {output || "Kết quả chạy code sẽ hiển thị ở đây..."}
        </pre>
      </div>
    </div>
  );
}
