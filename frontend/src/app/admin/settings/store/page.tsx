"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Store } from "lucide-react";
import { ImageUploader } from "@/components/admin/media/ImageUploader";

interface StoreInfoSettings {
  storeName: string;
  storeLogoUrl: string;
  storeDescription: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: string;
  storeUrl: string;
  socialFacebook: string;
  socialInstagram: string;
  socialX: string;
  businessHours: string;
}

const DEFAULT_SETTINGS: StoreInfoSettings = {
  storeName: "NOVARA",
  storeLogoUrl: "",
  storeDescription: "A premium e-commerce platform.",
  contactEmail: "",
  contactPhone: "",
  businessAddress: "",
  storeUrl: "https://novara.store",
  socialFacebook: "",
  socialInstagram: "",
  socialX: "",
  businessHours: "Mon - Fri, 9:00 AM - 6:00 PM",
};

export default function StoreInfoSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<StoreInfoSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Partial<Record<keyof StoreInfoSettings, string>>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-store-info");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          storeName: parsed.storeName ?? DEFAULT_SETTINGS.storeName,
          storeLogoUrl: parsed.storeLogoUrl ?? DEFAULT_SETTINGS.storeLogoUrl,
          storeDescription: parsed.storeDescription ?? DEFAULT_SETTINGS.storeDescription,
          contactEmail: parsed.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
          contactPhone: parsed.contactPhone ?? DEFAULT_SETTINGS.contactPhone,
          businessAddress: parsed.businessAddress ?? DEFAULT_SETTINGS.businessAddress,
          storeUrl: parsed.storeUrl ?? DEFAULT_SETTINGS.storeUrl,
          socialFacebook: parsed.socialFacebook ?? DEFAULT_SETTINGS.socialFacebook,
          socialInstagram: parsed.socialInstagram ?? DEFAULT_SETTINGS.socialInstagram,
          socialX: parsed.socialX ?? DEFAULT_SETTINGS.socialX,
          businessHours: parsed.businessHours ?? DEFAULT_SETTINGS.businessHours,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-store-info", err);
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof StoreInfoSettings]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StoreInfoSettings, string>> = {};

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
    
    setTimeout(() => {
      try {
        localStorage.setItem("novara-settings-store-info", JSON.stringify(formData));
        setSuccessMessage("Store information saved successfully");
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
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">Store Information</h2>
            <p className="text-sm font-medium text-gray-500">
              Manage your public store profile, contact details, and social links.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
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
              className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                errors.storeName ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
              }`}
            />
            {errors.storeName && (
              <p className="text-red-500 text-xs font-bold mt-2">{errors.storeName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Store URL
            </label>
            <input
              type="url"
              name="storeUrl"
              value={formData.storeUrl}
              onChange={handleChange}
              placeholder="https://yourstore.com"
              className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
            />
          </div>
        </div>

        <div className="max-w-2xl">
          <label className="block text-sm font-bold text-[#161513] mb-2">
            Store Description
          </label>
          <textarea
            name="storeDescription"
            value={formData.storeDescription}
            onChange={handleChange}
            placeholder="A brief description of your store..."
            className="w-full p-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all min-h-[100px] resize-y"
          />
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
              placeholder="contact@example.com"
              className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                errors.contactEmail ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
              }`}
            />
            {errors.contactEmail && (
              <p className="text-red-500 text-xs font-bold mt-2">{errors.contactEmail}</p>
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
              placeholder="+91 98765 43210"
              className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                errors.contactPhone ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
              }`}
            />
            {errors.contactPhone && (
              <p className="text-red-500 text-xs font-bold mt-2">{errors.contactPhone}</p>
            )}
          </div>
        </div>

        <div className="max-w-2xl">
          <label className="block text-sm font-bold text-[#161513] mb-2">
            Business Address
          </label>
          <textarea
            name="businessAddress"
            value={formData.businessAddress}
            onChange={handleChange}
            placeholder="123 Commerce St..."
            className="w-full p-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all min-h-[100px] resize-y"
          />
        </div>

        <hr className="border-[#e5e5e5]" />

        {/* Branding & Socials */}
        <div className="grid grid-cols-1 gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Store Logo
            </label>
            <ImageUploader
              value={formData.storeLogoUrl}
              onChange={(url) => {
                setFormData(prev => ({ ...prev, storeLogoUrl: url }));
              }}
            />
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-2">
              Business Hours
            </label>
            <input
              type="text"
              name="businessHours"
              value={formData.businessHours}
              onChange={handleChange}
              placeholder="Mon - Fri, 9AM - 5PM"
              className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
            />
          </div>
        </div>

        <div className="max-w-2xl space-y-4">
          <label className="block text-sm font-bold text-[#161513]">
            Social Links
          </label>
          <input
            type="url"
            name="socialFacebook"
            value={formData.socialFacebook}
            onChange={handleChange}
            placeholder="Facebook URL"
            className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
          />
          <input
            type="url"
            name="socialInstagram"
            value={formData.socialInstagram}
            onChange={handleChange}
            placeholder="Instagram URL"
            className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
          />
          <input
            type="url"
            name="socialX"
            value={formData.socialX}
            onChange={handleChange}
            placeholder="X (Twitter) URL"
            className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
          />
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
