"use client";

import { useState } from "react";

export default function ExploreAdminPage() {
  const [topic, setTopic] = useState({
    title: "",
    desc: "",
    icon: "database",
    level: "beginner",
    type: "Bài viết",
    order: 1,
  });

  const [guide, setGuide] = useState({
    title: "",
    author: "",
    level: "beginner",
    type: "Bài viết",
    summary: "",
  });

  const [message, setMessage] = useState("");

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/explore/admin/topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(topic),
    });
    if (res.ok) setMessage("Đã thêm Topic!");
    else setMessage("Lỗi khi thêm Topic");
  }

  async function addGuide(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/explore/admin/guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guide),
    });
    if (res.ok) setMessage("Đã thêm Guide!");
    else setMessage("Lỗi khi thêm Guide");
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">
        <h1 className="text-2xl font-bold mb-4">Explore Admin</h1>

        {message && (
          <p className="text-sm text-emerald-400 border border-emerald-700 rounded-md px-3 py-2">
            {message}
          </p>
        )}

        {/* Form Topic */}
        <section className="border border-slate-700 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Thêm Topic</h2>
          <form onSubmit={addTopic} className="space-y-3 text-sm">
            <input
              className="w-full rounded bg-slate-800 px-3 py-2 outline-none"
              placeholder="Tiêu đề"
              value={topic.title}
              onChange={(e) => setTopic({ ...topic, title: e.target.value })}
            />
            <textarea
              className="w-full rounded bg-slate-800 px-3 py-2 outline-none"
              placeholder="Mô tả"
              value={topic.desc}
              onChange={(e) => setTopic({ ...topic, desc: e.target.value })}
            />
            <div className="flex gap-3">
              <select
                className="rounded bg-slate-800 px-3 py-2 outline-none"
                value={topic.icon}
                onChange={(e) => setTopic({ ...topic, icon: e.target.value })}
              >
                <option value="database">Database</option>
                <option value="code">Code</option>
                <option value="terminal">Terminal</option>
              </select>
              <select
                className="rounded bg-slate-800 px-3 py-2 outline-none"
                value={topic.level}
                onChange={(e) => setTopic({ ...topic, level: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                type="number"
                className="w-20 rounded bg-slate-800 px-3 py-2 outline-none"
                value={topic.order}
                onChange={(e) =>
                  setTopic({ ...topic, order: Number(e.target.value) })
                }
                placeholder="Order"
              />
            </div>
            <button
              type="submit"
              className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500"
            >
              Thêm Topic
            </button>
          </form>
        </section>

        {/* Form Guide */}
        <section className="border border-slate-700 rounded-xl p-4">
          <h2 className="font-semibold mb-3">Thêm Guide</h2>
          <form onSubmit={addGuide} className="space-y-3 text-sm">
            <input
              className="w-full rounded bg-slate-800 px-3 py-2 outline-none"
              placeholder="Tiêu đề"
              value={guide.title}
              onChange={(e) => setGuide({ ...guide, title: e.target.value })}
            />
            <input
              className="w-full rounded bg-slate-800 px-3 py-2 outline-none"
              placeholder="Tác giả"
              value={guide.author}
              onChange={(e) => setGuide({ ...guide, author: e.target.value })}
            />
            <textarea
              className="w-full rounded bg-slate-800 px-3 py-2 outline-none"
              placeholder="Tóm tắt"
              value={guide.summary}
              onChange={(e) => setGuide({ ...guide, summary: e.target.value })}
            />
            <div className="flex gap-3">
              <select
                className="rounded bg-slate-800 px-3 py-2 outline-none"
                value={guide.level}
                onChange={(e) => setGuide({ ...guide, level: e.target.value })}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <select
                className="rounded bg-slate-800 px-3 py-2 outline-none"
                value={guide.type}
                onChange={(e) => setGuide({ ...guide, type: e.target.value })}
              >
                <option value="Bài viết">Bài viết</option>
                <option value="Video">Video</option>
              </select>
            </div>
            <button
              type="submit"
              className="rounded bg-purple-600 px-4 py-2 text-xs font-semibold hover:bg-purple-500"
            >
              Thêm Guide
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
