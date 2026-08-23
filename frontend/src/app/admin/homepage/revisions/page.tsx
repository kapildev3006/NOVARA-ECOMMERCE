"use client";

import { useState, useEffect, useCallback } from "react";
import { HomepageRevisionMeta, getHomepageRevisions, rollbackHomepageRevision, getAdminHomepage } from "@/lib/admin-homepage-api";
import { AlertTriangle, ArrowLeft, Loader2, Eye, RotateCcw, Clock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/context/PermissionsContext";

export default function RevisionHistoryPage() {
  const router = useRouter();
  const [revisions, setRevisions] = useState<HomepageRevisionMeta[]>([]);
  const [currentDraftRevisionId, setCurrentDraftRevisionId] = useState<number | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [rollbackCandidate, setRollbackCandidate] = useState<HomepageRevisionMeta | null>(null);
  const { can, isLoading: isPermissionsLoading } = usePermissions();

  const fetchRevisions = useCallback(async (p: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // We also need the current draft ID for stale protection
      const adminData = await getAdminHomepage();
      setCurrentDraftRevisionId(adminData.revisionId);

      const res = await getHomepageRevisions(p, 10);
      setRevisions(res.items);
      setTotalPages(res.pagination.pages);
      setPage(res.pagination.page);
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      setError(error.message || "Failed to load revision history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isPermissionsLoading && can("homepage.revisions.view")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRevisions(page);
    } else if (!isPermissionsLoading) {
      setIsLoading(false);
    }
  }, [page, fetchRevisions, isPermissionsLoading, can]);

  const confirmRollback = async () => {
    if (!rollbackCandidate || currentDraftRevisionId === null) return;
    setIsMutating(true);
    setError(null);
    try {
      await rollbackHomepageRevision(rollbackCandidate.revisionId, currentDraftRevisionId);
      router.push("/admin/homepage");
    } catch (err: unknown) {
      const error = err as Error & { status?: number };
      if (error.status === 409) {
        setError("The current draft changed. Refresh before creating a rollback draft.");
      } else {
        setError(error.message || "Failed to rollback to revision");
      }
      setRollbackCandidate(null);
    } finally {
      setIsMutating(false);
    }
  };

  if (isPermissionsLoading) return null;

  if (!can("homepage.revisions.view")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md">
          You do not have permission to view revision history. Please contact a SuperAdmin if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4 pb-20 max-w-5xl">
      <div className="flex items-center gap-4 mb-2">
        <a href="/admin/homepage" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </a>
        <div>
          <h1 className="font-heading font-bold text-2xl md:text-3xl text-[#161513] tracking-tight">
            Revision History
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            View past published versions of the homepage and restore them to draft.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-[#e5e5e5] text-gray-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">Revision</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Published At</th>
                  <th className="px-6 py-4">Published By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {revisions.map(rev => (
                  <tr key={rev.revisionId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#161513]">
                      #{rev.revisionId}
                      {rev.rollbackFromRevisionId && (
                        <span className="ml-2 text-xs font-semibold text-gray-400 font-normal">
                          (Rollback from #{rev.rollbackFromRevisionId})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {rev.status === "published" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Published
                        </span>
                      ) : rev.status === "draft" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Draft
                        </span>
                      ) : rev.status === "scheduled" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Scheduled
                        </span>
                      ) : rev.status === "cancelled" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Executing
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {rev.publishedAt ? new Date(rev.publishedAt).toLocaleString() : rev.scheduledPublishAt ? <span className="text-indigo-600 font-medium">Scheduled for: {new Date(rev.scheduledPublishAt).toLocaleString()}</span> : "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {rev.publishedBy && typeof rev.publishedBy === "object" ? (rev.publishedBy as Record<string, unknown>).fullName as string || "Admin" : "Admin"}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {can("homepage.preview") && (
                        <a
                          href={`/admin/homepage/preview?revisionId=${rev.revisionId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-1 text-xs font-bold"
                        >
                          <Eye className="w-4 h-4" /> Preview
                        </a>
                      )}
                      {can("homepage.rollback") && (
                        <button
                          onClick={() => setRollbackCandidate(rev)}
                          disabled={isMutating}
                          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 flex items-center gap-1 text-xs font-bold"
                        >
                          <RotateCcw className="w-4 h-4" /> Rollback
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {revisions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No historical revisions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e5e5] bg-gray-50/50">
              <span className="text-sm font-medium text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1 || isMutating}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages || isMutating}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 bg-white border border-[#e5e5e5] rounded-lg text-sm font-bold text-gray-700 disabled:opacity-50 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rollback Confirmation Modal */}
      {rollbackCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full relative my-8 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">
              Restore Revision #{rollbackCandidate.revisionId}?
            </h3>
            <p className="text-gray-500 text-sm mb-2">
              This will replace the current draft with a copy of Revision #{rollbackCandidate.revisionId}.
            </p>
            <p className="text-gray-500 text-sm mb-6 font-semibold">
              It will NOT change the live homepage immediately. You can preview and publish the new draft afterward.
            </p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setRollbackCandidate(null)}
                disabled={isMutating}
                className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmRollback}
                disabled={isMutating}
                className="flex-1 bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
              >
                {isMutating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
