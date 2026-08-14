"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationSettings {
  globalEnable: boolean;
  
  emailNewOrder: boolean;
  emailOrderStatus: boolean;
  emailLowStock: boolean;
  emailNewCustomer: boolean;
  emailPromotional: boolean;

  alertLowStock: boolean;
  alertOutOfStock: boolean;
  alertFailedOrder: boolean;
  alertSystem: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  globalEnable: true,
  
  emailNewOrder: true,
  emailOrderStatus: true,
  emailLowStock: false,
  emailNewCustomer: false,
  emailPromotional: false,

  alertLowStock: true,
  alertOutOfStock: true,
  alertFailedOrder: true,
  alertSystem: false,
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

export default function NotificationSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          globalEnable: parsed.globalEnable ?? DEFAULT_SETTINGS.globalEnable,
          
          emailNewOrder: parsed.emailNewOrder ?? DEFAULT_SETTINGS.emailNewOrder,
          emailOrderStatus: parsed.emailOrderStatus ?? DEFAULT_SETTINGS.emailOrderStatus,
          emailLowStock: parsed.emailLowStock ?? DEFAULT_SETTINGS.emailLowStock,
          emailNewCustomer: parsed.emailNewCustomer ?? DEFAULT_SETTINGS.emailNewCustomer,
          emailPromotional: parsed.emailPromotional ?? DEFAULT_SETTINGS.emailPromotional,

          alertLowStock: parsed.alertLowStock ?? DEFAULT_SETTINGS.alertLowStock,
          alertOutOfStock: parsed.alertOutOfStock ?? DEFAULT_SETTINGS.alertOutOfStock,
          alertFailedOrder: parsed.alertFailedOrder ?? DEFAULT_SETTINGS.alertFailedOrder,
          alertSystem: parsed.alertSystem ?? DEFAULT_SETTINGS.alertSystem,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-notifications", err);
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleToggle = (key: keyof NotificationSettings) => {
    setFormData(prev => {
      const nextState = !prev[key];
      
      // If turning off globally, we don't necessarily change the sub-options,
      // but they will be disabled in the UI.
      
      return { ...prev, [key]: nextState };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    setTimeout(() => {
      try {
        localStorage.setItem("novara-settings-notifications", JSON.stringify(formData));
        setSuccessMessage("Notification preferences saved successfully");
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
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#161513]">Notifications</h2>
            <p className="text-sm font-medium text-gray-500">
              Manage your email updates and admin alerts.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-[#e5e5e5]">
          <span className="text-sm font-bold text-[#161513]">Enable Notifications</span>
          <Toggle 
            checked={formData.globalEnable} 
            onChange={() => handleToggle("globalEnable")} 
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-10">
        
        <div className={cn("transition-opacity duration-300", !formData.globalEnable && "opacity-50 pointer-events-none")}>
          <h3 className="font-bold text-[#161513] mb-4 text-lg">Email Notifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            
            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">New Order</span>
                <span className="block text-xs font-medium text-gray-500">Receive an email when a customer places a new order.</span>
              </div>
              <Toggle checked={formData.emailNewOrder} onChange={() => handleToggle("emailNewOrder")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">Order Status Updates</span>
                <span className="block text-xs font-medium text-gray-500">Updates when orders are fulfilled, shipped, or cancelled.</span>
              </div>
              <Toggle checked={formData.emailOrderStatus} onChange={() => handleToggle("emailOrderStatus")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">Low Stock Alerts</span>
                <span className="block text-xs font-medium text-gray-500">Daily summary of products reaching low stock levels.</span>
              </div>
              <Toggle checked={formData.emailLowStock} onChange={() => handleToggle("emailLowStock")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">New Customer</span>
                <span className="block text-xs font-medium text-gray-500">Receive an email when a new customer registers.</span>
              </div>
              <Toggle checked={formData.emailNewCustomer} onChange={() => handleToggle("emailNewCustomer")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer md:col-span-2">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">Promotional Updates</span>
                <span className="block text-xs font-medium text-gray-500">News, tips, and feature updates from the NOVARA platform.</span>
              </div>
              <Toggle checked={formData.emailPromotional} onChange={() => handleToggle("emailPromotional")} disabled={!formData.globalEnable} />
            </label>

          </div>
        </div>

        <hr className="border-[#e5e5e5]" />

        <div className={cn("transition-opacity duration-300", !formData.globalEnable && "opacity-50 pointer-events-none")}>
          <h3 className="font-bold text-[#161513] mb-4 text-lg">Admin Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            
            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">Low Stock</span>
                <span className="block text-xs font-medium text-gray-500">Show a badge when inventory drops below 10.</span>
              </div>
              <Toggle checked={formData.alertLowStock} onChange={() => handleToggle("alertLowStock")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">Out of Stock</span>
                <span className="block text-xs font-medium text-gray-500">Urgent alert when an item cannot be purchased.</span>
              </div>
              <Toggle checked={formData.alertOutOfStock} onChange={() => handleToggle("alertOutOfStock")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">Failed Order</span>
                <span className="block text-xs font-medium text-gray-500">Immediate alert for payment or processing failures.</span>
              </div>
              <Toggle checked={formData.alertFailedOrder} onChange={() => handleToggle("alertFailedOrder")} disabled={!formData.globalEnable} />
            </label>

            <label className="flex items-start justify-between p-4 rounded-xl border border-[#e5e5e5] hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="pr-4">
                <span className="block font-bold text-sm text-[#161513] mb-1">System Alerts</span>
                <span className="block text-xs font-medium text-gray-500">Important notices about downtime or maintenance.</span>
              </div>
              <Toggle checked={formData.alertSystem} onChange={() => handleToggle("alertSystem")} disabled={!formData.globalEnable} />
            </label>

          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end pt-4 border-t border-[#e5e5e5]">
          <button
            type="submit"
            disabled={isSaving}
            className="h-12 px-8 bg-[#ff4b2b] text-white font-bold rounded-xl hover:bg-[#ff3b1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] mt-4"
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
