"use client";
import React from "react";
import Link from "next/link";

export default function ExplorePage() {
  const topics = [
    {
      title: "Dynamic Programming",
      desc: "Learn DP with classic problems",
      href: "/explore/dp",
    },
    {
      title: "Graph Theory",
      desc: "Graph traversal, shortest paths, MST",
      href: "/explore/graph",
    },
    {
      title: "Sorting & Searching",
      desc: "Master the basics",
      href: "/explore/sorting",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Explore Algorithms
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {topics.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2">{t.title}</h2>
            <p className="text-gray-600 text-sm">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
