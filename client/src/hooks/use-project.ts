import { useState, useEffect, useCallback } from "react";
import type { ClientMarker } from "@/lib/types";
import { useToast } from "./use-toast";

interface ProjectState {
  projectId: string | null;
  currentTrack: string;
  markers: ClientMarker[];
  isLoading: boolean;
}

export function useProject() {
  const { toast } = useToast();
  const [state, setState] = useState<ProjectState>({
    projectId: null,
    currentTrack: "Bez naslova",
    markers: [],
    isLoading: true,
  });

  const setProjectId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, projectId: id }));
  }, []);

  const setCurrentTrack = useCallback((track: string) => {
    setState((prev) => ({ ...prev, currentTrack: track }));
  }, []);

  const setMarkers = useCallback((updater: ClientMarker[] | ((prev: ClientMarker[]) => ClientMarker[])) => {
    setState((prev) => ({
      ...prev,
      markers: typeof updater === "function" ? updater(prev.markers) : updater,
    }));
  }, []);

  const loadProject = useCallback(async (skipTrackIfSaved: boolean) => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const projects = await res.json();
      if (projects.length > 0) {
        const proj = projects[0];
        setState((prev) => ({
          ...prev,
          projectId: proj.id,
          currentTrack: skipTrackIfSaved ? prev.currentTrack : proj.audioFileName,
        }));
        const markersRes = await fetch(`/api/projects/${proj.id}/markers`);
        if (!markersRes.ok) throw new Error("Failed to fetch markers");
        const loadedMarkers = await markersRes.json();
        setState((prev) => ({
          ...prev,
          markers: loadedMarkers,
          isLoading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      toast({ title: "Greška", description: "Nije moguće učitati projekt.", variant: "destructive" });
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  const createMarkerOnServer = useCallback(async (marker: Omit<ClientMarker, "id">): Promise<ClientMarker | null> => {
    try {
      const res = await fetch("/api/markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(marker),
      });
      if (!res.ok) throw new Error("Failed to create marker");
      return await res.json();
    } catch (err) {
      console.error("Failed to create marker:", err);
      toast({ title: "Greška", description: "Nije moguće spremiti marker.", variant: "destructive" });
      return null;
    }
  }, [toast]);

  const updateMarkerOnServer = useCallback(async (id: string, updates: Partial<ClientMarker>): Promise<void> => {
    try {
      const res = await fetch(`/api/markers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update marker");
    } catch (err) {
      console.error("Failed to update marker:", err);
      toast({ title: "Greška", description: "Nije moguće ažurirati marker.", variant: "destructive" });
    }
  }, [toast]);

  const ensureProject = useCallback(async (fileName: string, duration: number): Promise<string | null> => {
    try {
      if (state.projectId) {
        const res = await fetch(`/api/projects/${state.projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioFileName: fileName, duration }),
        });
        if (!res.ok) throw new Error("Failed to update project");
        return state.projectId;
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fileName.replace(/\.[^/.]+$/, ""),
            audioFileName: fileName,
            duration,
          }),
        });
        if (!res.ok) throw new Error("Failed to create project");
        const proj = await res.json();
        setProjectId(proj.id);
        return proj.id;
      }
    } catch (err) {
      console.error("Failed to ensure project:", err);
      toast({ title: "Greška", description: "Nije moguće spremiti projekt.", variant: "destructive" });
      return null;
    }
  }, [state.projectId, setProjectId, toast]);

  return {
    ...state,
    setProjectId,
    setCurrentTrack,
    setMarkers,
    loadProject,
    createMarkerOnServer,
    updateMarkerOnServer,
    ensureProject,
  };
}
