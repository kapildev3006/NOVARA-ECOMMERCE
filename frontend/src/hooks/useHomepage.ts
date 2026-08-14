import { useState, useEffect, useCallback } from "react";
import { HomepageSection } from "@/types/homepage";
import { getHomepageSections } from "@/lib/homepage-api";
import { defaultHomepageSections } from "@/data/default-homepage";
import { getSocket } from "@/lib/socket";

export function useHomepage() {
  // We initialize with default data to avoid blank screens or layout shifts,
  // but treat it as "loading" initially until we confirm from the API
  const [data, setData] = useState<HomepageSection[]>(defaultHomepageSections);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHomepage = useCallback(async (abortController?: AbortController) => {
    setIsLoading(true);
    setError(null);
    try {
      // Execute the fetch
      const sections = await getHomepageSections();
      
      // Defensively ensure only enabled sections are shown and they are sorted correctly
      const activeSortedSections = sections
        .filter(s => s.enabled)
        .sort((a, b) => a.order - b.order);
      
      // If the component hasn't unmounted
      if (!abortController?.signal.aborted) {
        setData(activeSortedSections);
      }
    } catch (err) {
      if (!abortController?.signal.aborted) {
        console.error("Homepage API failed, falling back to local mock data:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        
        // Ensure fallback data is properly filtered and sorted
        const fallbackSections = defaultHomepageSections
          .filter(s => s.enabled)
          .sort((a, b) => a.order - b.order);
        
        setData(fallbackSections);
      }
    } finally {
      if (!abortController?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    // 1. Initial fetch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHomepage(abortController);

    // 2. Setup Socket.IO listener for real-time updates
    const socket = getSocket();
    
    // Connect lazily if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const handleHomepageUpdate = (payload?: { version: string }) => {
      console.log("Received homepage_updated event, refetching...", payload);
      // Trigger a refetch without a hard abort controller for the subsequent pulls
      fetchHomepage();
    };

    socket.on("homepage_updated", handleHomepageUpdate);

    // Cleanup on unmount
    return () => {
      abortController.abort();
      socket.off("homepage_updated", handleHomepageUpdate);
      
      // If this is the only consumer, we might disconnect, but typically 
      // the socket stays open for other global events in an SPA.
      // We just clean up the listener to avoid memory leaks.
    };
  }, [fetchHomepage]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchHomepage()
  };
}
