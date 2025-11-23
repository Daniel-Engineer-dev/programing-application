"use client";
import React from "react";

export default function ContestsPage() {
  const contests = [
    {
      name: "CodePro Monthly Contest #1",
      date: "Nov 10, 2025",
      status: "Upcoming",
    },
    {
      name: "CodePro Weekly Challenge",
      date: "Nov 2, 2025",
      status: "Finished",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Contests</h1>

      <div className="space-y-4">
        {contests.map((c) => (
          <div
            key={c.name}
            className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
          >
            <div>
              <h2 className="font-semibold text-lg">{c.name}</h2>
              <p className="text-gray-500 text-sm">📅 {c.date}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                c.status === "Upcoming"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
