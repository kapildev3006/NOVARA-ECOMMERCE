"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  accentColor: string;
  sidebarState: "expanded" | "collapsed";
  tableDensity: "comfortable" | "compact";
}

const DEFAULT_SETTINGS: AppearanceSettings = {
  theme: "light",
  accentColor: "#ff4b2b",
  sidebarState: "expanded",
  tableDensity: "comfortable",
};

const ACCENT_COLORS = [
  { label: "NOVARA Orange", value: "#ff4b2b" },
  { label: "Ocean Blue", value: "#3b82f6" },
  { label: "Emerald Green", value: "#10b981" },
  { label: "Royal Purple", value: "#8b5cf6" },
  { label: "Midnight Black", value: "#161513" },
];

export default function AppearanceSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AppearanceSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-appearance");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
          accentColor: parsed.accentColor ?? DEFAULT_SETTINGS.accentColor,
          sidebarState: parsed.sidebarState ?? DEFAULT_SETTINGS.sidebarState,
          tableDensity: parsed.tableDensity ?? DEFAULT_SETTINGS.tableDensity,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-appearance", err);
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, accentColor: color }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      try {
        localStorage.setItem("novara-settings-appearance", JSON.stringify(formData));
        setSuccessMessage("Appearance settings saved successfully");
      } catch (err) {
        console.error("Failed to save settings", err);
      } finally {
        setIsSaving(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }, 600);
  };

  if (!isHydrated) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      
      <div className="p-6 md:p-8 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">Appearance</h2>
            <p className="text-sm font-medium text-gray-500">
              Customize the look and feel of your admin dashboard.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
        
        {/* Theme Settings */}
        <div className="max-w-2xl">
          <label className="block text-sm font-bold text-[#161513] mb-4">
            Theme Preference
          </label>
          <div className="grid grid-cols-3 gap-4">
            {(["light", "dark", "system"] as const).map((t) => (
              <label
                key={t}
                className={cn(
                  "cursor-pointer flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
                  formData.theme === t 
                    ? "border-[#ff4b2b] bg-[#ff4b2b]/5 ring-1 ring-[#ff4b2b]" 
                    : "border-[#e5e5e5] hover:border-gray-300 bg-white"
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={t}
                  checked={formData.theme === t}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="w-full h-16 rounded-lg border border-[#e5e5e5] flex items-center justify-center overflow-hidden bg-gray-50 shrink-0">
                  {/* Miniature abstract representation of the theme */}
                  {t === "light" && (
                    <div className="w-full h-full bg-white flex flex-col gap-1 p-2">
                      <div className="h-2 w-full bg-gray-100 rounded-sm" />
                      <div className="flex-1 w-full bg-gray-50 rounded-sm" />
                    </div>
                  )}
                  {t === "dark" && (
                    <div className="w-full h-full bg-gray-900 flex flex-col gap-1 p-2">
                      <div className="h-2 w-full bg-gray-800 rounded-sm" />
                      <div className="flex-1 w-full bg-gray-800 rounded-sm" />
                    </div>
                  )}
                  {t === "system" && (
                    <div className="w-full h-full flex">
                      <div className="w-1/2 h-full bg-white flex flex-col gap-1 p-2 border-r border-[#e5e5e5]">
                        <div className="h-2 w-full bg-gray-100 rounded-sm" />
                      </div>
                      <div className="w-1/2 h-full bg-gray-900 flex flex-col gap-1 p-2">
                        <div className="h-2 w-full bg-gray-800 rounded-sm" />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold capitalize text-[#161513]">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-[#e5e5e5]" />

        {/* Accent Color */}
        <div className="max-w-2xl">
          <label className="block text-sm font-bold text-[#161513] mb-4">
            Accent Color
          </label>
          <div className="flex flex-wrap gap-4">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => handleColorSelect(color.value)}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                  formData.accentColor === color.value 
                    ? "ring-2 ring-offset-2 ring-[#ff4b2b] scale-110" 
                    : "hover:scale-105 border border-black/10"
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              >
                {formData.accentColor === color.value && (
                  <Check className="w-5 h-5 text-white" />
                )}
              </button>
            ))}
            
            <div className="relative flex items-center">
              <input
                type="color"
                name="accentColor"
                value={formData.accentColor}
                onChange={handleChange}
                className="w-12 h-12 p-0 border-0 rounded-full overflow-hidden cursor-pointer bg-transparent"
                title="Custom Color"
              />
              <span className="ml-3 text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:inline-block">
                Custom
              </span>
            </div>
          </div>
        </div>

        <hr className="border-[#e5e5e5]" />

        {/* Layout Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Sidebar Navigation
            </label>
            <select
              name="sidebarState"
              value={formData.sidebarState}
              onChange={handleChange}
              className="w-full h-12 px-4 pr-10 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat' }}
            >
              <option value="expanded">Always Expanded</option>
              <option value="collapsed">Collapsed by Default</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Table Data Density
            </label>
            <select
              name="tableDensity"
              value={formData.tableDensity}
              onChange={handleChange}
              className="w-full h-12 px-4 pr-10 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat' }}
            >
              <option value="comfortable">Comfortable (More Padding)</option>
              <option value="compact">Compact (More Data)</option>
            </select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="h-12 px-8 bg-[#ff4b2b] text-white font-bold rounded-xl hover:bg-[#ff3b1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

      </form>

      {/* Temporary Success Feedback */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <p className="font-medium text-sm">{successMessage}</p>
        </div>
      )}

    </div>
  );
}
