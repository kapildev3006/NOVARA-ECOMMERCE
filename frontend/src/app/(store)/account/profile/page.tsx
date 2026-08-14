"use client";

import { useEffect, useState } from "react";
import { Profile, ProfileForm } from "@/components/account/ProfileForm";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("novara-profile");
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
     
    setIsHydrated(true);
  }, []);

  const handleSave = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    localStorage.setItem("novara-profile", JSON.stringify(updatedProfile));
  };

  if (!isHydrated) {
    return (
      <div className="animate-pulse space-y-6 max-w-xl">
        <div className="h-8 w-48 bg-black/5 rounded mb-8" />
        <div className="h-12 w-full bg-black/5 rounded-xl" />
        <div className="h-12 w-full bg-black/5 rounded-xl" />
        <div className="h-12 w-full bg-black/5 rounded-xl" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold mb-1">Personal Information</h2>
      <p className="text-muted mb-8 text-sm">Update your personal details below. Note: This data is stored locally.</p>
      
      <div className="bg-surface border border-black/5 rounded-2xl p-6 sm:p-8">
        <ProfileForm initialData={profile} onSave={handleSave} />
      </div>
    </div>
  );
}
