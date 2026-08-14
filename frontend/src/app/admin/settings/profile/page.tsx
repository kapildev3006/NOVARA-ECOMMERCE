"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, UserCircle, Shield, AlertCircle } from "lucide-react";
import { ImageUploader } from "@/components/admin/media/ImageUploader";

interface AdminProfile {
  avatarUrl: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
}

const DEFAULT_PROFILE: AdminProfile = {
  avatarUrl: "https://i.pravatar.cc/150?u=admin",
  fullName: "Admin User",
  email: "admin@novara.com",
  phone: "+91 98765 43210",
  jobTitle: "Store Administrator",
};

export default function AdminProfileSettingsPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [errors, setErrors] = useState<Partial<Record<keyof AdminProfile | string, string>>>({});

  // Password Prototype State
  const [passwordState, setPasswordState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-settings-admin-profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData({
          avatarUrl: parsed.avatarUrl ?? DEFAULT_PROFILE.avatarUrl,
          fullName: parsed.fullName ?? DEFAULT_PROFILE.fullName,
          email: parsed.email ?? DEFAULT_PROFILE.email,
          phone: parsed.phone ?? DEFAULT_PROFILE.phone,
          jobTitle: parsed.jobTitle ?? DEFAULT_PROFILE.jobTitle,
        });
      }
    } catch (err) {
      console.error("Failed to parse novara-settings-admin-profile", err);
    } finally {
       
      setIsHydrated(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordState(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setPasswordSuccess(false);
  };

  const validateProfile = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Invalid email format.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordState.currentPassword) newErrors.currentPassword = "Required.";
    if (!passwordState.newPassword) newErrors.newPassword = "Required.";
    else if (passwordState.newPassword.length < 8) newErrors.newPassword = "Must be at least 8 characters.";
    
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setIsSaving(true);
    
    setTimeout(() => {
      try {
        localStorage.setItem("novara-settings-admin-profile", JSON.stringify(formData));
        setSuccessMessage("Profile saved successfully");
      } catch (err) {
        console.error("Failed to save profile", err);
      } finally {
        setIsSaving(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    }, 600);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsSaving(true);
    
    setTimeout(() => {
      // PROTOTYPE ONLY - no actual password persistence
      setIsSaving(false);
      setPasswordSuccess(true);
      setPasswordState({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      setTimeout(() => setPasswordSuccess(false), 3000);
    }, 800);
  };

  if (!isHydrated) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col xl:flex-row">
      
      {/* Profile Form */}
      <div className="flex-1 border-r border-[#e5e5e5]">
        
        <div className="p-6 md:p-8 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <UserCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-[#161513]">Admin Profile</h2>
              <p className="text-sm font-medium text-gray-500">
                Manage your personal information and contact details.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitProfile} className="p-6 md:p-8 flex flex-col gap-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 w-full max-w-sm">
              <ImageUploader
                value={formData.avatarUrl}
                label="Admin Avatar"
                isCircle
                className="max-w-xs"
                onChange={(url) => {
                  setFormData(prev => ({ ...prev, avatarUrl: url }));
                }}
              />
            </div>
          </div>

          <hr className="border-[#e5e5e5]" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-[#161513] mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                  errors.fullName ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
                }`}
              />
              {errors.fullName && <p className="text-red-500 text-xs font-bold mt-2">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#161513] mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full h-12 px-4 rounded-xl border bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all ${
                  errors.email ? "border-red-300 ring-1 ring-red-300" : "border-[#e5e5e5]"
                }`}
              />
              {errors.email && <p className="text-red-500 text-xs font-bold mt-2">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[#161513] mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#161513] mb-2">
                Job Title / Role
              </label>
              <input
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleChange}
                className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#e5e5e5] mt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="h-12 px-8 bg-[#ff4b2b] text-white font-bold rounded-xl hover:bg-[#ff3b1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px]"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Sidebar (Prototype) */}
      <div className="w-full xl:w-96 bg-gray-50 flex flex-col shrink-0 rounded-b-2xl xl:rounded-br-2xl xl:rounded-bl-none xl:rounded-tr-2xl overflow-hidden">
        
        <div className="p-6 md:p-8 border-b border-[#e5e5e5] bg-white">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-gray-700" />
            <h3 className="font-bold text-[#161513] text-lg">Security</h3>
          </div>
          <p className="text-xs font-medium text-gray-500">
            Update your password to keep your account secure.
          </p>
        </div>

        <div className="p-6 md:p-8 flex-1">
          
          <div className="flex gap-2 items-start p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              <strong>Prototype UI:</strong> Passwords are not actually saved or checked in this frontend-only demo.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordState.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full h-11 px-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-all ${
                  errors.currentPassword ? "border-red-300" : "border-[#e5e5e5]"
                }`}
              />
              {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordState.newPassword}
                onChange={handlePasswordChange}
                className={`w-full h-11 px-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-all ${
                  errors.newPassword ? "border-red-300" : "border-[#e5e5e5]"
                }`}
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordState.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full h-11 px-3 rounded-lg border bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 transition-all ${
                  errors.confirmPassword ? "border-red-300" : "border-[#e5e5e5]"
                }`}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="h-11 mt-2 w-full bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
            </button>

            {passwordSuccess && (
              <p className="text-sm font-bold text-green-600 text-center animate-in fade-in">
                Password updated successfully!
              </p>
            )}

          </form>

        </div>
      </div>

      {/* Temporary Success Feedback for Profile */}
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
