"use client";
import React, { useState } from "react";

export default function DiscussPage() {
  const [posts, setPosts] = useState([
    { id: 1, title: "How to solve DP problems faster?", author: "Alice" },
    { id: 2, title: "Best resources for Graph Theory", author: "Bob" },
  ]);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Community Discussions
      </h1>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition"
          >
            <h2 className="font-semibold text-lg">{post.title}</h2>
            <p className="text-gray-500 text-sm mt-1">
              Posted by {post.author}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
