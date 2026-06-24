"use client";

import { ProblemFormData } from "./types";
import { useState } from "react";
import { Code2, Terminal } from "lucide-react";

type Props = {
  data: ProblemFormData;
  onChange: (updates: Partial<ProblemFormData>) => void;
};

const LANGUAGES = [
  { id: "cpp", label: "C++" },
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
] as const;

export default function CodeTemplatesTab({ data, onChange }: Props) {
  const [activeLang, setActiveLang] = useState<keyof typeof data.defaultCode>("cpp");

  const updateDefaultCode = (val: string) => {
    onChange({
      defaultCode: {
        ...data.defaultCode,
        [activeLang]: val,
      },
    });
  };

  const updateDriverCode = (val: string) => {
    onChange({
      driverCodes: {
        ...data.driverCodes,
        [activeLang]: val,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      {/* Language Selector */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800 w-fit">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setActiveLang(lang.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeLang === lang.id
                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-[500px]">
        {/* Default Code Section */}
        <div className="flex flex-col space-y-2 group">
          <label className="text-sm font-bold text-slate-300 flex items-center gap-2 group-focus-within:text-blue-400 transition-colors">
            <Code2 size={16} />
            Mã Mẫu (User Starter Code)
          </label>
          <div className="text-xs text-slate-500 mb-1">
            Đoạn code này sẽ hiện ra khi người dùng bắt đầu làm bài.
          </div>
          <textarea
            className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-mono text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none shadow-inner leading-relaxed"
            placeholder={`// Code mẫu cho ${activeLang}...`}
            value={data.defaultCode?.[activeLang] || ""}
            onChange={(e) => updateDefaultCode(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Driver Code Section */}
        <div className="flex flex-col space-y-2 group">
          <label className="text-sm font-bold text-slate-300 flex items-center gap-2 group-focus-within:text-purple-400 transition-colors">
            <Terminal size={16} />
            Driver Code (Hidden Runner)
          </label>
          <div className="text-xs text-slate-500 mb-1">
            Code dùng để chấm bài (ẩn với user). Dùng `// __USER_CODE_HERE__` để đánh dấu vị trí chèn code của user.
          </div>
          <textarea
            className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-4 font-mono text-sm text-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none shadow-inner leading-relaxed"
            placeholder={`// Driver code cho ${activeLang}...\n// __USER_CODE_HERE__`}
            value={data.driverCodes?.[activeLang] || ""}
            onChange={(e) => updateDriverCode(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
