"use client";

import { useEffect, useState } from "react";
import { fetchHomepageAuditLogs, HomepageAuditLog, PaginatedAuditLogs } from "../../../../lib/admin-homepage-audit-api";
import { getSocket } from "../../../../lib/socket";
import Link from "next/link";
import { usePermissions } from "@/context/PermissionsContext";
import { ShieldAlert } from "lucide-react";

export default function AdminHomepageAuditPage() {
  const [data, setData] = useState<PaginatedAuditLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const { can, isLoading: isPermissionsLoading } = usePermissions();
  const limit = 20;

  const loadLogs = async (p: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchHomepageAuditLogs(p, limit);
      setData(res);
      setHasNewActivity(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to load audit logs");
      } else {
        setError("Failed to load audit logs");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPermissionsLoading && can("homepage.audit.view")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadLogs(page);
    }
  }, [page, isPermissionsLoading, can]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleUpdate = () => {
      setHasNewActivity(true);
    };

    socket.on("homepage_updated", handleUpdate);
    return () => {
      socket.off("homepage_updated", handleUpdate);
    };
  }, []);


  const renderChanges = (log: HomepageAuditLog) => {
    if (log.action === "DELETE") {
      return (
        <span className="text-gray-500 italic text-sm">
          Deleted {(log.metadata?.deletedTitle as string) || (log.metadata?.deletedType as string) || "section"}
        </span>
      );
    }
    
    if (log.action === "REORDER") {
      return (
        <span className="text-gray-500 italic text-sm">
          Reordered {(log.metadata?.items as unknown[])?.length || 0} items
        </span>
      );
    }

    if (!log.changes || Object.keys(log.changes).length === 0) {
      return <span className="text-gray-500 italic text-sm">No details</span>;
    }

    return (
      <div className="text-sm space-y-1">
        {Object.entries(log.changes).map(([key, value]: [string, unknown]) => {
          if (key === "config" && value && typeof value === 'object' && 'changed' in (value as Record<string, unknown>)) {
            return <div key={key}><span className="font-semibold text-gray-700">{key}:</span> Configuration changed</div>;
          }
          if (value && typeof value === 'object' && 'from' in value && 'to' in value) {
             const v = value as { from: unknown, to: unknown };
             return (
               <div key={key}>
                 <span className="font-semibold text-gray-700">{key}:</span>{" "}
                 <span className="line-through text-red-500 mr-1">{String(v.from)}</span>
                 <span>&rarr;</span>
                 <span className="text-green-600 ml-1">{String(v.to)}</span>
               </div>
             );
          }
          return <div key={key}><span className="font-semibold text-gray-700">{key}:</span> {JSON.stringify(value)}</div>;
        })}
      </div>
    );
  };

  if (isPermissionsLoading) return null;

  if (!can("homepage.audit.view")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md">
          You do not have permission to view the audit trail. Please contact a SuperAdmin if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">Operational history of homepage mutations (90-day retention)</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/admin/homepage" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            &larr; Back to CMS
          </Link>
        </div>
      </div>

      {hasNewActivity && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium">New activity available!</span>
          <button 
            onClick={() => loadLogs(page)}
            className="text-sm font-semibold hover:underline"
          >
            Refresh
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Date/Time</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Section Key</th>
                <th className="px-6 py-4 font-semibold">Actor</th>
                <th className="px-6 py-4 font-semibold w-1/3">Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && !data ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center items-center space-x-2">
                       <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                       <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                data?.items.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Intl.DateTimeFormat("en-US", { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(log.createdAt))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
                        ${log.action === "CREATE" ? "bg-green-100 text-green-800" :
                          log.action === "UPDATE" ? "bg-blue-100 text-blue-800" :
                          log.action === "DELETE" ? "bg-red-100 text-red-800" :
                          log.action === "REORDER" ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        }
                      `}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {log.sectionKey || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.actorRole}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {renderChanges(log)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {data.pagination.pages}
          </span>
          <button
            disabled={page >= data.pagination.pages}
            onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
