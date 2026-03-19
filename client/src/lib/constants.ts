import type { ChannelId } from "@shared/schema";

export const CHANNEL_COLORS: Record<ChannelId, string> = {
  G1: "hsl(300, 100%, 50%)",
  G2: "hsl(170, 100%, 50%)",
  G3: "hsl(30, 100%, 50%)",
  G4: "hsl(270, 100%, 65%)",
};

export const CHANNELS: ChannelId[] = ["G1", "G2", "G3", "G4"];

export const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0] as const;

export type PadId = "G" | ChannelId;

export interface PadConfig {
  id: PadId;
  label: string;
  sublabel?: string;
  color: string;
  channels: ChannelId[];
}

export const PADS: PadConfig[] = [
  { id: "G", label: "G", sublabel: "SVE GRUPE", color: "#ffffff", channels: ["G1", "G2", "G3", "G4"] },
  { id: "G1", label: "G1", color: CHANNEL_COLORS.G1, channels: ["G1"] },
  { id: "G2", label: "G2", color: CHANNEL_COLORS.G2, channels: ["G2"] },
  { id: "G3", label: "G3", color: CHANNEL_COLORS.G3, channels: ["G3"] },
  { id: "G4", label: "G4", color: CHANNEL_COLORS.G4, channels: ["G4"] },
];
