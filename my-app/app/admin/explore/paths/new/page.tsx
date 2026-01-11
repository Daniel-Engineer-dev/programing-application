"use client";

import PathForm from "@/src/Component/Admin/Explore/PathForm";

export default function NewPathPage() {
  return (
    <div className="p-6 min-h-screen">
      <PathForm isEditing={false} />
    </div>
  );
}
