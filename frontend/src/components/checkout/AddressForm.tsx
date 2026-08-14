"use client";

import { useState } from "react";
import { Address } from "@/types/address";
import { cn } from "@/lib/utils";

interface AddressFormProps {
  initialData?: Address;
  onSave: (address: Address) => void;
  onCancel: () => void;
}

type AddressErrors = Partial<Record<keyof Address, string>>;

export function AddressForm({ initialData, onSave, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState<Address>(() =>
    initialData || {
      id: `addr-${Date.now()}`,
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      landmark: "",
      type: "Home",
    }
  );

  const [errors, setErrors] = useState<AddressErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name as keyof Address]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: AddressErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) newErrors.phone = "Enter a valid 10-digit phone number";
    
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Address line 1 is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={cn("h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all", errors.fullName ? "border-red-500" : "border-black/10")}
            placeholder="John Doe"
          />
          {errors.fullName && <span className="text-xs text-red-500">{errors.fullName}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={cn("h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all", errors.phone ? "border-red-500" : "border-black/10")}
            placeholder="9876543210"
          />
          {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">Address Line 1 *</label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            className={cn("h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all", errors.addressLine1 ? "border-red-500" : "border-black/10")}
            placeholder="Flat, House no., Building, Company, Apartment"
          />
          {errors.addressLine1 && <span className="text-xs text-red-500">{errors.addressLine1}</span>}
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">Address Line 2 (Optional)</label>
          <input
            type="text"
            name="addressLine2"
            value={formData.addressLine2 || ""}
            onChange={handleChange}
            className="h-12 px-4 rounded-xl border border-black/10 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
            placeholder="Area, Street, Sector, Village"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">City *</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={cn("h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all", errors.city ? "border-red-500" : "border-black/10")}
          />
          {errors.city && <span className="text-xs text-red-500">{errors.city}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">State *</label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={cn("h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all", errors.state ? "border-red-500" : "border-black/10")}
          />
          {errors.state && <span className="text-xs text-red-500">{errors.state}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Postal Code *</label>
          <input
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            className={cn("h-12 px-4 rounded-xl border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all", errors.postalCode ? "border-red-500" : "border-black/10")}
          />
          {errors.postalCode && <span className="text-xs text-red-500">{errors.postalCode}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">Landmark (Optional)</label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark || ""}
            onChange={handleChange}
            className="h-12 px-4 rounded-xl border border-black/10 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
            placeholder="E.g. near hospital"
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label className="text-sm font-semibold text-foreground">Address Type</label>
          <div className="flex gap-4">
            {["Home", "Work", "Other"].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value={type}
                  checked={formData.type === type}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className="text-sm font-medium">{type}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-black/5 mt-2">
        <button
          type="submit"
          className="bg-foreground text-background font-bold py-3 px-8 rounded-xl hover:bg-black/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        >
          Save Address
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-white border border-black/10 text-foreground font-bold py-3 px-8 rounded-xl hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
