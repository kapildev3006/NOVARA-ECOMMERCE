"use client";

import { HomepageSectionRenderer } from "@/components/home/HomepageSectionRenderer";
import { useHomepage } from "@/hooks/useHomepage";

export default function StoreHomePage() {
  const { data: displaySections, isLoading } = useHomepage();

  return (
    <div className={`flex flex-col transition-opacity duration-500 ${isLoading ? "opacity-70" : "opacity-100"}`}>
      {/* 
        We rely on the hook to filter (enabled) and sort (order). 
        The hook initializes with default data instantly so the UI is never blank.
        When loading occurs (e.g. initial fetch), a subtle opacity transition shows activity.
      */}
      {displaySections.map((section) => (
        <HomepageSectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
