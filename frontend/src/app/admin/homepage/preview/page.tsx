"use client";

import { useEffect, useState } from "react";
import { HomepageSectionRenderer } from "@/components/home/HomepageSectionRenderer";
import { HomepageSection } from "@/types/homepage";
import { API_BASE_URL } from "@/lib/api-config";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Suspense } from "react";

function PreviewContent() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const revisionId = searchParams.get("revisionId");

  useEffect(() => {
    async function fetchPreview() {
      try {
        const endpoint = revisionId 
          ? `/admin/homepage/revisions/${revisionId}/preview`
          : `/admin/homepage/preview`;
          
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          credentials: "include",
        });
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.error?.message || "Failed to load preview");
        }

        if (json.success && Array.isArray(json.data)) {
          setSections(json.data.map((backendSection: Record<string, unknown>) => ({
            _id: backendSection._id,
            id: backendSection.sectionKey,
            type: backendSection.type,
            title: backendSection.title,
            subtitle: backendSection.subtitle,
            enabled: backendSection.enabled,
            order: backendSection.order,
            isProtected: backendSection.isProtected,
            config: backendSection.config,
          })));
        }
      } catch (err: unknown) {
        const error = err as Record<string, unknown>;
        setError((error.message as string) || "Failed to fetch preview");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreview();
  }, [revisionId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading preview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-2xl max-w-md text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Preview Failed</h2>
          <p className="text-sm opacity-90">{error}</p>
          <a href="/admin/homepage" className="mt-6 inline-flex items-center gap-2 text-red-700 font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Return to CMS
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-12">
      {/* Top Warning Banner */}
      <div className="sticky top-0 z-50 bg-[#161513] text-white py-3 px-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>
          <p className="font-bold text-sm">
            {revisionId ? `HISTORICAL REVISION PREVIEW (Revision #${revisionId})` : "DRAFT PREVIEW"}
          </p>
        </div>
        <p className="text-sm text-gray-400 hidden sm:block">
          {revisionId ? "This is a past version of the homepage." : "This layout is a draft and is not visible to customers."}
        </p>
        <a 
          href="/admin/homepage" 
          className="text-sm font-bold text-gray-300 hover:text-white transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Preview
        </a>
      </div>

      <div className="flex flex-col mt-4">
        {sections.map((section) => (
          <HomepageSectionRenderer key={section.id} section={section} />
        ))}
        {sections.length === 0 && (
          <div className="py-24 text-center">
            <h2 className="text-xl font-bold text-gray-400">No enabled sections in draft.</h2>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminHomepagePreview() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium">Loading preview...</p>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
