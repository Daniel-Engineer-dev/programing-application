"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useAuthContext } from "@/contexts/authContext";
import { CheckCircle2, Edit3, ArrowLeft, Loader2 } from "lucide-react";
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

export default function EditDiscussionPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user } = useAuthContext();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [newlyAddedTopics, setNewlyAddedTopics] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopicSuccess, setShowTopicSuccess] = useState(false);

  // load dữ liệu bài viết + topics
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const ref = doc(db, "discussions", id as string);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setError("Không tìm thấy chủ đề.");
          setLoading(false);
          return;
        }
        const data: any = snap.data();

        setTitle(data.title ?? "");
        setExcerpt(data.excerpt ?? "");
        setContent(data.content ?? "");
        setSelectedTopics(data.tags ?? []);

        const topicsSnap = await getDocs(collection(db, "discussionTopics"));
        const fromDb: string[] = topicsSnap.docs.map(
          (d) => d.data().label as string
        );
        const merged = Array.from(
          new Set([...DEFAULT_TOPICS, ...fromDb, ...(data.tags ?? [])])
        );
        setAllTopics(merged);
      } catch (err) {
        console.error("Lỗi load bài khi edit:", err);
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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

      const topicId = value.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "discussionTopics", topicId), {
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
      setError("Bạn cần đăng nhập để chỉnh sửa.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const ref = doc(db, "discussions", id as string);
      await updateDoc(ref, {
        title: title.trim(),
        excerpt:
          excerpt.trim() || content.replace(/<[^>]+>/g, "").slice(0, 150),
        content: content.trim(),
        tags: selectedTopics,
        updatedAt: serverTimestamp(),
      });

      router.push(`/discuss/${id}`);
    } catch (err) {
      console.error("Lỗi update bài:", err);
      setError("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // ===== NOT LOGGED IN STATE =====
  if (!user) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <Edit3 className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-white">Đăng nhập để tiếp tục</h2>
            <p className="mb-6 text-sm text-slate-400">
              Bạn cần đăng nhập để chỉnh sửa chủ đề.
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

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <p className="text-slate-400">Đang tải dữ liệu bài viết...</p>
          </div>
        </div>
      </div>
    );
  }

  // ===== ERROR STATE (no content) =====
  if (error && !title) {
    return (
      <div className="relative min-h-screen bg-slate-950">
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-red-400">{error}</p>
            <Link
              href="/discuss"
              className="mt-4 inline-block text-sm text-slate-400 hover:text-white"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN EDIT FORM =====
  return (
    <div className="relative min-h-screen bg-slate-950">
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href={`/discuss/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại bài viết
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl mb-2">
            Chỉnh sửa bài thảo luận
          </h1>
          <p className="text-sm text-slate-400">
            Cập nhật nội dung bài viết của bạn
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Tiêu đề <span className="text-red-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500"
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
                className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500"
                rows={2}
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
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-500"
                  placeholder="Thêm chủ đề mới..."
                />
                <button
                  type="button"
                  onClick={handleAddTopic}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
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
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
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
                disabled={saving}
                className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Đang cập nhật...
                  </span>
                ) : (
                  "Cập nhật bài thảo luận"
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
                Chủ đề đã được thêm vào danh sách. Bạn có thể tiếp tục chỉnh sửa
                bài viết.
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
