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
    <div className="w-[45%] border-r flex flex-col">
      {/* Header */}
      <div className="p-5 border-b">
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
      <div className="flex border-b text-sm">
        <button
          className={`px-4 py-2 ${
            tab === "description" && "border-b-2 border-blue-600 font-medium"
          }`}
          onClick={() => setTab("description")}
        >
          Description
        </button>
        <button
          className={`px-4 py-2 ${
            tab === "examples" && "border-b-2 border-blue-600 font-medium"
          }`}
          onClick={() => setTab("examples")}
        >
          Examples
        </button>
        <button
          className={`px-4 py-2 ${
            tab === "constraints" && "border-b-2 border-blue-600 font-medium"
          }`}
          onClick={() => setTab("constraints")}
        >
          Constraints
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
                className="mb-4 rounded border bg-gray-50 p-3 text-sm"
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
