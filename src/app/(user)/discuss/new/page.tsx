"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useAuthContext } from "@/contexts/authContext";
import { CheckCircle2, PenLine, Sparkles, ArrowLeft } from "lucide-react";
import RichTextEditor from "@/components/Discussion/RichTextEditor";
import Link from "next/link";

const DEFAULT_TOPICS: string[] = [
  "Mảng",
  "Chuỗi",
  "Bảng băm",
  "Quy hoạch động",
  "Tham lam",
  "Hai con trỏ",
  "Tìm kiếm nhị phân",
  "Đồ thị",
  "Cây",
];

function stripMarkdown(md: string) {
  return (md || "")
    .replace(/```[\s\S]*?```/g, "") // bỏ code block
    .replace(/`([^`]+)`/g, "$1") // bỏ inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // bỏ ảnh
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // link -> text
    .replace(/[#>*_~+-]/g, "") // bỏ ký tự markdown cơ bản
    .replace(/\+\+/g, "") // underline custom
    .replace(/\s+/g, " ")
    .trim();
}

export default function NewDiscussionPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState(""); // markdown

  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [newlyAddedTopics, setNewlyAddedTopics] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopicSuccess, setShowTopicSuccess] = useState(false);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const snap = await getDocs(collection(db, "discussionTopics"));
        const fromDb: string[] = snap.docs.map((d) => d.data().label as string);
        const merged = Array.from(new Set([...DEFAULT_TOPICS, ...fromDb]));
        setAllTopics(merged);
      } catch (err) {
        console.error("Lỗi khi load topics:", err);
        setAllTopics(DEFAULT_TOPICS);
      }
    };

    loadTopics();
  }, []);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) => {
      const exists = prev.includes(topic);
      if (exists) {
        if (newlyAddedTopics.includes(topic)) {
          setAllTopics((prevAll) => prevAll.filter((t) => t !== topic));
          setNewlyAddedTopics((prevNew) => prevNew.filter((t) => t !== topic));
        }
        return prev.filter((t) => t !== topic);
      }
      return [...prev, topic];
    });
  };

  const handleAddTopic = async () => {
    const value = newTopicInput.trim();
    if (!value) return;
    if (allTopics.includes(value)) {
      if (!selectedTopics.includes(value)) {
        setSelectedTopics((prev) => [...prev, value]);
      }
      setNewTopicInput("");
      return;
    }

    try {
      setAllTopics((prev) => [...prev, value]);
      setSelectedTopics((prev) => [...prev, value]);
      setNewlyAddedTopics((prev) => [...prev, value]);
      setNewTopicInput("");
      setShowTopicSuccess(true);

      const id = value.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "discussionTopics", id), {
        label: value,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Lỗi khi thêm chủ đề mới:", err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Tiêu đề và nội dung không được để trống.");
      return;
    }
    if (!user) {
      setError("Bạn cần đăng nhập để đăng chủ đề.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const plain = stripMarkdown(content);
      const docRef = await addDoc(collection(db, "discussions"), {
        title: title.trim(),
        excerpt: excerpt.trim() || plain.slice(0, 150),
        content: content.trim(), // markdown
        repliesCount: 0,
        likesCount: 0,
        dislikesCount: 0,
        viewsCount: 0,
        tags: selectedTopics,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        author: {
          uid: user.uid,
          name: user.displayName || user.email || "Người dùng",
        },
      });

      router.push(`/discuss/${docRef.id}`);
    } catch (err) {
      console.error("Lỗi khi tạo chủ đề:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ===== NOT LOGGED IN STATE =====
  if (!user) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <PenLine className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Đăng nhập để tiếp tục</h2>
            <p className="mb-6 text-sm text-slate-400">
              Bạn cần đăng nhập để tạo chủ đề thảo luận.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              Đi tới trang đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN FORM =====
  return (
    <div className="relative min-h-screen bg-slate-950">
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/discuss"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
            Tạo bài thảo luận mới
          </h1>
          <p className="text-sm text-slate-400">
            Chia sẻ câu hỏi, kiến thức hoặc kinh nghiệm với cộng đồng
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:p-10 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Input */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tiêu đề bài viết <span className="text-red-400">*</span></span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-700 border-b border-slate-800 pb-3 outline-none focus:border-blue-500 transition-colors"
                placeholder='VD: Làm thế nào để giải "Two Sum" bằng hash map?'
              />
            </div>

            {/* Excerpt Input */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Mô tả ngắn <span className="text-slate-500">(tùy chọn)</span></span>
              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-transparent text-base text-slate-300 placeholder-slate-700 border-b border-slate-800 pb-2 outline-none focus:border-blue-500 transition-colors"
                placeholder="Mô tả ngắn gọn nội dung câu hỏi / chủ đề..."
              />
            </div>

            {/* Topics Section */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Chủ đề</span>

              {/* Topic Tags */}
              <div className="flex flex-wrap gap-2">
                {allTopics
                  .filter((t) => t && t.trim() !== "")
                  .map((topic) => {
                    const selected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                          selected
                            ? "border-blue-500 bg-blue-600/10 text-blue-400 font-semibold"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
              </div>

              {/* Add New Topic */}
              <div className="flex gap-2 max-w-sm pt-1">
                <input
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors"
                  placeholder="Thêm chủ đề mới..."
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Nội dung chi tiết <span className="text-red-400">*</span></span>
              <div className="overflow-hidden rounded-xl">
                <RichTextEditor value={content} onChange={setContent} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Đang tạo...
                  </span>
                ) : (
                  "Đăng bài thảo luận"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Success Modal */}
        {showTopicSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Thêm chủ đề mới thành công
                </h2>
              </div>
              <p className="mb-6 text-sm text-slate-400">
                Chủ đề đã được thêm vào danh sách. Bạn có thể tiếp tục tạo bài
                viết.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTopicSuccess(false)}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
