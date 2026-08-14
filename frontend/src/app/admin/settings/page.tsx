"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Store } from "lucide-react";

interface GeneralSettings {
  storeName: string;
  contactEmail: string;
  contactPhone: string;
  currency: string;
  timezone: string;
}

const DEFAULT_SETTINGS: GeneralSettings = {
  storeName: "NOVARA",
  contactEmail: "",
  contactPhone: "",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

export default function GeneralSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<GeneralSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Partial<Record<keyof GeneralSettings, string>>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-general");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Ensure missing fields fallback to default safely
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          storeName: parsed.storeName ?? DEFAULT_SETTINGS.storeName,
          contactEmail: parsed.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
          contactPhone: parsed.contactPhone ?? DEFAULT_SETTINGS.contactPhone,
          currency: parsed.currency ?? DEFAULT_SETTINGS.currency,
          timezone: parsed.timezone ?? DEFAULT_SETTINGS.timezone,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-general", err);
      // Fallback safely in case of malformed JSON
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name as keyof GeneralSettings]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof GeneralSettings, string>> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = "Store Name is required.";
    }

    if (formData.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Please enter a valid email address.";
    }

    if (formData.contactPhone.trim() && !/^\+?[0-9\s-]{7,15}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = "Please enter a valid phone number.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    
    // Simulate short network delay for UX
    setTimeout(() => {
      try {
        localStorage.setItem("novara-settings-general", JSON.stringify(formData));
        setSuccessMessage("Settings saved successfully");
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
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-[#ff4b2b]" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">General Details</h2>
            <p className="text-sm font-medium text-gray-500">
              Configure your basic store information and defaults.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
        
        {/* Store Name */}
        <div>
          <label className="block text-sm font-bold text-[#161513] mb-2">
            Store Name <span className="text-[#ff4b2b]">*</span>
          </label>
          <input
            type="text"
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            placeholder="e.g. NOVARA"
            className={`w-full max-w-md h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
              errors.storeName ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
            }`}
          />
          {errors.storeName && (
            <p className="text-red-500 text-xs font-bold mt-2">{errors.storeName}</p>
          )}
        </div>

        <hr className="border-[#e5e5e5]" />

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Contact Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="e.g. contact@example.com"
              className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                errors.contactEmail ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
              }`}
            />
            {errors.contactEmail ? (
              <p className="text-red-500 text-xs font-bold mt-2">{errors.contactEmail}</p>
            ) : (
              <p className="text-gray-400 text-xs font-medium mt-2">Optional. Customers will use this to contact support.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                errors.contactPhone ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
              }`}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-xs font-bold mt-2">{errors.contactPhone}</p>
            )}
          </div>
        </div>

        <hr className="border-[#e5e5e5]" />

        {/* Regional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Store Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full h-12 px-4 pr-10 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat' }}
            >
              <option value="INR">Indian Rupee (₹)</option>
              <option value="USD">US Dollar ($)</option>
              <option value="EUR">Euro (€)</option>
              <option value="GBP">British Pound (£)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Timezone
            </label>
            <select
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full h-12 px-4 pr-10 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat' }}
            >
              <option value="Asia/Kolkata">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
              <option value="UTC">(UTC) Coordinated Universal Time</option>
              <option value="America/New_York">(UTC-05:00) Eastern Time (US & Canada)</option>
              <option value="Europe/London">(UTC+00:00) London</option>
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
