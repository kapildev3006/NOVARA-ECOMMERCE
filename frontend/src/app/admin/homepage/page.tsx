"use client";

import { useState, useEffect, useCallback } from "react";
import { HomepageSection } from "@/types/homepage";
import { 
  getAdminHomepage, 
  createHomepageSection, 
  updateHomepageSection, 
  toggleHomepageSection, 
  deleteHomepageSection, 
  reorderHomepageSections,
  publishAdminHomepage,
  scheduleHomepagePublish,
  cancelHomepageSchedule,
  getHomepageCampaigns,
  AdminHomepageAPIError,
  validateHomepageRevision,
  ValidationResult
} from "@/lib/admin-homepage-api";
import { HomepageCampaign } from "@/types/homepageCampaign";
import { getSocket } from "@/lib/socket";
import { AddHomepageSectionModal } from "@/components/admin/homepage/AddHomepageSectionModal";
import { HomepageSectionEditor } from "@/components/admin/homepage/HomepageSectionEditor";
import { CustomSectionEditor } from "@/components/admin/homepage/CustomSectionEditor";
import { HomepageSectionPreview } from "@/components/admin/homepage/HomepageSectionPreview";
import { Plus, GripVertical, AlertTriangle, Pencil, Eye, X, ShieldAlert, Check, Loader2, CalendarClock, CalendarX, FileWarning } from "lucide-react";
import { usePermissions } from "@/context/PermissionsContext";

export default function AdminHomepageManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [revisionId, setRevisionId] = useState<number | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [rollbackFromRevisionId, setRollbackFromRevisionId] = useState<number | null>(null);
  const [scheduledRevision, setScheduledRevision] = useState<{ revisionId: number, scheduledPublishAt: string, scheduledBy?: string } | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<HomepageCampaign | null>(null);
  const [scheduledCampaign, setScheduledCampaign] = useState<HomepageCampaign | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // QA State
  const [qaResult, setQaResult] = useState<ValidationResult | null>(null);
  const [isQaRunning, setIsQaRunning] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [previewSection, setPreviewSection] = useState<HomepageSection | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<HomepageSection | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  
  const { can } = usePermissions();
  
  // Track ongoing mutations to prevent double-clicks
  const [isMutating, setIsMutating] = useState(false);

  // Drag and Drop state
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fetchSections = useCallback(async () => {
    try {
      const data = await getAdminHomepage();
      setSections(data.sections.sort((a, b) => a.order - b.order));
      setRevisionId(data.revisionId);
      setPublishedAt(data.publishedAt || null);
      setRollbackFromRevisionId(data.rollbackFromRevisionId || null);
      setScheduledRevision(data.scheduledRevision || null);

      // Also fetch active and scheduled campaigns
      try {
        const [activeRes, scheduledRes] = await Promise.all([
          getHomepageCampaigns(1, 1, "active"),
          getHomepageCampaigns(1, 1, "scheduled")
        ]);
        setActiveCampaign(activeRes.items[0] || null);
        setScheduledCampaign(scheduledRes.items[0] || null);
      } catch (campErr) {
        console.error("Failed to load campaigns", campErr);
      }
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      setErrorMessage(error.message || "Failed to load homepage sections");
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, []);

  const runQA = useCallback(async (revId: number) => {
    setIsQaRunning(true);
    try {
      const res = await validateHomepageRevision(revId);
      setQaResult(res);
    } catch (err: unknown) {
      console.error("Failed to run QA", err);
    } finally {
      setIsQaRunning(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSections().then(() => {
      // We don't automatically run QA on mount to avoid unnecessary load,
      // but we could if desired.
    });

    // Socket real-time sync
    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleHomepageUpdate = () => {
      // If the admin is actively editing or adding, don't silently overwrite
      setSections(currentSections => {
        // We use a small hack here to check current state from inside the listener
        // But to be clean without ref refs, we'll just show a toast if they are editing
        return currentSections; 
      });
    };

    socket.on("homepage_updated", handleHomepageUpdate);

    return () => {
      socket.off("homepage_updated", handleHomepageUpdate);
    };
  }, [fetchSections]);

  // Handle socket update conflict check safely
  useEffect(() => {
    const socket = getSocket();
    const handleHomepageUpdate = () => {
      if (isAddModalOpen || editingSection) {
        setErrorMessage("Homepage was updated by another user. Refresh to see the latest changes.");
      } else {
        // Safe to refetch
        fetchSections();
      }
    };
    socket.on("homepage_updated", handleHomepageUpdate);
    return () => {
      socket.off("homepage_updated", handleHomepageUpdate);
    };
  }, [isAddModalOpen, editingSection, fetchSections]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handlePublishClick = async () => {
    if (!revisionId) return;
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const res = await validateHomepageRevision(revisionId);
      setQaResult(res);
      if (!res.valid) {
        setErrorMessage("Publishing is blocked. Errors must be resolved before this revision can go live.");
        setIsMutating(false);
        return;
      }
      
      if (!window.confirm(`Publish Revision #${revisionId}?\n\n✓ Content validation passed\n${res.warnings.length > 0 ? `⚠ ${res.warnings.length} warning(s)\n\n` : '\n'}This will replace the current live homepage for all customers. Are you sure?`)) {
        setIsMutating(false);
        return;
      }
      
      const publishRes = await publishAdminHomepage(revisionId);
      setRevisionId(publishRes.revisionId);
      setPublishedAt(new Date().toISOString());
      setQaResult(null);
      showSuccess("Homepage published successfully!");
      fetchSections();
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      showError(error.message || "Failed to publish homepage");
    } finally {
      setIsMutating(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionId || !scheduleDate || !scheduleTime) return;
    
    const dateTimeStr = `${scheduleDate}T${scheduleTime}:00`;
    const publishAt = new Date(dateTimeStr);
    
    if (isNaN(publishAt.getTime()) || publishAt.getTime() <= Date.now()) {
      showError("Please select a valid future date and time.");
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await scheduleHomepagePublish(revisionId, publishAt.toISOString());
      showSuccess(`Homepage scheduled for publication on ${publishAt.toLocaleString()}`);
      setIsScheduleModalOpen(false);
      setScheduleDate("");
      setScheduleTime("");
      fetchSections(); // Re-fetch to get new draft revisionId and schedule banner
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      showError(error.message || "Failed to schedule homepage");
    } finally {
      setIsMutating(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!window.confirm("Are you sure you want to cancel the scheduled publication?")) return;
    
    setIsMutating(true);
    setErrorMessage(null);
    try {
      await cancelHomepageSchedule();
      showSuccess("Scheduled publication cancelled successfully.");
      setScheduledRevision(null);
      fetchSections();
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      showError(error.message || "Failed to cancel schedule");
    } finally {
      setIsMutating(false);
    }
  };

  // --- Handlers ---

  const handleAdd = async (newSection: HomepageSection) => {
    try {
      setIsMutating(true);
      const created = await createHomepageSection({
        sectionKey: newSection.id, // using id as sectionKey for creation
        type: newSection.type,
        title: newSection.title,
        subtitle: newSection.subtitle,
        enabled: newSection.enabled,
        order: newSection.order,
        config: newSection.config,
      });
      setSections(prev => [...prev, created].sort((a, b) => a.order - b.order));
      setQaResult(null); // invalidate QA
      showSuccess("Section created successfully.");
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      showError(error.message || "Failed to create section");
    } finally {
      setIsMutating(false);
    }
  };

  const handleEdit = async (updatedSection: HomepageSection) => {
    if (!updatedSection._id) return;
    try {
      setIsMutating(true);
      // Find the original section we are editing to compute diff
      const original = sections.find(s => s._id === updatedSection._id);
      
      const payload: Partial<HomepageSection> = {};
      if (original?.title !== updatedSection.title) payload.title = updatedSection.title;
      if (original?.subtitle !== updatedSection.subtitle) payload.subtitle = updatedSection.subtitle;
      if (original?.enabled !== updatedSection.enabled) payload.enabled = updatedSection.enabled;
      if (JSON.stringify(original?.config) !== JSON.stringify(updatedSection.config)) payload.config = updatedSection.config;

      if (Object.keys(payload).length === 0) {
         setEditingSection(null);
         return; // No changes
      }

      const updated = await updateHomepageSection(updatedSection._id, payload);
      setSections(prev => prev.map(s => s._id === updated._id ? updated : s).sort((a, b) => a.order - b.order));
      setQaResult(null);
      showSuccess("Section updated successfully.");
      setEditingSection(null);
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      showError(error.message || "Failed to update section");
    } finally {
      setIsMutating(false);
    }
  };

  const handleRemoveClick = (section: HomepageSection) => {
    if (section.isProtected) return;
    setRemoveCandidate(section);
  };

  const confirmRemove = async () => {
    if (!removeCandidate || !removeCandidate._id) return;
    try {
      setIsMutating(true);
      await deleteHomepageSection(removeCandidate._id);
      setSections(prev => prev.filter(s => s._id !== removeCandidate._id));
      setQaResult(null);
      showSuccess("Section deleted successfully.");
      setRemoveCandidate(null);
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      if (err instanceof AdminHomepageAPIError && error.status === 409) {
        showError("This homepage section is protected and cannot be deleted.");
      } else {
        showError(error.message || "Failed to delete section");
      }
      setRemoveCandidate(null);
    } finally {
      setIsMutating(false);
    }
  };

  const handleToggleEnabled = async (id: string, _id?: string, currentStatus?: boolean) => {
    if (!_id) return;
    
    // Optimistic UI
    setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !currentStatus } : s));
    
    try {
      await toggleHomepageSection(_id, !currentStatus);
      setQaResult(null);
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      // Revert on failure
      setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !!currentStatus } : s));
      showError(error.message || "Failed to toggle section status");
    }
  };

  // --- Drag and Drop Handlers ---

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      e.currentTarget.classList.add("opacity-50");
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedIdx(null);
    setDragOverIdx(null);
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIdx === null || draggedIdx === index) return;
    setDragOverIdx(index);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const originalSections = [...sections];
    const newSections = [...sections];
    const draggedItem = newSections[draggedIdx];
    
    // Remove from old position and insert at new
    newSections.splice(draggedIdx, 1);
    newSections.splice(index, 0, draggedItem);
    
    // Recalculate orders locally
    const reordered = newSections.map((s, i) => ({ ...s, order: i }));
    
    // Optimistic UI update
    setSections(reordered);
    setDraggedIdx(null);
    setDragOverIdx(null);

    // Filter valid _id sections for the bulk reorder
    const validSections = reordered.filter(s => s._id) as (HomepageSection & { _id: string })[];

    try {
      setIsMutating(true);
      await reorderHomepageSections(validSections.map(s => ({ _id: s._id, order: s.order })));
      setQaResult(null);
    } catch (err: unknown) {
      const error = err as Error & { code?: string, status?: number };
      // Rollback on failure
      setSections(originalSections);
      showError(error.message || "Failed to save new order");
    } finally {
      setIsMutating(false);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col gap-6 pt-4 relative pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight flex items-center gap-3">
            Homepage Management
            {revisionId && (
              <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Draft Revision #{revisionId}
              </span>
            )}
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Control the sections displayed on your customer homepage.
            {publishedAt && <span className="ml-2 text-gray-400">Last published: {new Date(publishedAt).toLocaleString()}</span>}
            {rollbackFromRevisionId && <span className="ml-2 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-xs uppercase tracking-wider">Based on Revision #{rollbackFromRevisionId}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {can("homepage.revisions.view") && (
            <a
              href="/admin/homepage/revisions"
              className="h-10 px-4 flex items-center justify-center gap-2 bg-white border border-[#e5e5e5] rounded-xl text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all text-sm"
            >
              History
            </a>
          )}
          {can("homepage.preview") && (
            <a
              href="/admin/homepage/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 px-4 flex items-center justify-center gap-2 bg-white border border-[#e5e5e5] rounded-xl text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all text-sm"
            >
              <Eye className="w-4 h-4" />
              Preview
            </a>
          )}
          {can("homepage.schedule") && (
          <button
            onClick={async () => {
              if (!revisionId) return;
              setIsMutating(true);
              const res = await validateHomepageRevision(revisionId);
              setQaResult(res);
              setIsMutating(false);
              setIsScheduleModalOpen(true);
            }}
            disabled={isMutating || !revisionId || !!scheduledRevision || !!scheduledCampaign || !!activeCampaign}
            className="h-10 px-4 flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 font-bold hover:bg-indigo-100 transition-all text-sm disabled:opacity-50"
          >
            <CalendarClock className="w-4 h-4" />
            Schedule
          </button>
          )}
          {can("homepage.publish") && (
          <button
            onClick={handlePublishClick}
            disabled={isMutating || !revisionId || !!scheduledRevision || !!scheduledCampaign || !!activeCampaign}
            className="h-10 px-4 flex items-center justify-center gap-2 bg-[#161513] border border-[#161513] rounded-xl text-white font-bold hover:bg-gray-800 transition-all text-sm disabled:opacity-50"
          >
            {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            Publish
          </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4 text-green-600" />
          {successMessage}
        </div>
      )}

      {can("homepage.schedule") && scheduledRevision && !scheduledCampaign && !activeCampaign && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Scheduled Publication Active
            </h3>
            <p className="text-sm text-indigo-700 mt-1">
              Revision <strong className="font-bold">#{scheduledRevision.revisionId}</strong> is scheduled to go live on <strong className="font-bold">{new Date(scheduledRevision.scheduledPublishAt).toLocaleString()}</strong>.
              You are currently editing a new draft (Revision #{revisionId}).
            </p>
          </div>
          <button
            onClick={handleCancelSchedule}
            disabled={isMutating}
            className="shrink-0 h-10 px-4 flex items-center justify-center gap-2 bg-white border border-indigo-200 rounded-xl text-indigo-700 font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all text-sm disabled:opacity-50"
          >
            <CalendarX className="w-4 h-4" />
            Cancel Schedule
          </button>
        </div>
      )}

      {can("homepage.campaigns.manage") && scheduledCampaign && (
        <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h3 className="font-bold text-purple-900 flex items-center gap-2">
              <CalendarClock className="w-5 h-5" />
              Scheduled Campaign
            </h3>
            <p className="text-sm text-purple-700 mt-1">
              <strong className="font-bold">{scheduledCampaign.name}</strong> (Revision #{scheduledCampaign.revisionId})
              {scheduledCampaign.startsAt && ` starts ${new Date(scheduledCampaign.startsAt).toLocaleString()}`}
            </p>
          </div>
          <a
            href="/admin/homepage/campaigns"
            className="shrink-0 h-10 px-4 flex items-center justify-center gap-2 bg-white border border-purple-200 rounded-xl text-purple-700 font-bold hover:bg-purple-50 transition-all text-sm"
          >
            Manage Campaigns
          </a>
        </div>
      )}

      {can("homepage.campaigns.manage") && activeCampaign && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div>
            <h3 className="font-bold text-blue-900 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Active Campaign
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong className="font-bold">{activeCampaign.name}</strong> (Revision #{activeCampaign.revisionId})
              {activeCampaign.endsAt && ` ends ${new Date(activeCampaign.endsAt).toLocaleString()}`}
            </p>
          </div>
          <a
            href="/admin/homepage/campaigns"
            className="shrink-0 h-10 px-4 flex items-center justify-center gap-2 bg-white border border-blue-200 rounded-xl text-blue-700 font-bold hover:bg-blue-50 transition-all text-sm"
          >
            Manage Campaigns
          </a>
        </div>
      )}

      {/* QA Panel */}
      {revisionId && (
        <div className={`p-4 rounded-2xl border flex flex-col gap-3 animate-in fade-in ${qaResult ? (qaResult.valid ? (qaResult.warnings.length > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200") : "bg-red-50 border-red-200") : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldAlert className={`w-5 h-5 ${qaResult ? (qaResult.valid ? (qaResult.warnings.length > 0 ? "text-amber-600" : "text-green-600") : "text-red-600") : "text-gray-500"}`} />
              Content QA
            </h3>
            <button
              onClick={() => runQA(revisionId)}
              disabled={isQaRunning || isMutating}
              className="h-8 px-3 flex items-center gap-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50"
            >
              {isQaRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run QA"}
            </button>
          </div>
          
          {qaResult ? (
            <div className="flex flex-col gap-2 mt-2">
              {qaResult.valid && qaResult.warnings.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                  <Check className="w-4 h-4" /> All sections and references are valid.
                </div>
              )}
              {qaResult.errors.map((err, i) => (
                <div key={`err-${i}`} className="flex items-start gap-2 text-sm text-red-700 bg-red-100/50 p-2 rounded-lg">
                  <X className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">{err.code}</strong> {err.sectionKey ? `in ${err.sectionKey}` : ''}: {err.message}
                  </div>
                </div>
              ))}
              {qaResult.warnings.map((warn, i) => (
                <div key={`warn-${i}`} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-100/50 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">{warn.code}</strong> {warn.sectionKey ? `in ${warn.sectionKey}` : ''}: {warn.message}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Run QA to validate references and content rules.</p>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className={`flex flex-col gap-4 max-w-4xl ${isMutating ? "opacity-70 pointer-events-none" : "opacity-100"}`}>
          <div className="flex items-center gap-3">
            {can("homepage.edit") && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 h-14 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#e5e5e5] rounded-2xl text-gray-500 font-bold hover:text-[#161513] hover:border-[#161513] hover:bg-gray-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                <Plus className="w-5 h-5" />
                Add Section
              </button>
            )}
            {can("homepage.audit.view") && (
              <a
                href="/admin/homepage/audit"
                className="h-14 px-6 flex items-center justify-center bg-white border border-[#e5e5e5] rounded-2xl text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                Audit Trail
              </a>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {sections.map((section, idx) => {
              const isDragOver = dragOverIdx === idx;
              const isDragged = draggedIdx === idx;

              return (
                <div 
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isDragOver 
                      ? draggedIdx !== null && draggedIdx < idx 
                        ? "border-b-4 border-b-[#ff4b2b]" 
                        : "border-t-4 border-t-[#ff4b2b]"
                      : "border-[#e5e5e5]"
                  } ${isDragged ? "opacity-50 scale-[0.98]" : "hover:shadow-md hover:border-gray-300"}`}
                >
                  {/* Left Side */}
                  <div className="flex items-center gap-4">
                    <div className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-[#161513] transition-colors">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#161513] text-lg leading-tight">
                          {section.title || section.type.replace("-", " ")}
                        </span>
                        {!section.enabled && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {section.type}
                        </span>
                        {section.type === "product-carousel" && section.config && (
                          <span className="text-xs font-bold text-gray-400">
                            • Source: {
                              (section.config as Record<string, unknown>).source === "manual" 
                                ? `Manual (${((section.config as Record<string, unknown>).productIds as string[] | undefined)?.length || 0} selected)` 
                                : ((section.config as Record<string, unknown>).source as string | undefined) || ((section.config as Record<string, unknown>).collection as string | undefined) || "deals"
                            }
                          </span>
                        )}
                        {section.type === "custom" && section.config && (
                          <span className="text-xs font-bold text-gray-400">
                            • Layout: {(section.config as Record<string, unknown>).layout as string | undefined}
                          </span>
                        )}
                        {section.type === "custom" && section.config && ((section.config as Record<string, unknown>).productIds as string[] | undefined)?.length ? (
                          <span className="text-xs font-bold text-gray-400">
                            • Products: {((section.config as Record<string, unknown>).productIds as string[]).length} selected
                          </span>
                        ) : null}
                        {section.isProtected && (
                          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                            <ShieldAlert className="w-3 h-3" />
                            Required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Toggle */}
                    <div className="flex items-center gap-2 mr-2">
                      <span className={`text-xs font-bold ${section.enabled ? "text-green-600" : "text-gray-400"}`}>
                        {section.enabled ? "ON" : "OFF"}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={section.enabled}
                          onChange={() => handleToggleEnabled(section.id, section._id, section.enabled)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>

                    {/* Actions */}
                    <button 
                      onClick={() => setEditingSection(section)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Edit Section"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => setPreviewSection(section)}
                      className="p-2 text-gray-400 hover:text-[#161513] hover:bg-gray-100 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                      title="Preview Section"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleRemoveClick(section)}
                      disabled={section.isProtected}
                      className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                        section.isProtected 
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title={section.isProtected ? "Required section cannot be removed" : "Remove Section"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AddHomepageSectionModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAdd}
        currentSections={sections}
      />

      {editingSection?.type === "custom" ? (
        <CustomSectionEditor
          isOpen={!!editingSection}
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleEdit}
        />
      ) : (
        <HomepageSectionEditor
          isOpen={!!editingSection}
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSave={handleEdit}
        />
      )}

      <HomepageSectionPreview
        isOpen={!!previewSection}
        section={previewSection}
        onClose={() => setPreviewSection(null)}
      />

      {/* Remove Confirmation */}
      {removeCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full relative my-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">Remove Section?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This section will be removed from the customer homepage configuration.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setRemoveCandidate(null)}
                disabled={isMutating}
                className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                disabled={isMutating}
                className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                {isMutating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Remove Section"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-md w-full relative my-8">
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-2 flex items-center gap-2">
              <CalendarClock className="w-6 h-6 text-indigo-600" />
              Schedule Publication
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Select the future date and time when this draft should be automatically published to the live customer homepage. Times are in your local timezone.
            </p>
            
            {qaResult && (
              <div className={`mb-6 p-4 rounded-xl border ${qaResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {qaResult.valid ? (
                  <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                    <Check className="w-4 h-4" /> Content validation passed
                    {qaResult.warnings.length > 0 && <span className="text-amber-600 font-normal ml-2">⚠ {qaResult.warnings.length} warning(s)</span>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                      <X className="w-4 h-4" /> Publishing is blocked.
                    </div>
                    <p className="text-xs text-red-600">{qaResult.errors.length} errors must be resolved before this revision can go live.</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  disabled={isMutating}
                  className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(isMutating || !scheduleDate || !scheduleTime || (qaResult && !qaResult.valid))}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
                >
                  {isMutating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
