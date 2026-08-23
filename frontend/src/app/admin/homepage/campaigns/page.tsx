"use client";

import { useState, useEffect, useCallback } from "react";
import { getHomepageCampaigns, createHomepageCampaign, cancelHomepageCampaign } from "@/lib/admin-homepage-api";
import { HomepageCampaign, CreateCampaignData } from "@/types/homepageCampaign";
import { AddCampaignModal } from "@/components/admin/homepage/AddCampaignModal";
import { AlertTriangle, Check, Loader2, CalendarClock, Plus, Eye, X, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/context/PermissionsContext";

export default function AdminHomepageCampaigns() {
  const [campaigns, setCampaigns] = useState<HomepageCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const { can, isLoading: isPermissionsLoading } = usePermissions();

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getHomepageCampaigns(1, 100);
      setCampaigns(data.items);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to load campaigns");
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isPermissionsLoading && can("homepage.campaigns.manage")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCampaigns();
    } else if (!isPermissionsLoading) {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, [fetchCampaigns, isPermissionsLoading, can]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleAdd = async (data: CreateCampaignData) => {
    try {
      setIsMutating(true);
      const created = await createHomepageCampaign(data);
      setCampaigns(prev => [created, ...prev]);
      showSuccess("Campaign created successfully.");
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message || "Failed to create campaign");
      throw error; // Rethrow to let modal handle it
    } finally {
      setIsMutating(false);
    }
  };

  const handleCancel = async (campaignKey: string) => {
    if (!window.confirm("Are you sure you want to cancel this campaign?")) return;
    
    setIsMutating(true);
    setErrorMessage(null);
    try {
      await cancelHomepageCampaign(campaignKey);
      showSuccess("Campaign cancelled successfully.");
      fetchCampaigns();
    } catch (err: unknown) {
      const error = err as Error;
      showError(error.message || "Failed to cancel campaign");
    } finally {
      setIsMutating(false);
    }
  };

  const getStatusBadge = (status: HomepageCampaign["status"]) => {
    switch (status) {
      case "draft":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Draft</span>;
      case "scheduled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">Scheduled</span>;
      case "executing":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Executing</span>;
      case "active":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Active</span>;
      case "completed":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Completed</span>;
      case "cancelled":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">Cancelled</span>;
    }
  };

  if (!isHydrated || isPermissionsLoading) return null;

  if (!can("homepage.campaigns.manage")) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <ShieldAlert className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-500 max-w-md">
          You do not have permission to manage homepage campaigns. Please contact a SuperAdmin if you need access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-4 relative pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <a href="/admin/homepage" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">← Back to Homepage Manager</a>
          </div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 mt-2 tracking-tight flex items-center gap-3">
            Homepage Campaigns
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Manage scheduled publication windows and fallback behaviors.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            disabled={isMutating}
            className="h-10 px-4 flex items-center justify-center gap-2 bg-[#161513] border border-[#161513] rounded-xl text-white font-bold hover:bg-gray-800 transition-all text-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className={`flex flex-col gap-4 ${isMutating ? "opacity-70 pointer-events-none" : "opacity-100"}`}>
          {campaigns.length === 0 ? (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <CalendarClock className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="font-bold text-gray-900 text-lg mb-1">No campaigns yet</h3>
              <p className="text-gray-500 max-w-sm mb-6">Create a campaign to automatically publish and unpublish homepage configurations.</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="h-10 px-6 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#e5e5e5] rounded-xl text-gray-700 font-bold hover:text-[#161513] hover:border-[#161513] hover:bg-gray-50 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Campaign
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-[#e5e5e5] bg-gray-50/50">
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-[25%]">Campaign</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Revision</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Starts At</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ends At</th>
                      <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {campaigns.map((camp) => (
                      <tr key={camp._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#161513] text-sm">{camp.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{camp.campaignKey}</div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(camp.status)}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            #{camp.revisionId}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-700">
                            {camp.startsAt ? new Date(camp.startsAt).toLocaleString() : "Immediate"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {camp.endsAt ? (
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-700">{new Date(camp.endsAt).toLocaleString()}</span>
                              {camp.fallbackRevisionId && (
                                <span className="text-xs text-gray-500 mt-0.5">Fallback: #{camp.fallbackRevisionId}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a 
                              href={`/admin/homepage/preview?revisionId=${camp.revisionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-[#161513] hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                              title="Preview Campaign Revision"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                            {(camp.status === "scheduled" || camp.status === "draft") && (
                              <button 
                                onClick={() => handleCancel(camp.campaignKey)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                                title="Cancel Campaign"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <AddCampaignModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
      />
    </div>
  );
}
