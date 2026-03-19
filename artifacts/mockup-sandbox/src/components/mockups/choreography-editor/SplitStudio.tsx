import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipBack, SkipForward, Circle, 
  Settings, Save, Volume2, Maximize2, 
  ChevronLeft, Mic, Clock, Download
} from 'lucide-react';

export function SplitStudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  const channels = [
    { id: 'G1', color: 'hsl(300 100% 50%)', name: 'G1', markers: [10, 25, 40, 65, 80] },
    { id: 'G2', color: 'hsl(170 100% 50%)', name: 'G2', markers: [15, 30, 45, 60] },
    { id: 'G3', color: 'hsl(30 100% 50%)', name: 'G3', markers: [5, 20, 35, 50, 75, 90] },
    { id: 'G4', color: 'hsl(270 100% 65%)', name: 'G4', markers: [12, 28, 42, 58, 85] }
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col md:flex-row font-sans overflow-hidden select-none" style={{ height: '100vh', maxHeight: '100vh' }}>
      
      {/* LEFT PANEL: Video & Transport */}
      <div className="flex-1 flex flex-col border-r border-[#2A2A2A] bg-[#1A1A1A] relative">
        {/* Top Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#2A2A2A] bg-[#151515]">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-gray-200 tracking-wide">LABUĐE JEZERO - FINALE</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">Projekt Spremljen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-gray-400">
              <Download size={18} />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400">
              <Settings size={18} />
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black relative group">
          <div className="w-full aspect-video bg-[#0A0A0A] rounded-md border border-[#222] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
            <Play className="text-white/20 w-24 h-24 absolute z-0" strokeWidth={1} />
            
            {/* YouTube Style Overlay Progress */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-white drop-shadow-md font-mono">
                <span>01:24.3</span>
                <span className="text-white/50">/ 03:45.0</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full cursor-pointer relative overflow-hidden group/bar">
                <div className="absolute inset-y-0 left-0 bg-red-600 w-[35%] rounded-full"></div>
                <div className="absolute inset-y-0 left-[35%] w-3 h-3 bg-red-600 rounded-full scale-0 group-hover/bar:scale-100 transition-transform -translate-x-1.5 -translate-y-0.5"></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center gap-4">
                  <Play size={18} fill="white" className="cursor-pointer" />
                  <Volume2 size={18} className="cursor-pointer" />
                  <span className="text-xs">0.75x</span>
                </div>
                <Maximize2 size={18} className="cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Master Transport & Big Button */}
        <div className="p-6 bg-[#151515] border-t border-[#2A2A2A] flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="bg-[#222] border-[#333] hover:bg-[#333] text-white">
                <SkipBack size={18} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="w-14 h-14 rounded-full bg-white hover:bg-gray-200 border-none text-black"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </Button>
              <Button variant="outline" size="icon" className="bg-[#222] border-[#333] hover:bg-[#333] text-white">
                <SkipForward size={18} />
              </Button>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="font-mono text-3xl font-light text-white tracking-wider">01:24<span className="text-gray-500 text-xl">.300</span></div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>BRZINA: 1.0x</span>
                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                <span>BPM: 124</span>
              </div>
            </div>
          </div>

          <Button className="w-full h-16 bg-red-600 hover:bg-red-700 text-white font-bold tracking-widest text-lg rounded-xl flex gap-3 shadow-[0_0_20px_rgba(220,38,38,0.3)] border border-red-500/50 transition-all active:scale-[0.98]">
            <Circle size={16} fill="currentColor" className="animate-pulse" />
            SNIMANJE (MASTER G)
          </Button>
        </div>
      </div>

      {/* RIGHT PANEL: Timeline & Studio Controls */}
      <div className="flex-[1.2] flex flex-col bg-[#111] relative overflow-hidden">
        {/* Studio Toolbar */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-[#2A2A2A] bg-[#151515]">
          <div className="flex gap-4 text-sm font-medium">
            <button className="text-white border-b-2 border-white pb-1">TIMELINE</button>
            <button className="text-gray-500 hover:text-gray-300 pb-1">PADS</button>
            <button className="text-gray-500 hover:text-gray-300 pb-1">EFEKTI</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="bg-transparent border-[#333] text-xs h-8 text-gray-300">
              <Mic size={14} className="mr-2" />
              OTKRIJ BEAT
            </Button>
            <Button variant="outline" size="sm" className="bg-transparent border-[#333] text-xs h-8 text-gray-300">
              <Clock size={14} className="mr-2" />
              SINKRONIZIRAJ
            </Button>
          </div>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar relative">
          
          {/* Timeline Header (Ruler) */}
          <div className="flex mb-2 ml-16 mr-[80px]">
            <div className="flex-1 h-6 relative border-b border-[#333]">
              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => (
                <div key={tick} className="absolute top-0 bottom-0 border-l border-[#333]" style={{ left: `${tick}%` }}>
                  <span className="absolute -left-2 -top-1 text-[9px] text-gray-500 font-mono">
                    0{Math.floor(tick / 60)}:{(tick % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))}
              {/* Playhead */}
              <div className="absolute top-0 bottom-[-400px] w-px bg-red-500 z-20" style={{ left: '35%' }}>
                <div className="absolute -top-1 -left-[5px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500"></div>
              </div>
            </div>
          </div>

          {/* Tracks Stack */}
          <div className="flex flex-col gap-3 flex-1 relative z-10">
            {channels.map((ch, idx) => (
              <div key={ch.id} className="group flex h-20 bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] hover:border-[#444] transition-colors relative overflow-hidden">
                {/* Track Header */}
                <div className="w-16 flex flex-col items-center justify-center border-r border-[#2A2A2A] bg-[#151515] shrink-0">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] text-black"
                    style={{ backgroundColor: ch.color }}
                  >
                    {ch.name}
                  </div>
                  <div className="flex gap-1 mt-2 text-[#555]">
                    <Button variant="ghost" size="icon" className="w-5 h-5 hover:text-white p-0"><Volume2 size={10} /></Button>
                    <Button variant="ghost" size="icon" className="w-5 h-5 hover:text-white p-0"><Settings size={10} /></Button>
                  </div>
                </div>

                {/* Track Timeline Area */}
                <div className="flex-1 relative bg-[#0D0D0D] overflow-hidden">
                  {/* Grid Lines */}
                  {[20, 40, 60, 80].map(line => (
                    <div key={line} className="absolute top-0 bottom-0 border-l border-[#222] w-px" style={{ left: `${line}%` }}></div>
                  ))}
                  
                  {/* Waveform placeholder */}
                  <div className="absolute inset-0 opacity-20 flex items-center">
                    <div className="w-full h-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjIwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0wIDEwIFExMCAwIDIwIDEwIFQ0MCAxMCBUNjAgMTAgVDgwIDEwIFQxMDAgMTAiIHN0cm9rZT0id2hpdGUiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')] bg-repeat-x"></div>
                  </div>

                  {/* Markers */}
                  {ch.markers.map((pos, i) => (
                    <div 
                      key={i} 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-[70%] rounded-[2px] cursor-pointer hover:brightness-125 transition-all shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                      style={{ 
                        left: `${pos}%`, 
                        backgroundColor: ch.color,
                        boxShadow: `0 0 10px ${ch.color}40`
                      }}
                    ></div>
                  ))}
                </div>

                {/* Track Pad (Right Edge) */}
                <div className="w-[80px] shrink-0 border-l border-[#2A2A2A] bg-[#151515] p-2 flex items-center justify-center">
                  <Button 
                    className="w-full h-full rounded-md font-bold text-black text-sm active:scale-95 transition-transform"
                    style={{ 
                      backgroundColor: ch.color,
                      boxShadow: `0 0 15px ${ch.color}60`
                    }}
                  >
                    TAP
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>

    </div>
  );
}
