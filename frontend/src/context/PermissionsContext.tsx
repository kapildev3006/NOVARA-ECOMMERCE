"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_BASE_URL } from "@/lib/api-config";

export interface PermissionsContextType {
  permissions: string[];
  role: string;
  isLoading: boolean;
  can: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  role: "",
  isLoading: true,
  can: () => false,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.user) {
            setPermissions(data.data.user.permissions || []);
            setRole(data.data.user.role || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch permissions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPermissions();
  }, []);

  const can = (permission: string) => {
    if (role === "SuperAdmin") return true;
    return permissions.includes(permission);
  };

  return (
    <PermissionsContext.Provider value={{ permissions, role, isLoading, can }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
