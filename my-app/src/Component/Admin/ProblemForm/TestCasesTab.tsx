"use client";

import { ProblemFormData } from "./types";
import { Plus, Trash2, Database, UploadCloud } from "lucide-react";
import { useState } from "react";

type Props = {
  data: ProblemFormData;
  onChange: (updates: Partial<ProblemFormData>) => void;
};

export default function TestCasesTab({ data, onChange }: Props) {
  const [jsonInput, setJsonInput] = useState("");

  const addTestCase = () => {
    onChange({
      testCases: [...data.testCases, { input: "", output: "" }],
    });
  };

  const removeTestCase = (idx: number) => {
    onChange({
      testCases: data.testCases.filter((_, i) => i !== idx),
    });
  };

  const updateTestCase = (idx: number, field: "input" | "output" | "isHidden", val: string | boolean) => {
    const newCases = [...data.testCases];
    newCases[idx] = { ...newCases[idx], [field]: val };
    onChange({ testCases: newCases });
  };

  const handleBulkImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (Array.isArray(parsed)) {
        // Validate items
        const valid = parsed.every(item => "input" in item && "output" in item);
        if (valid) {
            if(confirm(`Found ${parsed.length} test cases. Replace existing ones?`)) {
                onChange({ testCases: parsed });
                setJsonInput("");
            }
        } else {
            alert("Invalid format. Array must contain objects with 'input' and 'output' fields.");
        }
      }
    } catch (e) {
      alert("Invalid JSON");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex gap-3 text-purple-300 shadow-lg shadow-purple-500/5">
        <Database className="shrink-0 text-purple-400" />
        <div className="space-y-1">
            <p className="text-sm font-bold">Test Cases Đánh Giá (Ẩn)</p>
            <p className="text-xs opacity-80">
            Các test case này sẽ được dùng để chấm điểm khi user nộp bài. Người dùng sẽ KHÔNG thấy nội dung này.
            </p>
        </div>
      </div>

      {/* Manual Entry */}
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <h3 className="text-lg font-semibold text-slate-200">Danh Sách Test Case ({data.testCases.length})</h3>
            <button 
                onClick={addTestCase}
                className="text-xs flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all font-bold shadow-lg shadow-purple-900/20"
            >
                <Plus size={16} /> Thêm Test Case
            </button>
        </div>

        <div className="space-y-4">
            {data.testCases.map((tc, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group transition-all hover:border-slate-700 shadow-xl">
                     <div className="absolute top-2 right-2 px-2 py-1 bg-slate-950/50 rounded text-[10px] text-slate-400 font-mono border border-slate-800">
                        Case #{idx + 1}
                     </div>
                     <div className="absolute top-2 left-6 flex items-center gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={tc.isHidden || false} 
                                    onChange={e => updateTestCase(idx, 'isHidden', e.target.checked)}
                                    className="accent-purple-500 w-4 h-4 rounded"
                                />
                                Ẩn (Hidden)
                            </label>
                     </div>
                    <button 
                        onClick={() => removeTestCase(idx)}
                        className="absolute top-8 right-3 p-2 text-slate-500 hover:text-red-400 hover:bg-slate-950 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-6 pr-12">
                        <div className="group/input">
                            <label className="text-xs text-purple-400 font-bold mb-1 block group-focus-within/input:text-purple-300 transition-colors uppercase tracking-wider">Input (Dữ liệu vào)</label>
                            <textarea 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono h-24 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-200 transition-all placeholder:text-slate-700/50 shadow-inner resize-none"
                                value={tc.input}
                                onChange={e => updateTestCase(idx, 'input', e.target.value)}
                                placeholder="Nhập dữ liệu vào..."
                            />
                        </div>
                        <div className="group/input">
                            <label className="text-xs text-purple-400 font-bold mb-1 block group-focus-within/input:text-purple-300 transition-colors uppercase tracking-wider">Output (Kết quả chuẩn)</label>
                             <textarea 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono h-24 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-200 transition-all placeholder:text-slate-700/50 shadow-inner resize-none"
                                value={tc.output}
                                onChange={e => updateTestCase(idx, 'output', e.target.value)}
                                placeholder="Nhập kết quả mong đợi..."
                            />
                        </div>
                    </div>
                </div>
            ))}
            {data.testCases.length === 0 && (
                <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                    <Database size={32} className="mx-auto mb-2 opacity-20" />
                    Chưa có test case nào. Hãy thêm ít nhất 1 cái.
                </div>
            )}
        </div>
      </div>

       <hr className="border-slate-800" />
       
       {/* Bulk Import */}
       <div className="space-y-2 group/bulk">
            <h3 className="text-sm font-semibold text-slate-400 group-focus-within/bulk:text-purple-400 transition-colors">Nhập Nhanh (JSON Bulk Import)</h3>
            <div className="flex gap-2">
                <textarea 
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono h-20 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-slate-300 transition-all placeholder:text-slate-700/50 shadow-inner resize-none"
                    placeholder='[{"input": "1 2", "output": "3"}, ...]'
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                />
                <button 
                    onClick={handleBulkImport}
                    disabled={!jsonInput}
                    className="px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-xs min-w-[100px] border border-slate-700 hover:border-slate-600 shadow-md"
                >
                    <UploadCloud size={16} />
                    Nhập Dữ Liệu
                </button>
            </div>
       </div>
    </div>
  );
}
