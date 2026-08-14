"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShippingSettings {
  shippingEnabled: boolean;
  regions: string;
  freeShippingThreshold: number;
  standardPrice: number;
  expressPrice: number;
  standardEstimate: string;
  expressEstimate: string;
  minimumOrderValue: number;
  codAvailable: boolean;
}

const DEFAULT_SETTINGS: ShippingSettings = {
  shippingEnabled: true,
  regions: "India (All States)",
  freeShippingThreshold: 5000,
  standardPrice: 150,
  expressPrice: 300,
  standardEstimate: "3-5 Business Days",
  expressEstimate: "1-2 Business Days",
  minimumOrderValue: 500,
  codAvailable: true,
};

function Toggle({ checked, onChange, disabled = false }: { checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2",
        checked ? "bg-[#ff4b2b]" : "bg-gray-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export default function ShippingSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ShippingSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Partial<Record<keyof ShippingSettings, string>>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-shipping");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          shippingEnabled: parsed.shippingEnabled ?? DEFAULT_SETTINGS.shippingEnabled,
          regions: parsed.regions ?? DEFAULT_SETTINGS.regions,
          freeShippingThreshold: Number(parsed.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold),
          standardPrice: Number(parsed.standardPrice ?? DEFAULT_SETTINGS.standardPrice),
          expressPrice: Number(parsed.expressPrice ?? DEFAULT_SETTINGS.expressPrice),
          standardEstimate: parsed.standardEstimate ?? DEFAULT_SETTINGS.standardEstimate,
          expressEstimate: parsed.expressEstimate ?? DEFAULT_SETTINGS.expressEstimate,
          minimumOrderValue: Number(parsed.minimumOrderValue ?? DEFAULT_SETTINGS.minimumOrderValue),
          codAvailable: parsed.codAvailable ?? DEFAULT_SETTINGS.codAvailable,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-shipping", err);
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? Number(value) : value;
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    if (errors[name as keyof ShippingSettings]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleToggle = (key: keyof ShippingSettings) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ShippingSettings, string>> = {};

    if (formData.freeShippingThreshold < 0) {
      newErrors.freeShippingThreshold = "Cannot be negative.";
    }
    if (formData.standardPrice < 0) {
      newErrors.standardPrice = "Cannot be negative.";
    }
    if (formData.expressPrice < 0) {
      newErrors.expressPrice = "Cannot be negative.";
    }
    if (formData.minimumOrderValue < 0) {
      newErrors.minimumOrderValue = "Cannot be negative.";
    }
    if (formData.expressPrice < formData.standardPrice) {
      newErrors.expressPrice = "Express fee must be ≥ Standard fee.";
    }
    if (!formData.standardEstimate.trim()) {
      newErrors.standardEstimate = "Required.";
    }
    if (!formData.expressEstimate.trim()) {
      newErrors.expressEstimate = "Required.";
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
        localStorage.setItem("novara-settings-shipping", JSON.stringify(formData));
        setSuccessMessage("Shipping settings saved successfully");
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
      
      <div className="p-6 md:p-8 border-b border-[#e5e5e5] flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">Shipping & Delivery</h2>
            <p className="text-sm font-medium text-gray-500">
              Manage your delivery regions, rates, and minimum thresholds.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-[#e5e5e5]">
          <span className="text-sm font-bold text-[#161513]">Enable Shipping</span>
          <Toggle 
            checked={formData.shippingEnabled as boolean} 
            onChange={() => handleToggle("shippingEnabled")} 
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-8">
        
        <div className={cn("transition-opacity duration-300 flex flex-col gap-8", !formData.shippingEnabled && "opacity-50 pointer-events-none")}>
          
          {/* General Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-[#161513] mb-2">
                Supported Regions
              </label>
              <input
                type="text"
                name="regions"
                value={formData.regions as string}
                onChange={handleChange}
                placeholder="e.g. Worldwide, India"
                className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
              />
              <p className="text-gray-400 text-xs font-medium mt-2">Where you currently deliver to.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-[#161513] mb-2">
                Cash on Delivery (COD)
              </label>
              <div className="flex items-center h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8]">
                <Toggle 
                  checked={formData.codAvailable as boolean} 
                  onChange={() => handleToggle("codAvailable")} 
                />
                <span className="ml-3 text-sm font-medium text-[#161513]">
                  {formData.codAvailable ? "Available" : "Disabled"}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-[#e5e5e5]" />

          {/* Pricing & Thresholds */}
          <div>
            <h3 className="font-bold text-[#161513] mb-4 text-lg">Pricing & Thresholds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
              
              <div>
                <label className="block text-sm font-bold text-[#161513] mb-2">
                  Minimum Order Value
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                  <input
                    type="number"
                    name="minimumOrderValue"
                    min="0"
                    value={formData.minimumOrderValue as number}
                    onChange={handleChange}
                    className={`w-full h-12 pl-8 pr-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                      errors.minimumOrderValue ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
                    }`}
                  />
                </div>
                {errors.minimumOrderValue && (
                  <p className="text-red-500 text-xs font-bold mt-2">{errors.minimumOrderValue}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#161513] mb-2">
                  Free Shipping Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                  <input
                    type="number"
                    name="freeShippingThreshold"
                    min="0"
                    value={formData.freeShippingThreshold as number}
                    onChange={handleChange}
                    className={`w-full h-12 pl-8 pr-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                      errors.freeShippingThreshold ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
                    }`}
                  />
                </div>
                {errors.freeShippingThreshold && (
                  <p className="text-red-500 text-xs font-bold mt-2">{errors.freeShippingThreshold}</p>
                )}
              </div>

            </div>
          </div>

          <hr className="border-[#e5e5e5]" />

          {/* Shipping Methods */}
          <div>
            <h3 className="font-bold text-[#161513] mb-4 text-lg">Shipping Methods</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl">
              
              {/* Standard */}
              <div className="p-5 rounded-xl border border-[#e5e5e5] bg-gray-50 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#161513]">Standard Delivery</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                      <input
                        type="number"
                        name="standardPrice"
                        min="0"
                        value={formData.standardPrice as number}
                        onChange={handleChange}
                        className={`w-full h-10 pl-7 pr-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                          errors.standardPrice ? "border-red-300" : "border-[#e5e5e5]"
                        }`}
                      />
                    </div>
                    {errors.standardPrice && <p className="text-red-500 text-xs mt-1">{errors.standardPrice}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Estimate</label>
                    <input
                      type="text"
                      name="standardEstimate"
                      value={formData.standardEstimate as string}
                      onChange={handleChange}
                      placeholder="e.g. 3-5 Days"
                      className={`w-full h-10 px-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                        errors.standardEstimate ? "border-red-300" : "border-[#e5e5e5]"
                      }`}
                    />
                    {errors.standardEstimate && <p className="text-red-500 text-xs mt-1">{errors.standardEstimate}</p>}
                  </div>
                </div>
              </div>

              {/* Express */}
              <div className="p-5 rounded-xl border border-[#ff4b2b]/20 bg-[#ff4b2b]/5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#161513]">Express Delivery</h4>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff4b2b] bg-white px-2 py-1 rounded-full shadow-sm">Premium</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#161513]/70 mb-1 uppercase tracking-wider">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                      <input
                        type="number"
                        name="expressPrice"
                        min="0"
                        value={formData.expressPrice as number}
                        onChange={handleChange}
                        className={`w-full h-10 pl-7 pr-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                          errors.expressPrice ? "border-red-400 ring-1 ring-red-400" : "border-white/50 shadow-sm"
                        }`}
                      />
                    </div>
                    {errors.expressPrice && <p className="text-red-500 text-xs font-bold mt-1">{errors.expressPrice}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#161513]/70 mb-1 uppercase tracking-wider">Estimate</label>
                    <input
                      type="text"
                      name="expressEstimate"
                      value={formData.expressEstimate as string}
                      onChange={handleChange}
                      placeholder="e.g. 1-2 Days"
                      className={`w-full h-10 px-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                        errors.expressEstimate ? "border-red-400" : "border-white/50 shadow-sm"
                      }`}
                    />
                    {errors.expressEstimate && <p className="text-red-500 text-xs font-bold mt-1">{errors.expressEstimate}</p>}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Submit Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-[#e5e5e5] mt-4">
          <button
            type="button"
            onClick={() => {
              setFormData(DEFAULT_SETTINGS);
              setErrors({});
            }}
            className="h-12 px-6 text-sm font-bold text-gray-500 hover:text-[#161513] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 rounded-xl"
          >
            Reset to Defaults
          </button>
          
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
