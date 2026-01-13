"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { CheckCircle2, PenLine, Sparkles, ArrowLeft } from "lucide-react";
import RichTextEditor from "@/src/Component/Discussion/RichTextEditor";
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

      router.push(`/routes/discuss/${docRef.id}`);
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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-blue-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <PenLine className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Đăng nhập để tiếp tục</h2>
            <p className="mb-6 text-sm text-slate-400">
              Bạn cần đăng nhập để tạo chủ đề thảo luận.
            </p>
            <button
              onClick={() => router.push("/routes/auth/login")}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30"
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 animate-pulse rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 animate-pulse rounded-full bg-purple-600/20 blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-emerald-600/10 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/routes/discuss"
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Tạo bài thảo luận mới
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Chia sẻ câu hỏi, kiến thức hoặc kinh nghiệm với cộng đồng
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Tiêu đề <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20"
                placeholder='VD: Làm thế nào để giải "Two Sum" bằng hash map?'
              />
            </div>

            {/* Excerpt Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Mô tả ngắn <span className="text-slate-500">(tùy chọn)</span>
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full resize-none rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20"
                rows={2}
                placeholder="Mô tả ngắn gọn nội dung câu hỏi / chủ đề..."
              />
            </div>

            {/* Topics Section */}
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-200">
                Chủ đề
              </label>

              {/* Topic Tags */}
              <div className="mb-4 flex flex-wrap gap-2">
                {allTopics
                  .filter((t) => t && t.trim() !== "")
                  .map((topic) => {
                    const selected = selectedTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => toggleTopic(topic)}
                        className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                          selected
                            ? "border-blue-500/50 bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/10"
                            : "border-slate-600/50 bg-slate-800/50 text-slate-400 hover:border-blue-400/50 hover:bg-slate-700/50 hover:text-slate-300"
                        }`}
                      >
                        {topic}
                      </button>
                    );
                  })}
              </div>

              {/* Add New Topic */}
              <div className="flex gap-2">
                <input
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTopic();
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="Thêm chủ đề mới..."
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="rounded-xl bg-slate-700/80 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-600"
                >
                  Thêm
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Bạn có thể chọn nhiều chủ đề cho một bài viết.
              </p>
            </div>

            {/* Content Editor */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Nội dung chi tiết <span className="text-red-400">*</span>
              </label>
              <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/30">
                <RichTextEditor value={content} onChange={setContent} />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-700/50 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl">
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
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl"
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
