"use client";

import { ProblemFormData } from "./types";
import { Plus, Trash2, Youtube, Code2 } from "lucide-react";
import { useState } from "react";

type Props = {
  data: ProblemFormData;
  onChange: (updates: Partial<ProblemFormData>) => void;
};

export default function EditorialTab({ data, onChange }: Props) {
  const [activeApproach, setActiveApproach] = useState(0);

  const updateEditorial = (updates: Partial<typeof data.editorial>) => {
    onChange({ editorial: { ...data.editorial, ...updates } });
  };

  const addApproach = () => {
    const newApp = {
      name: "New Approach",
      description: "",
      code: { cpp: "", java: "", python: "", javascript: "" },
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
    };
    updateEditorial({ approaches: [...data.editorial.approaches, newApp] });
    setActiveApproach(data.editorial.approaches.length); // Switch to new one
  };

  const removeApproach = (idx: number) => {
    const newApps = data.editorial.approaches.filter((_, i) => i !== idx);
    updateEditorial({ approaches: newApps });
    if (activeApproach >= newApps.length) setActiveApproach(Math.max(0, newApps.length - 1));
  };

  const updateApproach = (idx: number, field: string, value: any) => {
    const newApps = [...data.editorial.approaches];
    newApps[idx] = { ...newApps[idx], [field]: value };
    updateEditorial({ approaches: newApps });
  };

  const updateCode = (appIdx: number, lang: string, code: string) => {
    const newApps = [...data.editorial.approaches];
    newApps[appIdx] = {
      ...newApps[appIdx],
      code: { ...newApps[appIdx].code, [lang]: code },
    };
    updateEditorial({ approaches: newApps });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-300">Lời Dẫn / Giới Thiệu Chung</label>
        <textarea
          className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 outline-none focus:border-blue-500 text-slate-200 text-sm h-32"
          placeholder="Viết lời dẫn hoặc giải thích tổng quan về bài toán..."
          value={data.editorial.content}
          onChange={(e) => updateEditorial({ content: e.target.value })}
        />

        <div className="flex gap-4 items-center">
            <div className="flex-1 space-y-2">
                 <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Youtube size={16} className="text-red-500"/> Link Video Hướng Dẫn
                 </label>
                 <input
                    type="text"
                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-white"
                    placeholder="https://youtube.com/watch?v=..."
                    value={data.editorial.videoUrl}
                    onChange={(e) => updateEditorial({ videoUrl: e.target.value })}
                 />
            </div>
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* APPROACHES SECTION */}
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-200">Các Cách Giải (Approaches)</h3>
            <button 
                onClick={addApproach}
                className="text-xs flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
                <Plus size={14} /> Thêm Cách Giải
            </button>
        </div>

        {data.editorial.approaches.length > 0 ? (
            <div className="flex gap-6">
                {/* Left Sidebar: List of Approaches */}
                <div className="w-1/4 space-y-2">
                    {data.editorial.approaches.map((app, idx) => (
                        <div 
                            key={idx}
                            onClick={() => setActiveApproach(idx)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                activeApproach === idx 
                                ? "bg-blue-500/20 border-blue-500 text-blue-200 font-bold" 
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="truncate text-xs">{idx + 1}. {app.name || "Untitled"}</span>
                                <button onClick={(e) => { e.stopPropagation(); removeApproach(idx); }} className="hover:text-red-400">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Content: Selected Approach Form */}
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-6">
                    {(() => {
                        const app = data.editorial.approaches[activeApproach];
                        return (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500">Tên Cách Giải</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                            value={app.name}
                                            onChange={e => updateApproach(activeApproach, 'name', e.target.value)}
                                            placeholder="VD: Brute Force, Hash Map..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                         <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500">Độ Phức Tạp Thời Gian</label>
                                            <input 
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                                value={app.timeComplexity}
                                                onChange={e => updateApproach(activeApproach, 'timeComplexity', e.target.value)}
                                                placeholder="VD: O(N)"
                                            />
                                        </div>
                                         <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500">Độ Phức Tạp Không Gian</label>
                                            <input 
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                                value={app.spaceComplexity}
                                                onChange={e => updateApproach(activeApproach, 'spaceComplexity', e.target.value)}
                                                placeholder="VD: O(1)"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                     <label className="text-xs font-bold text-slate-500">Mô Tả Chi Tiết</label>
                                     <textarea 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm h-24 outline-none focus:border-blue-500 text-slate-300"
                                        value={app.description}
                                        onChange={e => updateApproach(activeApproach, 'description', e.target.value)}
                                        placeholder="Giải thích cách hoạt động của thuật toán..."
                                     />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                        <Code2 size={14} /> Mã Nguồn Cài Đặt (Implementation)
                                    </label>
                                    <div className="grid grid-cols-1 gap-4">
                                        {['cpp', 'javascript', 'python', 'java'].map(lang => (
                                            <div key={lang} className="space-y-1">
                                                <span className="text-[10px] uppercase text-slate-600 font-bold">{lang}</span>
                                                <textarea 
                                                     className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono h-24 outline-none focus:border-blue-500 text-slate-400 focus:text-slate-200 transition-colors"
                                                     placeholder={`Nhập code ${lang}...`}
                                                     value={(app.code as any)[lang]}
                                                     onChange={e => updateCode(activeApproach, lang, e.target.value)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        ) : (
            <div className="text-center py-12 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                Chưa có cách giải nào. Hãy thêm một cách giải mới.
            </div>
        )}
      </div>
    </div>
  );
}
