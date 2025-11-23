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

  const [tab, setTab] = useState<"description" | "examples" | "constraints">(
    "description"
  );

  const [language, setLanguage] = useState("cpp");
  const [output, setOutput] = useState("");

  const handleRun = () => {
    // Mock UI
    setOutput("Output will appear here...");
  };

  return (
    <div className="flex h-screen bg-white">
      {/* LEFT PANEL */}
      <ProblemDetails
        title={problem.title}
        difficulty={problem.difficulty}
        description={problem.description}
        examples={problem.examples}
        constraints={problem.constraints}
      />

      {/* RIGHT PANEL */}
      <div className="w-[55%] flex flex-col">
        {/* Header */}
        <div className="border-b p-3 flex items-center justify-between bg-gray-50">
          {/* Language */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="cpp">C++</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={handleRun}
              className="rounded bg-gray-300 px-3 py-1 text-sm hover:bg-gray-400"
            >
              Run
            </button>
            <button className="rounded bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700">
              Submit
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
        <div className="border-t h-[40%] bg-white p-3 text-sm">
          <h3 className="text-sm font-medium mb-2">Output:</h3>
          <pre className="h-full overflow-auto bg-gray-50 p-3 rounded">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
