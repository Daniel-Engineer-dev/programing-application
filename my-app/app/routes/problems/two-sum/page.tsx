"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import ProblemDetails from "@/src/component/ProblemDetail/ProblemDetail";

export default function ProblemPage() {
  // Mock data (sau này backend trả về)
  const problem = {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: `
      <p>Given an array of integers <code>nums</code> and an integer <code>target</code>,
      return indices of the two numbers such that they add up to <code>target</code>.</p>

      <p>You may assume that each input would have exactly one solution,
      and you may not use the same element twice.</p>
    `,
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10⁴",
      "-10⁹ <= nums[i] <= 10⁹",
      "-10⁹ <= target <= 10⁹",
    ],
  };

  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");

  const handleRun = () => {
    // Mock UI
    setOutput("Output will appear here...");
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 fixed">
      {/* LEFT PANEL */}
      <ProblemDetails
        title={problem.title}
        difficulty={problem.difficulty}
        description={problem.description}
        examples={problem.examples}
        constraints={problem.constraints}
      />

      {/* RIGHT PANEL */}
      <div className="w-[55%] flex flex-col mt-2 mr-5 mb-15 ml-1 rounded-2xl border-slate-700 border">
        {/* Header */}
        <div className="p-3 flex items-center justify-between bg-slate-950 rounded-2xl border">
          {/* Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded border px-2 py-1 text-sm border-slate-700 bg-slate-800 text-white font-bold hover:cursor-pointer"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">Javascript</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              className="rounded bg-gray-300 px-3 py-1 text-sm hover:bg-gray-400"
            >
              Chạy
            </button>
            <button className="rounded bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700">
              Nộp bài
            </button>
          </div>
        </div>

        {/* Editor */}
        <Editor
          height="60%"
          language={language}
          theme="vs-dark"
          defaultValue={`// Write your solution here`}
        />

        {/* Output panel */}
        <div className="rounded-2xl h-[40%] bg-slate-950 p-3 text-sm mt-2 border-t border-slate-700 flex flex-col">
          <h3 className="text-sm font-medium mb-2 text-white">Output:</h3>
          <pre className="overflow-auto bg-gray-900 text-white p-4 rounded-md whitespace-pre-wrap font-mono text-sm border border-gray-700 flex-1">
            {output || "Kết quả sẽ hiện ở đây..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
