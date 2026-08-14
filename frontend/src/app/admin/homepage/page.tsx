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
  AdminHomepageAPIError
} from "@/lib/admin-homepage-api";
import { getSocket } from "@/lib/socket";
import { AddHomepageSectionModal } from "@/components/admin/homepage/AddHomepageSectionModal";
import { HomepageSectionEditor } from "@/components/admin/homepage/HomepageSectionEditor";
import { CustomSectionEditor } from "@/components/admin/homepage/CustomSectionEditor";
import { HomepageSectionPreview } from "@/components/admin/homepage/HomepageSectionPreview";
import { Plus, GripVertical, AlertTriangle, Pencil, Eye, X, ShieldAlert, Check, Loader2 } from "lucide-react";

export default function AdminHomepageManager() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [revisionId, setRevisionId] = useState<number | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [previewSection, setPreviewSection] = useState<HomepageSection | null>(null);
  const [removeCandidate, setRemoveCandidate] = useState<HomepageSection | null>(null);
  
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
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load homepage sections");
    } finally {
      setIsLoading(false);
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSections();

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

  const handlePublish = async () => {
    if (!revisionId) return;
    if (!window.confirm("Publish Homepage?\n\nThis will replace the current live homepage for all customers. Are you sure?")) {
      return;
    }
    
    setIsMutating(true);
    setErrorMessage(null);
    try {
      const res = await publishAdminHomepage(revisionId);
      setRevisionId(res.revisionId);
      setPublishedAt(new Date().toISOString());
      showSuccess("Homepage published successfully!");
      // Re-fetch to ensure sync
      fetchSections();
    } catch (err: any) {
      showError(err.message || "Failed to publish homepage");
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
      showSuccess("Section created successfully.");
      setIsAddModalOpen(false);
    } catch (err: any) {
      showError(err.message || "Failed to create section");
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
      showSuccess("Section updated successfully.");
      setEditingSection(null);
    } catch (err: any) {
      showError(err.message || "Failed to update section");
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
      showSuccess("Section deleted successfully.");
      setRemoveCandidate(null);
    } catch (err: any) {
      if (err instanceof AdminHomepageAPIError && err.status === 409) {
        showError("This homepage section is protected and cannot be deleted.");
      } else {
        showError(err.message || "Failed to delete section");
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
    } catch (err: any) {
      // Revert on failure
      setSections(prev => prev.map(s => s.id === id ? { ...s, enabled: !!currentStatus } : s));
      showError(err.message || "Failed to toggle section status");
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
    } catch (err: any) {
      // Rollback on failure
      setSections(originalSections);
      showError(err.message || "Failed to save new order");
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
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/homepage/preview"
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 px-4 flex items-center justify-center gap-2 bg-white border border-[#e5e5e5] rounded-xl text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all text-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </a>
          <button
            onClick={handlePublish}
            disabled={isMutating || !revisionId}
            className="h-10 px-4 flex items-center justify-center gap-2 bg-[#161513] border border-[#161513] rounded-xl text-white font-bold hover:bg-gray-800 transition-all text-sm disabled:opacity-50"
          >
            {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            Publish
          </button>
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className={`flex flex-col gap-4 max-w-4xl ${isMutating ? "opacity-70 pointer-events-none" : "opacity-100"}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 h-14 flex items-center justify-center gap-2 bg-white border-2 border-dashed border-[#e5e5e5] rounded-2xl text-gray-500 font-bold hover:text-[#161513] hover:border-[#161513] hover:bg-gray-50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <Plus className="w-5 h-5" />
              Add Section
            </button>
            <a
              href="/admin/homepage/audit"
              className="h-14 px-6 flex items-center justify-center bg-white border border-[#e5e5e5] rounded-2xl text-gray-700 font-bold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Audit Trail
            </a>
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
    </div>
  );
}
