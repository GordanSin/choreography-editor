import { useState, useCallback } from "react";
import type { ChannelId } from "@shared/schema";
import type { PadConfig, PadId } from "@/lib/constants";

export function usePadInput() {
  const [tapCounts, setTapCounts] = useState<Record<PadId, number>>({
    G: 0, G1: 0, G2: 0, G3: 0, G4: 0,
  });
  const [activeChannels, setActiveChannels] = useState<Record<ChannelId, boolean>>({
    G1: false, G2: false, G3: false, G4: false,
  });

  const isPadActive = useCallback((pad: PadConfig) => {
    return pad.id === "G"
      ? pad.channels.every((ch) => activeChannels[ch])
      : activeChannels[pad.id as ChannelId];
  }, [activeChannels]);

  const activatePad = useCallback((pad: PadConfig) => {
    pad.channels.forEach((ch) =>
      setActiveChannels((prev) => ({ ...prev, [ch]: true }))
    );
    setTapCounts((prev) => ({ ...prev, [pad.id]: (prev[pad.id] || 0) + 1 }));
  }, []);

  const deactivatePad = useCallback((pad: PadConfig) => {
    pad.channels.forEach((ch) =>
      setActiveChannels((prev) => ({ ...prev, [ch]: false }))
    );
  }, []);

  const handlePadDown = useCallback((pad: PadConfig, onRecord?: (channels: ChannelId[]) => void) => {
    activatePad(pad);
    if (onRecord) {
      onRecord(pad.channels);
    }
    setTimeout(() => deactivatePad(pad), 150);
  }, [activatePad, deactivatePad]);

  return {
    tapCounts,
    activeChannels,
    isPadActive,
    handlePadDown,
    deactivatePad,
  };
}
