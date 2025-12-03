"use client";
import { useState } from "react";

type Example = {
  input: string;
  output: string;
  explanation?: string; // Bổ sung optional explanation nếu có
};

type ProblemDetailsProps = {
  title: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
  tags: string[];
};

type TabType = "description" | "editorial" | "solution" | "submissions";

export default function ProblemDetails({
  title,
  difficulty,
  description,
  examples,
  constraints,
  tags,
}: ProblemDetailsProps) {
  const [tab, setTab] = useState<TabType>("description");
  // State giả lập cho like/comment
  const [liked, setLiked] = useState(false);
  const [starred, setStarred] = useState(false);
  // Helper để style nút tab
  const getTabClass = (activeTab: TabType) => {
    return `px-4 py-2 hover:bg-slate-800 transition-colors hover:rounded-2xl hover:font-bold hover:cursor-pointer ${
      tab === activeTab
        ? "border-b-2 border-blue-600 text-white font-medium"
        : "text-gray-400 hover:text-white"
    }`;
  };

  return (
    <div className="rounded-2xl w-[45%] border flex flex-col text-white border-slate-700 mt-2 mr-1 mb-15 ml-5 h-[90vh] bg-slate-950">
      {/* Header Tabs (Sticky top) */}
      <div className="flex border-b border-slate-700 text-sm bg-slate-950 rounded-t-2xl">
        <button
          className={getTabClass("description")}
          onClick={() => setTab("description")}
        >
          Mô tả
        </button>

        <button
          className={getTabClass("editorial")}
          onClick={() => setTab("editorial")}
        >
          Biên tập
        </button>
        <button
          className={getTabClass("solution")}
          onClick={() => setTab("solution")}
        >
          Giải pháp
        </button>
        <button
          className={getTabClass("submissions")}
          onClick={() => setTab("submissions")}
        >
          Lịch sử nộp bài
        </button>
      </div>

      {/* Content Area (Scrollable) */}
      <div className="p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {/* --- TAB 1: MÔ TẢ (Bao gồm Đề bài + Ví dụ + Ràng buộc) --- */}
        {tab === "description" && (
          <div className="space-y-8">
            {/* 1. Header Bài Toán */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{title}</h1>
              <div className="flex items-center gap-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full bg-opacity-20 ${
                    difficulty === "Easy"
                      ? "text-green-500 bg-slate-700"
                      : difficulty === "Medium"
                      ? "text-yellow-500 bg-slate-700"
                      : "text-red-500 bg-slate-700"
                  }`}
                >
                  {difficulty}
                </span>
                {/* --- KHỐI TAGS BÀI TOÁN --- */}
                {tags && tags.length > 0 && (
                  <>
                    <span className="text-slate-600">|</span>{" "}
                    {/* Dấu gạch ngăn cách */}
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 2. Nội dung HTML mô tả */}
            <div
              dangerouslySetInnerHTML={{ __html: description }}
              className="prose prose-invert max-w-none text-sm leading-relaxed"
            />

            {/* 3. Danh sách Ví dụ */}
            <div className="space-y-4">
              {examples.map((ex, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border-l-4 border-slate-600 bg-slate-900 p-4 text-sm font-mono space-y-2"
                >
                  <h3 className="font-bold text-base">Ví dụ {idx + 1}:</h3>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-400">Input:</span>
                    <span className="text-slate-200">{ex.input}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold text-slate-400">Output:</span>
                    <span className="text-slate-200">{ex.output}</span>
                  </div>
                  {ex.explanation && (
                    <div className="flex gap-2">
                      <span className="font-bold text-slate-400">
                        Explanation:
                      </span>
                      <span className="text-slate-200">{ex.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 4. Ràng buộc */}
            <div className="space-y-3">
              <h3 className="font-bold text-base">Ràng buộc:</h3>
              <ul className="list-disc pl-5 text-sm space-y-1 text-slate-300 font-mono">
                {constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* --- TAB 2: EDITORIAL (Bài giải thích) --- */}
        {tab === "editorial" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Editorial Solution</h2>
            <div className="space-y-4">
              {/* Approach 1 */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  Approach 1: Brute Force
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  The simplest method is to iterate through all possible pairs
                  of elements and check if their sum equals the target. This
                  approach is intuitive but not efficient for large datasets.
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-700 font-mono text-xs text-gray-300">
                  <span className="text-purple-400">Time Complexity:</span>{" "}
                  O(n^2)
                  <br />
                  <span className="text-purple-400">
                    Space Complexity:
                  </span>{" "}
                  O(1)
                </div>
              </div>

              {/* Approach 2 */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  Approach 2: Two-pass Hash Table
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">
                  We can improve time complexity by using a Hash Table to store
                  indices of elements. In the first iteration, we add each
                  element's value and its index to the table. Then, in the
                  second iteration, we check if each element's complement
                  (target - nums[i]) exists in the table.
                </p>
                <div className="bg-slate-950 p-3 rounded border border-slate-700 font-mono text-xs text-gray-300">
                  <span className="text-green-400">Time Complexity:</span> O(n)
                  <br />
                  <span className="text-green-400">Space Complexity:</span> O(n)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: SOLUTIONS (Cộng đồng) --- */}
        {tab === "solution" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Community Solutions</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-slate-900 border border-slate-700 text-xs rounded-full px-4 py-1.5 focus:outline-none focus:border-blue-500 w-40"
                />
              </div>
            </div>

            {/* Danh sách các giải pháp giả lập */}
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="group p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:bg-slate-800 hover:border-slate-600 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                    {item === 1
                      ? "Simple C++ Solution O(n)"
                      : item === 2
                      ? "Java HashMap Approach 100% Faster"
                      : "Python One-Liner (Not recommended for interview)"}
                  </h3>
                  <div className="flex gap-1">
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                      {item === 1 ? "C++" : item === 2 ? "Java" : "Python"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    <span>1.2k</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                      />
                    </svg>
                    <span>{150 * item}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <div className="w-4 h-4 rounded-full bg-linear-to-tr from-blue-500 to-purple-500"></div>
                    <span>user_{item}23</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- TAB 4: SUBMISSIONS (Lịch sử) --- */}
        {tab === "submissions" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">My Submissions</h2>

            {/* Table Header */}
            <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <div className="col-span-2">Status</div>
              <div>Runtime</div>
              <div>Memory</div>
              <div className="text-right">Time</div>
            </div>

            {/* Submission Rows (Mock Data) */}
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-slate-900/30 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900 transition-all items-center text-sm">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-green-500 font-bold">Accepted</span>
                </div>
                <div className="text-slate-300">15 ms</div>
                <div className="text-slate-300">10.4 MB</div>
                <div className="text-right text-slate-500 text-xs">
                  Just now
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-slate-900/30 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900 transition-all items-center text-sm">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-red-500 font-bold">Wrong Answer</span>
                </div>
                <div className="text-slate-300">N/A</div>
                <div className="text-slate-300">N/A</div>
                <div className="text-right text-slate-500 text-xs">
                  2 hours ago
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-slate-900/30 rounded-lg border border-transparent hover:border-slate-700 hover:bg-slate-900 transition-all items-center text-sm">
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-yellow-500 font-bold">
                    Runtime Error
                  </span>
                </div>
                <div className="text-slate-300">N/A</div>
                <div className="text-slate-300">N/A</div>
                <div className="text-right text-slate-500 text-xs">
                  1 day ago
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* --- 5. FOOTER TOOLBAR (FIXED BOTTOM) --- */}
      {/* Chỉ hiển thị toolbar khi đang ở tab Description */}
      {tab === "description" && (
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-sm bg-slate-950 rounded-b-2xl shrink-0">
          {/* Các nút tương tác bên trái */}
          <div className="flex items-center gap-6">
            {/* Like Button */}
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                liked ? "text-blue-500" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 10v12" />
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
              </svg>
              <span className="font-medium">128</span>
            </button>

            {/* Dislike Button */}
            <button className="flex items-center gap-1.5 transition-colors hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 14V2" />
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H19a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
              </svg>
            </button>

            {/* Comment Button */}
            <button className="flex items-center gap-1.5 transition-colors hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-medium">42</span>
            </button>

            {/* Star Button */}
            <button
              onClick={() => setStarred(!starred)}
              className={`flex items-center gap-1.5 transition-colors hover:text-white ${
                starred ? "text-yellow-500 fill-yellow-500" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={starred ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>

            {/* Share Button */}
            <button className="flex items-center gap-1.5 transition-colors hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
            </button>

            {/* Help Button */}
            <button className="flex items-center gap-1.5 transition-colors hover:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </button>
          </div>

          {/* Trạng thái Online bên phải */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-slate-300 font-medium text-xs">
              14 Online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
