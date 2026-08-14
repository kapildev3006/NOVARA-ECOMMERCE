"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export interface Profile {
  fullName: string;
  email: string;
  phone?: string;
}

interface ProfileFormProps {
  initialData?: Profile | null;
  onSave: (profile: Profile) => void;
}

export function ProfileForm({ initialData, onSave }: ProfileFormProps) {
  const [formData, setFormData] = useState<Profile>({
    fullName: initialData?.fullName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
  });

  const [errors, setErrors] = useState<Partial<Profile>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof Profile]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Profile> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold mb-2">
          <CheckCircle2 className="w-5 h-5" />
          Profile updated successfully (stored locally).
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">Full Name *</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className={cn(
            "h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all",
            errors.fullName ? "border-red-500" : "border-black/10"
          )}
        />
        {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={cn(
            "h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all",
            errors.email ? "border-red-500" : "border-black/10"
          )}
        />
        {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">Phone Number</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={cn(
            "h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all",
            errors.phone ? "border-red-500" : "border-black/10"
          )}
          placeholder="e.g. 9876543210"
        />
        {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
      </div>

      <button
        type="submit"
        className="bg-foreground text-background font-bold py-3.5 px-8 rounded-xl hover:bg-black/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary mt-2 shadow-md w-full sm:w-auto"
      >
        Save Profile
      </button>
    </form>
  );
}
