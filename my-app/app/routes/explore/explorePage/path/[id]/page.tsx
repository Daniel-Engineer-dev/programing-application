"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Code2, ArrowLeft } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  ref: string;
  desc: string;
  icon: string;
}
interface PathDetailData {
  id: string;
  title: string;
  desc: string;
  lessons: Lesson[];
}

const renderIcon = (icon: string) => {
  if (icon === "database") return <Database className="w-6 h-6" />;
  return <Code2 className="w-6 h-6" />;
};

export default function PathDetail() {
  const { id } = useParams<{ id: string }>();
  const [path, setPath] = useState<PathDetailData | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/routes/explore/api/explore/path/${id}`);

        if (!res.ok) {
          throw new Error(
            `Failed to fetch path details (Status: ${res.status})`
          );
        }

        const data: PathDetailData = await res.json();
        setPath(data);
      } catch (error) {
        console.error("Error loading path detail:", error);
        setPath(null);
      }
    };
    load();
  }, [id]);

  if (!path)
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center text-lg pt-20">
        Đang tải chi tiết lộ trình...
      </div>
    );

  const baseUrl = "/routes/explore/explorePage";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-10 max-w-4xl mx-auto">
      <Link
        href="/routes/explore"
        className="flex items-center text-slate-400 hover:text-blue-400 mb-8 transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Quay lại Khám phá
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-white">{path.title}</h1>
        <p className="text-slate-400 text-lg leading-relaxed">{path.desc}</p>
      </header>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 text-white border-b border-slate-800 pb-4">
          Nội dung lộ trình ({path.lessons.length} bài học)
        </h2>

        {path.lessons.length > 0 ? (
          <ul className="grid gap-4">
            {path.lessons.map((lesson, index) => (
              <li key={lesson.ref}>
                <Link
                  href={`${baseUrl}/topic/${lesson.ref}`}
                  className="group flex gap-5 bg-slate-800/50 p-5 rounded-2xl border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 transition-all shadow-sm"
                >
                  <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-600/10 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {renderIcon(lesson.icon)}
                  </div>

                  <div className="flex flex-col justify-center">
                    <h3 className="text-white font-bold group-hover:text-blue-400 transition-colors">
                      {index + 1}. {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                      {lesson.desc}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
            <p className="text-slate-500">
              Lộ trình này chưa có nội dung bài học.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
