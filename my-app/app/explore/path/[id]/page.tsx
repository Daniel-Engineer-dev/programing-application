"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Database, Code2, ArrowLeft, Clock } from "lucide-react";

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
  progress: number;
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
        // LƯU Ý: Đảm bảo route API server là /path/ hoặc /paths/ khớp với client
        const res = await fetch(`/api/explore/path/${id}`);

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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-6 md:p-10 max-w-4xl mx-auto">
      <Link
        href="/routes/explore"
        className="flex items-center text-slate-400 hover:text-blue-400 mb-8 transition"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Quay lại Khám phá
      </Link>

      <h1 className="text-4xl font-bold mb-2 text-white">{path.title}</h1>
      <p className="text-slate-400 text-lg mb-8">{path.desc}</p>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-10">
        <h2 className="text-xl font-semibold mb-3 text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-400" />
          Tiến độ
        </h2>
        <div className="mt-4">
          <div className="h-3 bg-slate-700 rounded-full">
            <div
              className="h-3 bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${path.progress || 0}%` }}
            />
          </div>
          <p className="text-sm mt-2 text-slate-400">
            Bạn đã hoàn thành **{path.progress || 0}%** lộ trình này.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-6 text-white">
          Nội dung lộ trình ({path.lessons.length} chủ đề)
        </h2>

        {path.lessons.length > 0 ? (
          <ul className="space-y-4">
            {path.lessons.map((lesson, index) => (
              <li
                key={lesson.ref}
                className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:bg-slate-700 transition shadow-md"
              >
                <Link
                  href={`/explore/topic/${lesson.ref}`} // SỬ DỤNG lesson.ref (ID thực)
                  className="flex gap-4 items-center"
                >
                  <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg bg-blue-600/10 text-blue-500">
                    {renderIcon(lesson.icon)}
                  </div>

                  <div>
                    <h3 className="text-white font-semibold">
                      {index + 1}. {lesson.title}
                    </h3>
                    <p className="text-sm text-slate-400">{lesson.desc}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Lộ trình này chưa có bài học nào.</p>
        )}
      </div>
    </div>
  );
}
