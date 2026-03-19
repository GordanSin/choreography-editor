import React, { useState } from "react";
import { Play, Pause, Square, SkipBack, Circle, Settings, ChevronLeft, Volume2, Maximize2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function TrackPads() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activePads, setActivePads] = useState<string[]>([]);
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({
    G: 0, G1: 0, G2: 0, G3: 0, G4: 0
  });

  const channels = [
    { id: "G1", color: "hsl(300, 100%, 50%)" },
    { id: "G2", color: "hsl(170, 100%, 50%)" },
    { id: "G3", color: "hsl(30, 100%, 50%)" },
    { id: "G4", color: "hsl(270, 100%, 65%)" },
  ];

  const pads = [
    { id: "G", label: "G", sublabel: "SVE GRUPE", color: "#ffffff", channels: ["G1", "G2", "G3", "G4"] },
    { id: "G1", label: "G1", sublabel: "Grupa 1", color: "hsl(300, 100%, 50%)", channels: ["G1"] },
    { id: "G2", label: "G2", sublabel: "Grupa 2", color: "hsl(170, 100%, 50%)", channels: ["G2"] },
    { id: "G3", label: "G3", sublabel: "Grupa 3", color: "hsl(30, 100%, 50%)", channels: ["G3"] },
    { id: "G4", label: "G4", sublabel: "Grupa 4", color: "hsl(270, 100%, 65%)", channels: ["G4"] },
  ];

  const handlePadDown = (pad: typeof pads[0]) => {
    setActivePads(prev => [...new Set([...prev, ...pad.channels])]);
    setTapCounts(prev => ({ ...prev, [pad.id]: (prev[pad.id] || 0) + 1 }));
  };

  const handlePadUp = (pad: typeof pads[0]) => {
    setActivePads(prev => prev.filter(p => !pad.channels.includes(p)));
  };

  const isActive = (pad: typeof pads[0]) =>
    pad.channels.every(ch => activePads.includes(ch)) ||
    (pad.id !== "G" && activePads.includes(pad.id));

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-bold leading-tight">Olimpijska Rutina 2024</h1>
            <p className="text-[10px] text-zinc-500">Slobodni sastav - Finale</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 h-8 text-xs">
            SINKRONIZIRAJ
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">

        {/* Top Section: Video + Status */}
        <div className="flex gap-3 h-[200px] shrink-0">
          {/* Video Player */}
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video h-full border border-white/10 shadow-lg">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-zinc-900">
                <button
                  className="rounded-full bg-white/10 hover:bg-white/20 h-14 w-14 flex items-center justify-center transition-colors"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-0.5" />}
                </button>
              </div>
              <div className="h-7 bg-zinc-950/80 px-3 flex items-center justify-between text-xs font-mono">
                <span>01:24.50</span>
                <div className="flex gap-2">
                  <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
                  <Maximize2 className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex-1 bg-[#1a1a1a] rounded-lg border border-white/10 p-3 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/50 p-2 rounded">
                <span className="block text-[10px] text-zinc-500 mb-0.5">Ukupno</span>
                <span className="text-lg font-mono">03:45</span>
              </div>
              <div className="bg-black/50 p-2 rounded">
                <span className="block text-[10px] text-zinc-500 mb-0.5">Markeri</span>
                <span className="text-lg font-mono">142</span>
              </div>
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs" variant="default">
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              Otkrij Beat
            </Button>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden">
          {/* Time Ruler */}
          <div className="flex items-end h-7 border-b border-white/10 bg-zinc-900/50">
            <div className="w-12 shrink-0 border-r border-white/10 h-full" />
            <div className="flex-1 relative h-full">
              <div className="absolute inset-0 text-[9px] text-zinc-500 font-mono">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="absolute border-l border-zinc-700 h-2 bottom-0" style={{ left: `${i * 10}%` }}>
                    <span className="absolute -top-4 -left-2">01:{20 + i}</span>
                  </div>
                ))}
              </div>
              <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{ left: "45%" }}>
                <div className="w-2 h-2 bg-red-500 rounded-sm -ml-1 -mt-0.5 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              </div>
            </div>
          </div>

          {/* Channel Tracks */}
          <div className="flex-1 flex flex-col">
            {channels.map((channel, i) => (
              <div key={channel.id} className="flex-1 flex border-b border-white/5 relative min-h-[52px]">
                {/* Channel label */}
                <div
                  className="w-12 shrink-0 border-r border-white/10 bg-zinc-900 flex items-center justify-center"
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: channel.color }}
                  >
                    {channel.id}
                  </span>
                </div>

                {/* Track */}
                <div className="flex-1 bg-zinc-950 relative overflow-hidden">
                  {[...Array(20)].map((_, j) => (
                    <div key={j} className="absolute top-0 bottom-0 w-px bg-white/[0.025]" style={{ left: `${j * 5}%` }} />
                  ))}
                  <div className="absolute top-0 bottom-0 w-px bg-red-500/40 z-10" style={{ left: "45%" }} />
                  {i === 0 && <>
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '10%', width: '5%', backgroundColor: channel.color }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '18%', width: '2%', backgroundColor: channel.color }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '35%', width: '8%', backgroundColor: channel.color }} />
                  </>}
                  {i === 1 && <>
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '12%', width: '3%', backgroundColor: channel.color }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '25%', width: '10%', backgroundColor: channel.color }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '42%', width: '4%', backgroundColor: channel.color }} />
                  </>}
                  {i === 2 && <>
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '5%', width: '15%', backgroundColor: channel.color }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '30%', width: '5%', backgroundColor: channel.color }} />
                  </>}
                  {i === 3 && <>
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '15%', width: '6%', backgroundColor: channel.color }} />
                    <div className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sm opacity-80" style={{ left: '40%', width: '12%', backgroundColor: channel.color }} />
                  </>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 5 PAD BUTTONS IN A ROW ─── */}
        <div className="shrink-0 flex gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg p-2">
          {pads.map(pad => {
            const active = isActive(pad);
            const isG = pad.id === "G";
            return (
              <div key={pad.id} className="flex-1 flex flex-col items-center gap-1">
                <button
                  className="w-full rounded-lg font-bold transition-all duration-75 active:scale-95 flex flex-col items-center justify-center gap-0.5 border"
                  style={{
                    height: isG ? "56px" : "52px",
                    backgroundColor: active
                      ? (isG ? "#ffffff" : pad.color)
                      : `${isG ? "rgba(255,255,255,0.08)" : pad.color + "22"}`,
                    borderColor: isG ? "rgba(255,255,255,0.4)" : pad.color,
                    color: active ? (isG ? "#000" : "#000") : (isG ? "#fff" : pad.color),
                    boxShadow: active ? `0 0 18px ${isG ? "rgba(255,255,255,0.4)" : pad.color + "90"}` : "none",
                  }}
                  onPointerDown={() => handlePadDown(pad)}
                  onPointerUp={() => handlePadUp(pad)}
                  onPointerLeave={() => handlePadUp(pad)}
                >
                  <span className={`font-black leading-none ${isG ? "text-xl" : "text-lg"}`}>{pad.label}</span>
                  {isG && (
                    <span className="text-[8px] uppercase tracking-widest font-medium opacity-70 leading-none">
                      SVE GRUPE
                    </span>
                  )}
                </button>
                {/* Tap count */}
                <span
                  className="text-xs font-mono font-bold tabular-nums"
                  style={{ color: tapCounts[pad.id] > 0 ? pad.color : "rgba(255,255,255,0.2)" }}
                >
                  {tapCounts[pad.id]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Transport Controls */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 border-white/20 bg-black/50 hover:bg-white/10">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 border-white/20 bg-black/50 hover:bg-white/10">
              <Square className="h-4 w-4" />
            </Button>
            <button
              className="h-9 w-11 rounded-md flex items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              className={`h-9 px-3 rounded-md flex items-center gap-1.5 font-bold text-sm border-2 transition-all ${
                isRecording
                  ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse"
                  : "border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400"
              }`}
              onClick={() => setIsRecording(!isRecording)}
            >
              <Circle className="h-3 w-3 fill-current" />
              REC
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 px-4">
            <span className="text-[10px] text-zinc-500 whitespace-nowrap">Brzina</span>
            <Slider defaultValue={[100]} max={200} step={10} className="flex-1" />
            <span className="text-[10px] text-zinc-400 font-mono w-7">1.0x</span>
          </div>

          <div className="font-mono text-base bg-black/50 px-3 py-1.5 rounded border border-white/5">
            <span className="text-white">01:24</span>
            <span className="text-zinc-500">.50</span>
          </div>
        </div>

      </div>
    </div>
  );
}
