"use client";

import TopicForm from "@/src/Component/Admin/Explore/TopicForm";

export default function NewTopicPage() {
  return (
    <div className="p-6 min-h-screen">
      <TopicForm isEditing={false} />
    </div>
  );
}
