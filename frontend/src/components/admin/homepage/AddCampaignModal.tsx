import { useState, useEffect } from "react";
import { X, Loader2, AlertTriangle, CalendarClock } from "lucide-react";
import { CreateCampaignData } from "@/types/homepageCampaign";
import { getHomepageRevisions, HomepageRevisionMeta } from "@/lib/admin-homepage-api";

interface AddCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: CreateCampaignData) => Promise<void>;
}

export function AddCampaignModal({ isOpen, onClose, onAdd }: AddCampaignModalProps) {
  const [campaignKey, setCampaignKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [revisionId, setRevisionId] = useState<number | "">("");
  const [startsAtDate, setStartsAtDate] = useState("");
  const [startsAtTime, setStartsAtTime] = useState("");
  const [endsAtDate, setEndsAtDate] = useState("");
  const [endsAtTime, setEndsAtTime] = useState("");
  const [fallbackRevisionId, setFallbackRevisionId] = useState<number | "">("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableRevisions, setAvailableRevisions] = useState<HomepageRevisionMeta[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCampaignKey("");
      setName("");
      setDescription("");
      setRevisionId("");
      setStartsAtDate("");
      setStartsAtTime("");
      setEndsAtDate("");
      setEndsAtTime("");
      setFallbackRevisionId("");
      setError(null);
      setIsSubmitting(false);

      // Fetch immutable revisions
      setIsLoadingRevisions(true);
      getHomepageRevisions(1, 100)
        .then(res => setAvailableRevisions(res.items))
        .catch(err => console.error(err))
        .finally(() => setIsLoadingRevisions(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !campaignKey.trim() || revisionId === "") {
      setError("Please fill all required fields.");
      return;
    }

    if (!/^[a-zA-Z0-9-]+$/.test(campaignKey)) {
      setError("Campaign Key must be alphanumeric with hyphens only.");
      return;
    }

    let startsAt: string | undefined = undefined;
    if (startsAtDate && startsAtTime) {
      const startObj = new Date(`${startsAtDate}T${startsAtTime}:00`);
      if (isNaN(startObj.getTime()) || startObj.getTime() <= Date.now()) {
        setError("Start time must be in the future.");
        return;
      }
      startsAt = startObj.toISOString();
    }

    let endsAt: string | undefined = undefined;
    if (endsAtDate && endsAtTime) {
      const endObj = new Date(`${endsAtDate}T${endsAtTime}:00`);
      if (isNaN(endObj.getTime())) {
        setError("Invalid end time.");
        return;
      }
      endsAt = endObj.toISOString();
      
      if (startsAt) {
        if (endObj.getTime() <= new Date(startsAt).getTime()) {
          setError("End time must be after start time.");
          return;
        }
      } else {
        if (endObj.getTime() <= Date.now()) {
          setError("End time must be in the future.");
          return;
        }
      }
    }

    if (endsAt && fallbackRevisionId === "") {
      setError("A Fallback Revision is required when an End Time is set.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd({
        campaignKey,
        name,
        description: description || undefined,
        revisionId: Number(revisionId),
        startsAt,
        endsAt,
        fallbackRevisionId: fallbackRevisionId !== "" ? Number(fallbackRevisionId) : undefined
      });
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to create campaign");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => !isSubmitting && onClose()}
      />

      {/* Modal */}
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e5e5e5] flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">Create Campaign</h2>
            <p className="text-gray-500 text-sm mt-1">Schedule a new homepage publication</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="add-campaign-form" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Summer Sale 2026"
                  className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Campaign Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campaignKey}
                  onChange={e => setCampaignKey(e.target.value)}
                  placeholder="e.g. summer-sale-2026"
                  className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional details about this campaign"
                rows={2}
                className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Target Revision <span className="text-red-500">*</span></span>
                  {isLoadingRevisions && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
                </label>
                <select
                  required
                  value={revisionId}
                  onChange={e => setRevisionId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all"
                >
                  <option value="" disabled>Select an immutable revision</option>
                  {availableRevisions.map(rev => (
                    <option key={rev.revisionId} value={rev.revisionId}>
                      Revision #{rev.revisionId} (Created: {new Date(rev.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only published or historically valid revisions can be scheduled.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#e5e5e5] pt-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Start Date & Time <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={startsAtDate}
                    onChange={e => setStartsAtDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all"
                  />
                  <input
                    type="time"
                    value={startsAtTime}
                    onChange={e => setStartsAtTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  End Date & Time <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    min={startsAtDate || new Date().toISOString().split("T")[0]}
                    value={endsAtDate}
                    onChange={e => setEndsAtDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all"
                  />
                  <input
                    type="time"
                    value={endsAtTime}
                    onChange={e => setEndsAtTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-xl focus:ring-2 focus:ring-[#161513] focus:border-[#161513] outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Fallback Revision conditionally required */}
            {(endsAtDate || endsAtTime) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-bold text-amber-900 mb-1.5 flex items-center justify-between">
                    <span>Fallback Revision <span className="text-red-500">*</span></span>
                  </label>
                  <p className="text-xs text-amber-700 mb-3">Since this campaign has an end time, you must specify which homepage revision to fall back to when the campaign ends.</p>
                  <select
                    required
                    value={fallbackRevisionId}
                    onChange={e => setFallbackRevisionId(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  >
                    <option value="" disabled>Select a fallback revision</option>
                    {availableRevisions.map(rev => (
                      <option key={rev.revisionId} value={rev.revisionId}>
                        Revision #{rev.revisionId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] bg-gray-50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-campaign-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-bold text-white bg-[#161513] rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarClock className="w-4 h-4" />
                Create Campaign
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
