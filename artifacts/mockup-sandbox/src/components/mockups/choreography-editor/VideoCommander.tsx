import React, { useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Maximize, Settings, Video, Mic, Volume2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoCommander() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  const channels = [
    { id: "G1", name: "Grupa 1", color: "hsl(300 100% 50%)" },
    { id: "G2", name: "Grupa 2", color: "hsl(170 100% 50%)" },
    { id: "G3", name: "Grupa 3", color: "hsl(30 100% 50%)" },
    { id: "G4", name: "Grupa 4", color: "hsl(270 100% 65%)" },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header - Subtle, floating */}
      <header className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white/90">Labuđe Jezero - Finale</h1>
            <p className="text-sm font-medium text-white/50">Sinkronizirano plivanje • Trening A</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
            <Circle className="w-3 h-3 text-red-500 fill-red-500 animate-pulse mr-2" />
            <span className="text-sm font-semibold tracking-wider">SNIMANJE</span>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Video Area (70% height) */}
      <div className="relative h-[65vh] flex flex-col">
        {/* Video Background */}
        <div className="absolute inset-0 bg-black">
          <img 
            src="/__mockup/images/swimming-pool.png" 
            alt="Swimming Pool" 
            className="w-full h-full object-cover opacity-80 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
        </div>

        {/* Video Transport Overlays (YouTube style) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex flex-col justify-end bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent pt-32">
          {/* Compressed Timeline */}
          <div className="mb-6 group cursor-pointer">
            <div className="relative h-12 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden flex flex-col">
              {/* Timeline markers per channel */}
              <div className="flex-grow relative border-b border-white/5">
                <div className="absolute left-[15%] w-1 h-full rounded-full" style={{ backgroundColor: channels[0].color, boxShadow: `0 0 10px ${channels[0].color}` }} />
                <div className="absolute left-[18%] w-1 h-full rounded-full" style={{ backgroundColor: channels[0].color, boxShadow: `0 0 10px ${channels[0].color}` }} />
                <div className="absolute left-[35%] w-1 h-full rounded-full" style={{ backgroundColor: channels[2].color, boxShadow: `0 0 10px ${channels[2].color}` }} />
                <div className="absolute left-[50%] w-1 h-full rounded-full" style={{ backgroundColor: channels[3].color, boxShadow: `0 0 10px ${channels[3].color}` }} />
                <div className="absolute left-[65%] w-1 h-full rounded-full" style={{ backgroundColor: channels[1].color, boxShadow: `0 0 10px ${channels[1].color}` }} />
                <div className="absolute left-[80%] w-1 h-full rounded-full" style={{ backgroundColor: channels[0].color, boxShadow: `0 0 10px ${channels[0].color}` }} />
                <div className="absolute left-[82%] w-1 h-full rounded-full" style={{ backgroundColor: channels[0].color, boxShadow: `0 0 10px ${channels[0].color}` }} />
              </div>
              
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 left-[45%] w-0.5 bg-white shadow-[0_0_10px_white] z-10">
                <div className="absolute -top-1 -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-white/50 mt-2 font-mono">
              <span>00:00</span>
              <span>01:15</span>
              <span>02:30</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full transition-transform hover:scale-110">
                  <SkipBack className="w-6 h-6 fill-current" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-14 h-14 text-white hover:bg-white/20 hover:text-white rounded-full transition-transform hover:scale-110"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full transition-transform hover:scale-110">
                  <SkipForward className="w-6 h-6 fill-current" />
                </Button>
              </div>

              <div className="flex items-center gap-2 font-mono text-xl">
                <span className="text-white font-medium">01:07</span>
                <span className="text-white/40">/</span>
                <span className="text-white/40">02:30</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/20">
                1.0x Brzina
              </Button>
              <Button variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/20">
                <Mic className="w-4 h-4 mr-2" /> Otkrij Beat
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                <Volume2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                <Maximize className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Glassmorphism Tap Pads (35% height) */}
      <div className="relative z-30 flex-grow px-6 pb-8 pt-4 flex flex-col justify-end bg-[#121212]">
        <div className="flex-grow flex gap-4 w-full max-w-5xl mx-auto">
          {/* Master "G" Pad */}
          <button 
            className="flex-1 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/20 backdrop-blur-xl flex flex-col items-center justify-center gap-3 transition-all hover:bg-white/15 active:scale-95 active:bg-white/30 group relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-24 h-24 rounded-full border-4 border-white/30 flex items-center justify-center bg-white/10 group-active:border-white group-active:bg-white text-white group-active:text-black transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] group-active:shadow-[0_0_50px_rgba(255,255,255,0.5)]">
              <span className="text-4xl font-bold">G</span>
            </div>
            <span className="text-base font-semibold tracking-wider text-white/70 uppercase">Sve Grupe</span>
          </button>

          {/* Individual Channel Pads */}
          {channels.map((channel) => (
            <button
              key={channel.id}
              onPointerDown={() => setActiveChannel(channel.id)}
              onPointerUp={() => setActiveChannel(null)}
              onPointerLeave={() => setActiveChannel(null)}
              className="flex-1 rounded-3xl bg-[#1a1a1a] border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 group relative overflow-hidden"
              style={{
                boxShadow: activeChannel === channel.id ? `0 0 40px ${channel.color}40, inset 0 0 20px ${channel.color}20` : 'none',
                borderColor: activeChannel === channel.id ? channel.color : 'rgba(255,255,255,0.1)'
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-active:opacity-20 transition-opacity duration-75"
                style={{ backgroundColor: channel.color }}
              ></div>

              <div 
                className="w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-75 z-10"
                style={{ 
                  borderColor: channel.color,
                  backgroundColor: activeChannel === channel.id ? channel.color : 'transparent',
                  color: activeChannel === channel.id ? '#000' : '#fff',
                  boxShadow: activeChannel === channel.id ? `0 0 30px ${channel.color}` : 'none'
                }}
              >
                <span className="text-3xl font-bold">{channel.id}</span>
              </div>
              <span className="text-sm font-semibold tracking-widest text-white/50 uppercase z-10">{channel.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
