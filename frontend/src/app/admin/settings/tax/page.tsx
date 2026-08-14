"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Receipt, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegionalTaxRule {
  id: string;
  region: string;
  rate: number;
}

interface TaxSettings {
  taxEnabled: boolean;
  taxIncluded: boolean;
  defaultTaxRate: number;
  regionalRules: RegionalTaxRule[];
  taxId: string;
}

const DEFAULT_SETTINGS: TaxSettings = {
  taxEnabled: true,
  taxIncluded: false,
  defaultTaxRate: 18,
  regionalRules: [],
  taxId: "GST1234567890",
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

export default function TaxSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<TaxSettings>(DEFAULT_SETTINGS);
  const [errors, setErrors] = useState<Partial<Record<keyof TaxSettings | string, string>>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-tax");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          taxEnabled: parsed.taxEnabled ?? DEFAULT_SETTINGS.taxEnabled,
          taxIncluded: parsed.taxIncluded ?? DEFAULT_SETTINGS.taxIncluded,
          defaultTaxRate: Number(parsed.defaultTaxRate ?? DEFAULT_SETTINGS.defaultTaxRate),
          regionalRules: Array.isArray(parsed.regionalRules) ? parsed.regionalRules : DEFAULT_SETTINGS.regionalRules,
          taxId: parsed.taxId ?? DEFAULT_SETTINGS.taxId,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-tax", err);
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? (value === "" ? 0 : Number(value)) : value;
    
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleToggle = (key: keyof TaxSettings) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addRegionalRule = () => {
    setFormData(prev => ({
      ...prev,
      regionalRules: [
        ...prev.regionalRules,
        { id: Math.random().toString(36).substring(7), region: "", rate: prev.defaultTaxRate }
      ]
    }));
  };

  const removeRegionalRule = (id: string) => {
    setFormData(prev => ({
      ...prev,
      regionalRules: prev.regionalRules.filter(r => r.id !== id)
    }));
    // Clear potential errors for this specific rule
    if (errors[`rule_${id}`]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[`rule_${id}`];
        return newErrs;
      });
    }
  };

  const updateRegionalRule = (id: string, field: "region" | "rate", value: string | number) => {
    setFormData(prev => ({
      ...prev,
      regionalRules: prev.regionalRules.map(r => 
        r.id === id ? { ...r, [field]: value } : r
      )
    }));
    
    if (errors[`rule_${id}`]) {
      setErrors(prev => {
        const newErrs = { ...prev };
        delete newErrs[`rule_${id}`];
        return newErrs;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.defaultTaxRate < 0 || formData.defaultTaxRate > 100) {
      newErrors.defaultTaxRate = "Rate must be between 0 and 100.";
    }

    formData.regionalRules.forEach(rule => {
      if (rule.rate < 0 || rule.rate > 100) {
        newErrors[`rule_${rule.id}`] = "Rate must be between 0 and 100.";
      }
      if (!rule.region.trim()) {
        newErrors[`rule_${rule.id}`] = "Region is required.";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    
    setTimeout(() => {
      try {
        localStorage.setItem("novara-settings-tax", JSON.stringify(formData));
        setSuccessMessage("Tax settings saved successfully");
      } catch (err) {
        console.error("Failed to save settings", err);
      } finally {
        setIsSaving(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }, 600);
  };

  if (!isHydrated) return null;

  // Formatting helper for INR
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  };

  // Tax Calculator Logic
  const basePrice = 10000;
  const activeRate = formData.defaultTaxRate || 0;
  let previewBase = basePrice;
  let previewTaxAmount = 0;
  let previewTotal = basePrice;

  if (formData.taxEnabled) {
    if (formData.taxIncluded) {
      // Price is already final, tax is extracted from it
      // Formula: Price - (Price / (1 + (Rate / 100)))
      previewTaxAmount = basePrice - (basePrice / (1 + (activeRate / 100)));
      previewBase = basePrice - previewTaxAmount;
      previewTotal = basePrice;
    } else {
      // Price is pre-tax, tax is added on top
      previewTaxAmount = basePrice * (activeRate / 100);
      previewBase = basePrice;
      previewTotal = basePrice + previewTaxAmount;
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      
      <div className="p-6 md:p-8 border-b border-[#e5e5e5] flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">Tax Settings</h2>
            <p className="text-sm font-medium text-gray-500">
              Configure how taxes are calculated for your store.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-[#e5e5e5]">
          <span className="text-sm font-bold text-[#161513]">Enable Tax</span>
          <Toggle 
            checked={formData.taxEnabled} 
            onChange={() => handleToggle("taxEnabled")} 
          />
        </div>
      </div>

      <div className="flex flex-col xl:flex-row">
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex-1 flex flex-col gap-8">
          
          <div className={cn("transition-opacity duration-300 flex flex-col gap-8", !formData.taxEnabled && "opacity-50 pointer-events-none")}>
            
            {/* General Tax Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-[#161513] mb-2">
                  Default Tax Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="defaultTaxRate"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.defaultTaxRate}
                    onChange={handleChange}
                    className={`w-full h-12 px-4 pr-8 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                      errors.defaultTaxRate ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                </div>
                {errors.defaultTaxRate && (
                  <p className="text-red-500 text-xs font-bold mt-2">{errors.defaultTaxRate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[#161513] mb-2">
                  Tax Registration ID
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="e.g. GSTIN or VAT Number"
                  className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
                />
              </div>
            </div>

            {/* Price Presentation */}
            <div className="max-w-2xl">
              <label className="flex items-center gap-3 p-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] cursor-pointer hover:bg-gray-50 transition-colors">
                <Toggle 
                  checked={formData.taxIncluded} 
                  onChange={() => handleToggle("taxIncluded")} 
                />
                <div>
                  <span className="block text-sm font-bold text-[#161513]">Prices are inclusive of tax</span>
                  <span className="block text-xs font-medium text-gray-500 mt-1">If enabled, the product price shown to customers includes tax.</span>
                </div>
              </label>
            </div>

            <hr className="border-[#e5e5e5]" />

            {/* Regional Overrides */}
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#161513] text-lg">Regional Overrides</h3>
                <button
                  type="button"
                  onClick={addRegionalRule}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#ff4b2b] hover:text-[#ff3b1a] px-3 py-1.5 rounded-lg hover:bg-[#ff4b2b]/5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Region
                </button>
              </div>
              
              {formData.regionalRules.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-[#e5e5e5] rounded-xl bg-gray-50">
                  <p className="text-sm font-medium text-gray-500">No regional tax overrides configured.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {formData.regionalRules.map((rule) => (
                    <div key={rule.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={rule.region}
                          onChange={(e) => updateRegionalRule(rule.id, "region", e.target.value)}
                          placeholder="Region / State"
                          className={`w-full h-11 px-4 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                            errors[`rule_${rule.id}`]?.includes("Region") ? "border-red-300" : "border-[#e5e5e5]"
                          }`}
                        />
                      </div>
                      
                      <div className="relative w-full sm:w-32 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={rule.rate}
                          onChange={(e) => updateRegionalRule(rule.id, "rate", e.target.value === "" ? 0 : Number(e.target.value))}
                          className={`w-full h-11 px-3 pr-8 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                            errors[`rule_${rule.id}`]?.includes("Rate") ? "border-red-300" : "border-[#e5e5e5]"
                          }`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeRegionalRule(rule.id)}
                        className="h-11 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-colors shrink-0"
                        title="Remove override"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {Object.keys(errors).some(k => k.startsWith("rule_")) && (
                    <p className="text-red-500 text-xs font-bold mt-1">Please ensure all regions have names and rates between 0 and 100.</p>
                  )}
                </div>
              )}
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
              Reset
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

        {/* Live Calculation Preview Sidebar */}
        <div className="w-full xl:w-80 bg-gray-50 p-6 md:p-8 xl:border-l border-t xl:border-t-0 border-[#e5e5e5] rounded-b-2xl xl:rounded-br-2xl xl:rounded-bl-none xl:rounded-tr-2xl shrink-0">
          
          <h3 className="font-bold text-[#161513] mb-2 flex items-center gap-2">
            Tax Preview
          </h3>
          <p className="text-xs font-medium text-gray-500 mb-6">
            This is a UI-only preview showing how taxes will be calculated at checkout based on your current settings.
          </p>

          <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Product Price</span>
              <span className="font-bold text-[#161513]">{formatINR(basePrice)}</span>
            </div>
            
            {!formData.taxEnabled ? (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Tax</span>
                <span className="font-bold text-gray-400">Disabled</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Subtotal (Pre-tax)</span>
                  <span className="font-bold text-[#161513]">{formatINR(previewBase)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Estimated Tax ({activeRate}%)</span>
                  <span className="font-bold text-[#ff4b2b]">{formData.taxIncluded ? "Incl. " : "+ "}{formatINR(previewTaxAmount)}</span>
                </div>
              </>
            )}

            <hr className="border-[#e5e5e5] my-1" />
            
            <div className="flex justify-between items-center text-base">
              <span className="font-bold text-[#161513]">Customer Pays</span>
              <span className="font-black text-xl text-[#161513] tracking-tight">{formatINR(previewTotal)}</span>
            </div>

            {formData.taxEnabled && formData.taxIncluded && (
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 text-center mt-2">
                Tax is included in product price
              </p>
            )}
            {formData.taxEnabled && !formData.taxIncluded && (
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 text-center mt-2">
                Tax is added at checkout
              </p>
            )}
          </div>
        </div>

      </div>

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
