"use client";

import { ProblemFormData } from "./types";

type Props = {
  data: ProblemFormData;
  onChange: (updates: Partial<ProblemFormData>) => void;
};

export default function DescriptionTab({ data, onChange }: Props) {
  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 flex flex-col space-y-2 h-full group">
        <label className="text-sm font-medium text-slate-300 flex justify-between group-focus-within:text-blue-400 transition-colors">
            <span>Mô Tả Bài Toán</span>
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Preview Mode: Off</span>
        </label>
        <textarea
          className="flex-1 w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-200 font-mono text-sm leading-relaxed resize-none shadow-inner"
          placeholder="# Tiêu đề bài toán&#10;&#10;Mô tả chi tiết đề bài ở đây..."
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </div>
  );
}
