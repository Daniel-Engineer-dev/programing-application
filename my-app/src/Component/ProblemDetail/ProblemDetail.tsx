"use client";
import { useState } from "react";

type Example = {
  input: string;
  output: string;
};

type ProblemDetailsProps = {
  title: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
};

export default function ProblemDetails({
  title,
  difficulty,
  description,
  examples,
  constraints,
}: ProblemDetailsProps) {
  const [tab, setTab] = useState<"description" | "examples" | "constraints">(
    "description"
  );

  return (
    <div className="rounded-2xl w-[45%] border flex flex-col text-white border-slate-700 mt-2 mr-1 mb-15 ml-5">
      {/* Header */}
      <div className="p-5">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p
          className={`text-sm mt-1 ${
            difficulty === "Easy"
              ? "text-green-600"
              : difficulty === "Medium"
              ? "text-yellow-600"
              : "text-red-600"
          }`}
        >
          {difficulty}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-t border-b border-slate-700 text-sm">
        <button
          className={`px-4 py-2 ${
            tab === "description" && "border-b-2 border-blue-600 font-medium"
          }`}
          onClick={() => setTab("description")}
        >
          Mô tả
        </button>
        <button
          className={`px-4 py-2 ${
            tab === "examples" && "border-b-2 border-blue-600 font-medium"
          }`}
          onClick={() => setTab("examples")}
        >
          Ví dụ
        </button>
        <button
          className={`px-4 py-2 ${
            tab === "constraints" && "border-b-2 border-blue-600 font-medium"
          }`}
          onClick={() => setTab("constraints")}
        >
          Ràng buộc
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-5 overflow-y-auto">
        {tab === "description" && (
          <div
            dangerouslySetInnerHTML={{ __html: description }}
            className="prose max-w-none"
          />
        )}

        {tab === "examples" && (
          <div>
            {examples.map((ex, idx) => (
              <div
                key={idx}
                className="mb-4 rounded border border-slate-700 bg-slate-800 p-3 text-sm"
              >
                <p>
                  <strong>Input:</strong> {ex.input}
                </p>
                <p>
                  <strong>Output:</strong> {ex.output}
                </p>
              </div>
            ))}
          </div>
        )}

        {tab === "constraints" && (
          <ul className="list-disc pl-5 text-sm">
            {constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
