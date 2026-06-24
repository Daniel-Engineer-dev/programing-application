"use client";

import { ProblemFormData } from "./types";
import { Plus, Trash2, Globe } from "lucide-react";

type Props = {
  data: ProblemFormData;
  onChange: (updates: Partial<ProblemFormData>) => void;
};

export default function ExamplesTab({ data, onChange }: Props) {
  // --- EXAMPLES Logic ---
  const addExample = () => {
    onChange({
      examples: [...data.examples, { input: "", output: "", explanation: "" }],
    });
  };

  const removeExample = (idx: number) => {
    onChange({
      examples: data.examples.filter((_, i) => i !== idx),
    });
  };

  const updateExample = (idx: number, field: "input" | "output" | "explanation", val: string) => {
    const newExamples = [...data.examples];
    newExamples[idx] = { ...newExamples[idx], [field]: val };
    onChange({ examples: newExamples });
  };

  // --- CONSTRAINTS Logic ---
  const addConstraint = () => {
    onChange({ constraints: [...data.constraints, ""] });
  };
  
  const removeConstraint = (idx: number) => {
    onChange({ constraints: data.constraints.filter((_, i) => i !== idx) });
  };

  const updateConstraint = (idx: number, val: string) => {
    const newCons = [...data.constraints];
    newCons[idx] = val;
    onChange({ constraints: newCons });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* EXAMPLES SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Globe size={18} className="text-green-400" /> Ví Dụ (Hiển thị cho User)
            </h3>
            <button 
                onClick={addExample}
                className="text-xs flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-green-900/20"
            >
                <Plus size={14} /> Thêm Ví Dụ
            </button>
        </div>
        
        <div className="space-y-4">
            {data.examples.map((ex, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group transition-all hover:border-slate-700 shadow-xl">
                    <button 
                        onClick={() => removeExample(idx)}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 size={16} />
                    </button>
                    
                    <div className="space-y-4 pr-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="group/input">
                                <label className="text-xs text-slate-500 font-bold mb-1 block group-focus-within/input:text-green-400 transition-colors uppercase tracking-wider">Input</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono h-24 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-slate-200 transition-all placeholder:text-slate-700/50 shadow-inner resize-none"
                                    value={ex.input}
                                    onChange={e => updateExample(idx, 'input', e.target.value)}
                                    placeholder="VD: nums = [2,7,11,15], target = 9"
                                />
                            </div>
                            <div className="group/input">
                                <label className="text-xs text-slate-500 font-bold mb-1 block group-focus-within/input:text-green-400 transition-colors uppercase tracking-wider">Output</label>
                                <textarea 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono h-24 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-slate-200 transition-all placeholder:text-slate-700/50 shadow-inner resize-none"
                                    value={ex.output}
                                    onChange={e => updateExample(idx, 'output', e.target.value)}
                                    placeholder="VD: [0,1]"
                                />
                            </div>
                        </div>
                        <div className="group/input">
                             <label className="text-xs text-slate-500 font-bold mb-1 block group-focus-within/input:text-green-400 transition-colors uppercase tracking-wider">Giải thích (Tùy chọn)</label>
                             <input 
                                type="text"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-slate-200 transition-all placeholder:text-slate-700/50 shadow-inner"
                                value={ex.explanation}
                                onChange={e => updateExample(idx, 'explanation', e.target.value)}
                                placeholder="VD: Vì nums[0] + nums[1] == 9, nên trả về [0, 1]."
                             />
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <hr className="border-slate-800" />

      {/* CONSTRAINTS SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">Các Ràng Buộc (Constraints)</h3>
            <button 
                onClick={addConstraint}
                className="text-xs flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-blue-900/20"
            >
                <Plus size={14} /> Thêm Dòng
            </button>
        </div>
        
        <div className="space-y-2">
            {data.constraints.map((c, idx) => (
                <div key={idx} className="flex gap-2 group/constraint">
                    <input 
                        type="text"
                         className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-700/50 shadow-inner"
                         placeholder="VD: 1 <= N <= 10^5"
                         value={c}
                         onChange={e => updateConstraint(idx, e.target.value)}
                    />
                    <button 
                        onClick={() => removeConstraint(idx)}
                        className="p-3 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
