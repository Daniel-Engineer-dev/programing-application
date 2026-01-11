import { ProblemFormData } from "./types";
import { Info, X, Plus, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Props = {
  data: ProblemFormData;
  onChange: (updates: Partial<ProblemFormData>) => void;
  isEditMode?: boolean;
};

const AVAILABLE_TAGS = [
  "Array", "String", "Hash Table", "Dynamic Programming", "Math", 
  "Sorting", "Greedy", "Depth-First Search", "Binary Search", "Tree", 
  "Breadth-First Search", "Matrix", "Two Pointers", "Bit Manipulation", 
  "Stack", "Heap", "Graph", "Design", "Backtracking", "Linked List", 
  "Union Find", "Trie", "Recursion", "Divide and Conquer"
];

export default function BasicInfoTab({ data, onChange, isEditMode }: Props) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      onChange({ tags: [...data.tags, trimmed] });
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange({ tags: data.tags.filter(t => t !== tagToRemove) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && data.tags.length > 0) {
      removeTag(data.tags[data.tags.length - 1]);
    }
  };

  const suggestions = AVAILABLE_TAGS.filter(
    t => t.toLowerCase().includes(inputValue.toLowerCase()) && !data.tags.includes(t)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-blue-300 shadow-lg shadow-blue-500/5">
        <Info className="shrink-0 text-blue-400" />
        <p className="text-sm">
          Vui lòng điền các thông tin cơ bản của bài toán. Tên bài tập nên ngắn gọn và duy nhất.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2 group">
          <label className="text-sm font-medium text-slate-300 group-focus-within:text-blue-400 transition-colors">ID Bài Tập (Tuỳ chọn cho bài mới)</label>
          <input
            type="text"
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="VD: two-sum (Để trống sẽ tự sinh ID)"
            value={data.id || ""}
            onChange={(e) => onChange({ id: e.target.value })}
            disabled={isEditMode}
          />
          {isEditMode && <p className="text-[10px] text-slate-500">ID không thể thay đổi sau khi tạo.</p>}
        </div>

        <div className="space-y-2 group">
          <label className="text-sm font-medium text-slate-300 group-focus-within:text-blue-400 transition-colors">Tên Bài Tập</label>
          <input
            type="text"
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white transition-all shadow-inner"
            placeholder="VD: Two Sum (Tổng hai số)"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2 group">
          <label className="text-sm font-medium text-slate-300 group-focus-within:text-purple-400 transition-colors">Độ Khó</label>
          <select
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-white transition-all appearance-none shadow-inner"
            value={data.difficulty}
            onChange={(e) => onChange({ difficulty: e.target.value as any })}
          >
            <option value="Easy">Dễ (Easy)</option>
            <option value="Medium">Vừa (Medium)</option>
            <option value="Hard">Khó (Hard)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 group" ref={wrapperRef}>
        <label className="text-sm font-medium text-slate-300 group-focus-within:text-pink-400 transition-colors">Thẻ (Tags)</label>
        
        <div className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-2 py-2 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500 transition-all shadow-inner flex flex-wrap gap-2 min-h-[50px]">
            {data.tags.map(tag => (
                <span key={tag} className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border border-pink-500/30 animate-in zoom-in duration-200">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-white hover:bg-pink-500/50 rounded-full p-0.5 transition-colors">
                        <X size={12} />
                    </button>
                </span>
            ))}
            
            <div className="relative flex-1 min-w-[120px]">
                <input
                    type="text"
                    className="w-full bg-transparent outline-none text-slate-200 text-sm h-full py-1 px-2"
                    placeholder={data.tags.length === 0 ? "Nhập hoặc chọn thẻ..." : ""}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && (inputValue || suggestions.length > 0) && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                        {suggestions.length > 0 ? (
                            suggestions.map(tag => (
                                <button
                                    key={tag}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-pink-400 flex items-center justify-between group/item"
                                    onClick={() => {
                                        addTag(tag);
                                        wrapperRef.current?.querySelector('input')?.focus();
                                    }}
                                >
                                    {tag}
                                    <Plus size={14} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                </button>
                            ))
                        ) : inputValue ? (
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-pink-400 hover:bg-slate-800 flex items-center gap-2 font-bold"
                                onClick={() => addTag(inputValue)}
                            >
                                <Plus size={14} /> Thêm mới "{inputValue}"
                            </button>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
        <p className="text-xs text-slate-500">Ấn nhầm có thể xóa. Gõ để tìm kiếm hoặc thêm mới.</p>
      </div>
    </div>
  );
}
