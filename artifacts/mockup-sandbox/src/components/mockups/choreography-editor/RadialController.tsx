import React, { useState, useEffect } from "react";
import { Play, Pause, Disc3, Settings2, SkipBack, CircleDot, Activity, Clock, SlidersHorizontal, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export function RadialController() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [speed, setSpeed] = useState([1]);
  const [activePads, setActivePads] = useState<Record<string, boolean>>({});

  const duration = 120; // 2 minutes

  // Handle pad interactions
  const handlePadDown = (pad: string) => {
    setActivePads((prev) => ({ ...prev, [pad]: true }));
  };
  
  const handlePadUp = (pad: string) => {
    setActivePads((prev) => ({ ...prev, [pad]: false }));
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTime((t) => (t >= duration ? 0 : t + 0.1));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const progressPercentage = (time / duration) * 100;

  // Mock markers
  const markers = [
    { time: 10, channel: "G1", color: "hsl(300, 100%, 50%)" },
    { time: 15, channel: "G2", color: "hsl(170, 100%, 50%)" },
    { time: 15, channel: "G3", color: "hsl(30, 100%, 50%)" },
    { time: 25, channel: "G4", color: "hsl(270, 100%, 65%)" },
    { time: 30, channel: "G1", color: "hsl(300, 100%, 50%)" },
    { time: 45, channel: "G2", color: "hsl(170, 100%, 50%)" },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans overflow-hidden selection:bg-white/20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Olimpijska Rutina 2024</h1>
          <p className="text-xs text-white/50 uppercase tracking-wider">Projekt</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            SINKRONIZIRANO
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Video Preview */}
        <div className="relative w-full aspect-video max-h-[30vh] bg-black shrink-0 border-b border-white/10 overflow-hidden group flex items-center justify-center">
          {/* Faux video content */}
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#121212] to-[#121212]"></div>
          
          <button 
            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform z-10"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-white/80" /> : <Play className="w-8 h-8 fill-white/80 ml-1" />}
          </button>
          
          <div className="absolute bottom-4 left-4 text-xs font-mono bg-black/60 px-2 py-1 rounded text-white/80">
            Kamera 1
          </div>
        </div>

        {/* Radial Controller Workspace */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#121212_100%)]">
          
          {/* Background grid/rings */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
          </div>

          <div className="w-full max-w-lg relative flex flex-col items-center">
            
            {/* The Radial Drum Machine */}
            <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px]">
              {/* Outer Ring styling */}
              <div className="absolute inset-0 rounded-full border border-white/5 bg-black/40 shadow-[0_0_50px_rgba(0,0,0,0.5)_inset]"></div>
              
              {/* G - All Groups Button (Outer Ring Rim) */}
              <button 
                onPointerDown={() => handlePadDown('G')}
                onPointerUp={() => handlePadUp('G')}
                onPointerLeave={() => handlePadUp('G')}
                className={cn(
                  "absolute -inset-4 rounded-full border-2 border-dashed border-white/20 transition-all duration-100 flex items-start justify-center pt-2",
                  activePads['G'] && "border-white/80 bg-white/5 scale-[0.98]"
                )}
              >
                <span className="text-xs font-bold tracking-widest text-white/50 bg-[#121212] px-2 rounded-full">SVE GRUPE (G)</span>
              </button>

              {/* The 4 Quadrant Pads */}
              <div className="absolute inset-4 grid grid-cols-2 grid-rows-2 gap-2 rounded-full overflow-hidden p-2 bg-white/[0.02]">
                {/* G1 */}
                <button
                  onPointerDown={() => handlePadDown('G1')}
                  onPointerUp={() => handlePadUp('G1')}
                  onPointerLeave={() => handlePadUp('G1')}
                  className={cn(
                    "relative border-r border-b border-black/40 rounded-tl-full transition-all duration-75 overflow-hidden group",
                    activePads['G1'] ? "bg-[#ff00ff]/30 shadow-[0_0_30px_#ff00ff_inset]" : "bg-[#1e1e1e] hover:bg-[#ff00ff]/10"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff00ff]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-[#ff00ff]">
                    <span className="text-2xl font-black mb-1 drop-shadow-[0_0_10px_#ff00ff]">G1</span>
                  </div>
                </button>
                
                {/* G2 */}
                <button
                  onPointerDown={() => handlePadDown('G2')}
                  onPointerUp={() => handlePadUp('G2')}
                  onPointerLeave={() => handlePadUp('G2')}
                  className={cn(
                    "relative border-l border-b border-black/40 rounded-tr-full transition-all duration-75 overflow-hidden group",
                    activePads['G2'] ? "bg-[#00ffcc]/30 shadow-[0_0_30px_#00ffcc_inset]" : "bg-[#1e1e1e] hover:bg-[#00ffcc]/10"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-bl from-[#00ffcc]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-[#00ffcc]">
                    <span className="text-2xl font-black mb-1 drop-shadow-[0_0_10px_#00ffcc]">G2</span>
                  </div>
                </button>

                {/* G3 */}
                <button
                  onPointerDown={() => handlePadDown('G3')}
                  onPointerUp={() => handlePadUp('G3')}
                  onPointerLeave={() => handlePadUp('G3')}
                  className={cn(
                    "relative border-r border-t border-black/40 rounded-bl-full transition-all duration-75 overflow-hidden group",
                    activePads['G3'] ? "bg-[#ff8000]/30 shadow-[0_0_30px_#ff8000_inset]" : "bg-[#1e1e1e] hover:bg-[#ff8000]/10"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#ff8000]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-[#ff8000]">
                    <span className="text-2xl font-black mb-1 drop-shadow-[0_0_10px_#ff8000]">G3</span>
                  </div>
                </button>

                {/* G4 */}
                <button
                  onPointerDown={() => handlePadDown('G4')}
                  onPointerUp={() => handlePadUp('G4')}
                  onPointerLeave={() => handlePadUp('G4')}
                  className={cn(
                    "relative border-l border-t border-black/40 rounded-br-full transition-all duration-75 overflow-hidden group",
                    activePads['G4'] ? "bg-[#b24cff]/30 shadow-[0_0_30px_#b24cff_inset]" : "bg-[#1e1e1e] hover:bg-[#b24cff]/10"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-tl from-[#b24cff]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-[#b24cff]">
                    <span className="text-2xl font-black mb-1 drop-shadow-[0_0_10px_#b24cff]">G4</span>
                  </div>
                </button>
              </div>

              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 md:w-40 md:h-40 bg-[#121212] rounded-full shadow-[0_0_30px_rgba(0,0,0,0.8),_0_0_0_4px_rgba(255,255,255,0.05)] border border-white/10 flex flex-col items-center justify-center z-20">
                {/* SVG Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="46" 
                    fill="none" 
                    stroke="url(#progressGradient)" 
                    strokeWidth="4" 
                    strokeDasharray="289.026"
                    strokeDashoffset={289.026 - (289.026 * progressPercentage) / 100}
                    className="transition-all duration-100 ease-linear"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fff" />
                      <stop offset="100%" stopColor="#888" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="text-2xl md:text-3xl font-mono font-light tracking-tighter">
                  {formatTime(time)}
                </div>
                
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="mt-2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-1" />}
                </button>
              </div>
            </div>
            
            {/* Record Control placed uniquely below the radial */}
            <div className="mt-10 flex items-center justify-center gap-6">
              <button 
                onClick={() => setIsRecording(!isRecording)}
                className={cn(
                  "flex items-center gap-2 px-8 py-4 rounded-full font-bold tracking-widest text-sm transition-all shadow-lg",
                  isRecording 
                    ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse" 
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                )}
              >
                <CircleDot className={cn("w-5 h-5", isRecording ? "fill-white" : "")} />
                {isRecording ? "SNIMANJE U TIJEKU" : "ZAPOČNI SNIMANJE"}
              </button>
            </div>
          </div>
        </div>

        {/* Linear Overview Timeline */}
        <div className="h-32 bg-[#0a0a0a] border-t border-white/10 p-4 flex flex-col shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> 
              Pregled Trake
            </span>
            <div className="flex items-center gap-4 text-xs text-white/50">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3 h-3" />
                Brzina
                <Slider defaultValue={[1]} max={2} step={0.1} className="w-20" />
              </div>
              <button className="hover:text-white transition-colors">Otkrij Beat</button>
            </div>
          </div>
          
          <div className="flex-1 relative bg-[#121212] rounded-lg border border-white/5 overflow-hidden">
            {/* Playhead */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-white z-20 shadow-[0_0_10px_white]"
              style={{ left: `${progressPercentage}%` }}
            >
              <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-sm rotate-45"></div>
            </div>

            {/* Background grid */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex-1 border-r border-white/5 last:border-0 h-full"></div>
              ))}
            </div>

            {/* Channels */}
            <div className="absolute inset-0 flex flex-col justify-around py-1">
              {['G1', 'G2', 'G3', 'G4'].map((channel) => (
                <div key={channel} className="h-4 relative group">
                  <div className="absolute inset-0 bg-white/5 rounded-full mx-2"></div>
                  {/* Render markers for this channel */}
                  {markers.filter(m => m.channel === channel).map((marker, i) => (
                    <div 
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-lg transition-transform hover:scale-150 cursor-pointer"
                      style={{ 
                        left: `${(marker.time / duration) * 100}%`,
                        backgroundColor: marker.color,
                        boxShadow: `0 0 10px ${marker.color}`
                      }}
                    ></div>
                  ))}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[8px] font-bold text-white/30 group-hover:text-white/80">{channel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
