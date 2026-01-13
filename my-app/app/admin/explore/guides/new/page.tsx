"use client";

import GuideForm from "@/src/Component/Admin/Explore/GuideForm";

export default function NewGuidePage() {
  return (
    <div className="p-6 min-h-screen">
      <GuideForm isEditing={false} />
    </div>
  );
}
