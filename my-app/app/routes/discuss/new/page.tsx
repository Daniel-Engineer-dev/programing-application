"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/src/api/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useAuthContext } from "@/src/userHook/context/authContext";
import { CheckCircle2 } from "lucide-react";
import RichTextEditor from "@/src/Component/Discussion/RichTextEditor";

const DEFAULT_TOPICS: string[] = [
  "Array (Mảng)",
  "String (Chuỗi)",
  "Hash Table (Bảng băm)",
  "Dynamic Programming (Quy hoạch động)",
  "Greedy (Tham lam)",
  "Two Pointers (Hai con trỏ)",
  "Binary Search (Tìm kiếm nhị phân)",
  "Graph (Đồ thị)",
  "Tree (Cây)",
  "Backtracking",
];

export default function NewDiscussionPage() {
  const router = useRouter();
  const { user } = useAuthContext();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");

  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [newlyAddedTopics, setNewlyAddedTopics] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopicSuccess, setShowTopicSuccess] = useState(false);

  // load topic từ collection + merge với default
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
        // nếu là topic mới thêm lần đầu, bỏ chọn thì xoá luôn khỏi list
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
      // nếu đã có rồi thì chỉ chọn nó
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

      const docRef = await addDoc(collection(db, "discussions"), {
        title: title.trim(),
        excerpt: excerpt.trim() || content.replace(/<[^>]+>/g, "").slice(0, 150),
        content: content.trim(), // HTML từ editor
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

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-200">
        <p className="mb-4 text-lg font-semibold">
          Bạn cần đăng nhập để tạo chủ đề thảo luận.
        </p>
        <button
          onClick={() => router.push("/routes/auth/login")}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Đi tới trang đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold text-white">
          Tạo Chủ đề Thảo luận Mới
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Tiêu đề *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder='VD: Làm thế nào để giải "Two Sum" bằng hash map?'
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold">
              Mô tả ngắn
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              rows={2}
              placeholder="Mô tả ngắn gọn nội dung câu hỏi / chủ đề..."
            />
          </div>

          {/* Chủ đề */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Chủ đề
            </label>
            <div className="mb-3 flex flex-wrap gap-2">
  {allTopics
    .filter((t) => t && t.trim() !== "")        // 👈 LỌC BỎ CHỦ ĐỀ RỖNG
    .map((topic) => {
      const selected = selectedTopics.includes(topic);
      return (
        <button
          key={topic}
          type="button"
          onClick={() => toggleTopic(topic)}
          className={`rounded-full border px-3 py-1 text-xs ${
            selected
              ? "border-blue-500 bg-blue-600/20 text-blue-200"
              : "border-slate-600 bg-slate-800 text-slate-300 hover:border-blue-400"
          }`}
        >
          {topic}
        </button>
      );
    })}
</div>


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
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Thêm chủ đề mới..."
              />
              <button
                type="button"
                onClick={handleAddTopic}
                className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-600"
              >
                Thêm
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Bạn có thể chọn nhiều chủ đề cho một bài viết.
            </p>
          </div>

          {/* Nội dung chi tiết + thanh editor */}
          <div>
            <label className="mb-1 block text-sm font-semibold">
              Nội dung chi tiết *
            </label>
            <RichTextEditor value={content} onChange={setContent} />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-900"
          >
            {loading ? "Đang tạo..." : "Đăng chủ đề"}
          </button>
        </form>

        {/* Popup thêm chủ đề thành công */}
        {showTopicSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-900/40 text-emerald-400">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Thêm chủ đề mới thành công
                </h2>
              </div>
              <p className="mb-6 text-sm text-slate-300">
                Chủ đề đã được thêm vào danh sách. Bạn có thể tiếp tục tạo bài
                viết.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTopicSuccess(false)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
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
