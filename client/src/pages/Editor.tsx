import React, { useState, useRef, useEffect } from "react";
import {
  Play, Pause, Square, SkipBack, Circle,
  Settings, ChevronLeft, Activity, Wand2, Upload, ZoomIn, ZoomOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type ChannelId = "G1" | "G2" | "G3" | "G4";

interface Marker {
  id: string;
  time: number;
  duration: number;
  channel: ChannelId;
  intensity: number;
  pattern: "steady" | "staccato" | "heartbeat";
}

const CHANNEL_COLORS: Record<ChannelId, string> = {
  G1: "hsl(300, 100%, 50%)",
  G2: "hsl(170, 100%, 50%)",
  G3: "hsl(30, 100%, 50%)",
  G4: "hsl(270, 100%, 65%)",
};

const TOTAL_DURATION = 180;
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0];

const pads = [
  { id: "G" as const, label: "G", sublabel: "SVE GRUPE", color: "#ffffff", channels: ["G1", "G2", "G3", "G4"] as ChannelId[] },
  { id: "G1" as const, label: "G1", color: CHANNEL_COLORS.G1, channels: ["G1"] as ChannelId[] },
  { id: "G2" as const, label: "G2", color: CHANNEL_COLORS.G2, channels: ["G2"] as ChannelId[] },
  { id: "G3" as const, label: "G3", color: CHANNEL_COLORS.G3, channels: ["G3"] as ChannelId[] },
  { id: "G4" as const, label: "G4", color: CHANNEL_COLORS.G4, channels: ["G4"] as ChannelId[] },
];

const TimelineMarker = ({
  marker,
  pixelsPerSecond,
  onUpdate,
}: {
  marker: Marker;
  pixelsPerSecond: number;
  onUpdate: (updated: Marker) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const width = Math.max(8, marker.duration * pixelsPerSecond);
  const left = marker.time * pixelsPerSecond;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="absolute top-1 bottom-1 rounded-sm cursor-pointer hover:brightness-125 transition-all border border-white/20"
          style={{
            left: `${left}px`,
            width: `${width}px`,
            backgroundColor: CHANNEL_COLORS[marker.channel],
            opacity: marker.intensity / 100,
          }}
          data-testid={`marker-${marker.id}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-[#1a1a1a] border-white/10 text-zinc-100 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Postavke Vibracije</h4>
            <span className="text-xs font-bold" style={{ color: CHANNEL_COLORS[marker.channel] }}>
              {marker.channel}
            </span>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Intenzitet ({marker.intensity}%)</Label>
            <Slider
              value={[marker.intensity]}
              max={100}
              step={1}
              onValueChange={(v) => onUpdate({ ...marker, intensity: v[0] })}
              className="py-2"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400">Uzorak</Label>
            <RadioGroup
              value={marker.pattern}
              onValueChange={(v: any) => onUpdate({ ...marker, pattern: v })}
              className="flex gap-2"
            >
              {[["steady", "Stalno"], ["staccato", "Staccato"], ["heartbeat", "Srce"]].map(([val, lbl]) => (
                <div key={val} className="flex items-center space-x-1">
                  <RadioGroupItem value={val} id={val} />
                  <Label htmlFor={val} className="text-xs">{lbl}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function ChoreographyEditor() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isAudioSetupRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState("Bez naslova");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [tempo, setTempo] = useState(1.0);
  const [hasVideo, setHasVideo] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({ G: 0, G1: 0, G2: 0, G3: 0, G4: 0 });
  const [activeChannels, setActiveChannels] = useState<Record<ChannelId, boolean>>({
    G1: false, G2: false, G3: false, G4: false,
  });
  const [markers, setMarkers] = useState<Marker[]>([
    { id: "1", time: 2.5, duration: 1, channel: "G1", intensity: 80, pattern: "steady" },
    { id: "2", time: 4.0, duration: 0.5, channel: "G2", intensity: 60, pattern: "staccato" },
    { id: "3", time: 5.5, duration: 2, channel: "G3", intensity: 90, pattern: "steady" },
    { id: "4", time: 8.0, duration: 0.2, channel: "G4", intensity: 100, pattern: "heartbeat" },
    { id: "5", time: 10.0, duration: 1.5, channel: "G1", intensity: 70, pattern: "steady" },
  ]);

  useEffect(() => {
    const savedVideoSrc = sessionStorage.getItem("videoSrc");
    const savedVideoName = sessionStorage.getItem("videoName");
    if (savedVideoSrc && savedVideoName) {
      setVideoSrc(savedVideoSrc);
      setCurrentTrack(savedVideoName);
      setHasVideo(savedVideoName.endsWith(".mp4") || savedVideoName.endsWith(".webm"));
    }
    const loadProject = async () => {
      try {
        const res = await fetch("/api/projects");
        const projects = await res.json();
        if (projects.length > 0) {
          const proj = projects[0];
          setProjectId(proj.id);
          if (!savedVideoName) setCurrentTrack(proj.audioFileName);
          const markersRes = await fetch(`/api/projects/${proj.id}/markers`);
          const loadedMarkers = await markersRes.json();
          setMarkers(loadedMarkers.map((m: any) => ({
            ...m,
            time: parseFloat(m.time),
            duration: parseFloat(m.duration),
          })));
        }
      } catch (err) {
        console.error("Failed to load project:", err);
      }
    };
    loadProject();
  }, []);

  useEffect(() => {
    const media = hasVideo ? videoRef.current : audioRef.current;
    if (!media) return;
    if (isPlaying) {
      if (!hasVideo) setupAudioContext();
      media.playbackRate = tempo;
      media.play().catch((err) => console.error("Playback error:", err));
    } else {
      media.pause();
    }
  }, [isPlaying, tempo, hasVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => { setCurrentTime(video.currentTime); if (video.ended) setIsPlaying(false); };
    const handleMeta = () => setDuration(video.duration);
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", handleMeta);
    video.addEventListener("durationchange", handleMeta);
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", handleMeta);
      video.removeEventListener("durationchange", handleMeta);
    };
  }, [hasVideo]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => { setCurrentTime(audio.currentTime); if (audio.currentTime >= audio.duration) setIsPlaying(false); };
    const handleMeta = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleMeta);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleMeta);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      if (analyserRef.current && isPlaying) {
        const d = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(d);
      }
      rafIdRef.current = requestAnimationFrame(update);
    };
    if (isPlaying) {
      if (contextRef.current?.state === "suspended") contextRef.current.resume();
      update();
    }
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, [isPlaying]);

  const setupAudioContext = () => {
    if (!audioRef.current || isAudioSetupRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.7;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      contextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      isAudioSetupRef.current = true;
    } catch (e) {
      console.error("Web Audio API setup failed:", e);
    }
  };

  const detectBeats = async () => {
    if (!audioRef.current?.src) {
      toast({ title: "Nema Zvuka", description: "Molim prvo učitajte MP3 datoteku.", variant: "destructive" });
      return;
    }
    toast({ title: "Otkrivam Beatove", description: "Analiziram ritam glazbe..." });
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const offlineCtx = new AudioContextClass();
      const response = await fetch(audioRef.current.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const windowSize = Math.floor(sampleRate * 0.05);
      const hopSize = Math.floor(windowSize / 2);
      const energyThreshold = 0.15;
      const minBeatInterval = 0.2;
      const energies: number[] = [];
      for (let i = 0; i < rawData.length - windowSize; i += hopSize) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) energy += rawData[i + j] * rawData[i + j];
        energies.push(energy / windowSize);
      }
      const maxEnergy = Math.max(...energies);
      const normalizedEnergies = energies.map((e) => e / maxEnergy);
      const detectedBeats: number[] = [];
      let lastBeatTime = -minBeatInterval;
      for (let i = 1; i < normalizedEnergies.length - 1; i++) {
        const time = (i * hopSize) / sampleRate;
        const current = normalizedEnergies[i];
        if (current > normalizedEnergies[i - 1] && current > normalizedEnergies[i + 1] && current > energyThreshold && time - lastBeatTime >= minBeatInterval) {
          detectedBeats.push(time);
          lastBeatTime = time;
        }
      }
      const channels: ChannelId[] = ["G1", "G2", "G3", "G4"];
      const newMarkers: Marker[] = detectedBeats.map((time, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        time,
        duration: 0.3,
        channel: channels[index % 4],
        intensity: 80,
        pattern: "steady" as const,
      }));
      setMarkers((prev) => [...prev, ...newMarkers]);
      if (projectId) {
        for (const marker of newMarkers) {
          try {
            await fetch("/api/markers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, time: marker.time.toString(), duration: marker.duration.toString(), channel: marker.channel, intensity: marker.intensity, pattern: marker.pattern }) });
          } catch { }
        }
      }
      toast({ title: "Beatovi Otkriveni!", description: `Pronađeno ${detectedBeats.length} beatova.` });
      offlineCtx.close();
    } catch {
      toast({ title: "Otkrivanje Nije Uspjelo", description: "Nije moguće analizirati zvuk.", variant: "destructive" });
    }
  };

  const updateMarker = async (updated: Marker) => {
    setMarkers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    try {
      await fetch(`/api/markers/${updated.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ intensity: updated.intensity, pattern: updated.pattern }) });
    } catch { }
  };

  const isPadActive = (pad: typeof pads[0]) =>
    pad.id === "G"
      ? pad.channels.every((ch) => activeChannels[ch as ChannelId])
      : activeChannels[pad.id as ChannelId];

  const handlePadDown = async (pad: typeof pads[0]) => {
    pad.channels.forEach((ch) => setActiveChannels((prev) => ({ ...prev, [ch]: true })));
    setTapCounts((prev) => ({ ...prev, [pad.id]: (prev[pad.id] || 0) + 1 }));

    if (isRecording && isPlaying && projectId) {
      for (const ch of pad.channels) {
        const newMarker: Marker = {
          id: Math.random().toString(36).substr(2, 9),
          time: currentTime,
          duration: 0.5,
          channel: ch as ChannelId,
          intensity: 80,
          pattern: "steady",
        };
        setMarkers((prev) => [...prev, newMarker]);
        try {
          fetch("/api/markers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, time: currentTime.toString(), duration: "0.5", channel: ch, intensity: 80, pattern: "steady" }) });
        } catch { }
      }
    }
    setTimeout(() => { pad.channels.forEach((ch) => setActiveChannels((prev) => ({ ...prev, [ch]: false }))); }, 150);
  };

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const newTime = ((event.clientX - rect.left) / rect.width) * duration;
    const media = hasVideo ? videoRef.current : audioRef.current;
    if (media) { media.currentTime = newTime; setCurrentTime(newTime); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4");
    setHasVideo(isVideo);
    setCurrentTrack(file.name);
    isAudioSetupRef.current = false;
    const blobUrl = URL.createObjectURL(file);
    if (isVideo) {
      setVideoSrc(blobUrl);
      sessionStorage.setItem("videoSrc", blobUrl);
      sessionStorage.setItem("videoName", file.name);
    } else if (audioRef.current) {
      audioRef.current.src = blobUrl;
    }
    setCurrentTime(0);
    setDuration(0);
    try {
      if (projectId) {
        await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audioFileName: file.name, duration: "180" }) });
      } else {
        const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: file.name.replace(/\.[^/.]+$/, ""), audioFileName: file.name, duration: "180" }) });
        const proj = await res.json();
        setProjectId(proj.id);
      }
    } catch { }
    toast({ title: isVideo ? "Video Učitan" : "Pjesma Učitana", description: `Uređujem: ${file.name}` });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    const media = hasVideo ? videoRef.current : audioRef.current;
    if (media) { media.currentTime = 0; setCurrentTime(0); }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col" style={{ height: "100dvh" }}>
      <audio ref={audioRef} crossOrigin="anonymous" />
      <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/webm,audio/mp3,audio/wav" onChange={handleFileUpload} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors shrink-0"
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-button"
          >
            <Upload className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">{currentTrack}</h1>
            <p className="text-[10px] text-zinc-500">Koreografija Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/snimanje">
            <button className="border border-red-500/60 text-red-400 hover:bg-red-500/10 rounded-lg px-3 h-8 text-xs font-bold transition-colors">
              SNIMANJE
            </button>
          </Link>
          <button className="border border-white/20 text-white hover:bg-white/10 rounded-lg px-3 h-8 text-xs font-bold transition-colors" data-testid="sync-button">
            SINKRONIZIRAJ
          </button>
          <button className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">

        {/* Top section: Video + Stats */}
        <div className="flex gap-3 shrink-0" style={{ height: "180px" }}>
          {/* Video player */}
          <div className="relative rounded-lg overflow-hidden bg-black border border-white/10 shadow-lg" style={{ aspectRatio: "16/9", height: "100%" }}>
            {videoSrc ? (
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setIsPlaying(!isPlaying)}
                  playsInline
                  preload="metadata"
                  data-testid="video-player"
                />
                {/* YouTube-style progress bar overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-6 pb-1.5 px-2">
                  <div
                    ref={progressBarRef}
                    className="relative h-1 bg-white/30 cursor-pointer hover:h-1.5 transition-all rounded-full"
                    onClick={handleProgressBarClick}
                    data-testid="progress-bar"
                  >
                    <div className="absolute top-0 left-0 h-full bg-red-600 rounded-full" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }} />
                    {markers.map((marker) => (
                      <div key={marker.id} className="absolute top-0 bottom-0 w-px" style={{ left: duration > 0 ? `${(marker.time / duration) * 100}%` : "0%", backgroundColor: CHANNEL_COLORS[marker.channel] }} />
                    ))}
                    <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-red-600 rounded-full shadow-lg" style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 5px)` : "0%" }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <button className="text-white" onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <span className="text-[10px] text-white font-mono">{formatTime(currentTime)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {SPEED_OPTIONS.map((speed) => (
                        <button
                          key={speed}
                          className={cn("px-1.5 py-0.5 text-[10px] rounded transition-colors", tempo === speed ? "bg-red-600 text-white" : "text-white/60 hover:text-white")}
                          onClick={() => setTempo(speed)}
                          data-testid={`speed-${speed}`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-900">
                <button
                  className="rounded-full bg-white/10 hover:bg-white/20 h-12 w-12 flex items-center justify-center transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-5 w-5 text-zinc-400" />
                </button>
                <span className="text-[10px] text-zinc-500">Učitaj video</span>
              </div>
            )}
          </div>

          {/* Stats panel */}
          <div className="flex-1 bg-[#1a1a1a] rounded-lg border border-white/10 p-3 flex flex-col justify-between min-w-0">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/50 p-2 rounded">
                <span className="block text-[10px] text-zinc-500 mb-0.5">Trajanje</span>
                <span className="text-base font-mono">{formatTime(duration)}</span>
              </div>
              <div className="bg-black/50 p-2 rounded">
                <span className="block text-[10px] text-zinc-500 mb-0.5">Markeri</span>
                <span className="text-base font-mono">{markers.length}</span>
              </div>
            </div>
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs rounded-lg flex items-center justify-center gap-1.5 font-medium transition-colors"
              onClick={detectBeats}
              data-testid="detect-beats"
            >
              <Activity className="w-3.5 h-3.5" />
              Otkrij Beat
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] rounded-lg border border-white/10 overflow-hidden min-h-0">
          {/* Ruler */}
          <div className="flex items-end border-b border-white/10 bg-zinc-900/50 shrink-0" style={{ height: "24px" }}>
            <div className="w-12 shrink-0 border-r border-white/10 h-full" />
            <div className="flex-1 relative h-full overflow-hidden">
              <div
                className="absolute inset-0 text-[9px] text-zinc-500 font-mono"
                style={{ transform: `translateX(-${currentTime * zoom}px)` }}
              >
                {Array.from({ length: Math.ceil(TOTAL_DURATION) }).map((_, s) => (
                  <div key={s} className="absolute bottom-0 border-l border-zinc-700 h-2" style={{ left: `${s * zoom}px` }}>
                    {s % 5 === 0 && <span className="absolute -top-3 left-1">{formatTime(s)}</span>}
                  </div>
                ))}
              </div>
              {/* Playhead */}
              <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10" style={{ left: "20%" }}>
                <div className="w-2 h-2 bg-red-500 rounded-sm -ml-[3px] shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              </div>
            </div>
          </div>

          {/* Tracks */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 bottom-0 w-px bg-red-500 z-30 shadow-[0_0_10px_red]" style={{ left: "calc(48px + 20%)" }} />
            {(["G1", "G2", "G3", "G4"] as ChannelId[]).map((channel) => (
              <div key={channel} className="flex-1 flex border-b border-white/5 relative min-h-[40px]">
                <div className="w-12 shrink-0 border-r border-white/10 bg-zinc-900 flex items-center justify-center">
                  <span className="text-xs font-bold" style={{ color: CHANNEL_COLORS[channel] }}>{channel}</span>
                </div>
                <div className="flex-1 bg-zinc-950 relative overflow-hidden">
                  {/* Grid lines */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: `${zoom}px 100%`, transform: `translateX(-${(currentTime * zoom) % zoom}px)` }}
                  />
                  {/* Playhead */}
                  <div className="absolute top-0 bottom-0 w-px bg-red-500/40 z-10" style={{ left: "20%" }} />
                  {/* Markers */}
                  <div className="absolute inset-0" style={{ transform: `translateX(-${currentTime * zoom}px)`, paddingLeft: "20%" }}>
                    {markers.filter((m) => m.channel === channel).map((marker) => (
                      <TimelineMarker key={marker.id} marker={marker} pixelsPerSecond={zoom} onUpdate={updateMarker} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-t border-white/5 shrink-0">
            <ZoomOut className="w-3 h-3 text-zinc-600" />
            <Slider value={[zoom]} min={20} max={200} step={10} onValueChange={(v) => setZoom(v[0])} className="flex-1 h-1" />
            <ZoomIn className="w-3 h-3 text-zinc-600" />
          </div>
        </div>

        {/* ─── 5 PAD BUTTONS IN A ROW (Design B signature) ─── */}
        <div className="shrink-0 flex gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg p-2">
          {pads.map((pad) => {
            const active = isPadActive(pad);
            const isG = pad.id === "G";
            return (
              <div key={pad.id} className="flex-1 flex flex-col items-center gap-1">
                <button
                  className="w-full rounded-lg font-bold transition-all duration-75 active:scale-95 flex flex-col items-center justify-center gap-0.5 border"
                  style={{
                    height: isG ? "60px" : "56px",
                    backgroundColor: active
                      ? (isG ? "#ffffff" : pad.color)
                      : (isG ? "rgba(255,255,255,0.08)" : pad.color + "22"),
                    borderColor: isG ? "rgba(255,255,255,0.4)" : pad.color,
                    color: active ? "#000" : (isG ? "#fff" : pad.color),
                    boxShadow: active ? `0 0 20px ${isG ? "rgba(255,255,255,0.5)" : pad.color + "90"}` : "none",
                  }}
                  onPointerDown={() => handlePadDown(pad)}
                  onPointerUp={() => pad.channels.forEach((ch) => setActiveChannels((prev) => ({ ...prev, [ch]: false })))}
                  onPointerLeave={() => pad.channels.forEach((ch) => setActiveChannels((prev) => ({ ...prev, [ch]: false })))}
                  data-testid={`pad-${pad.id}`}
                >
                  <span className={`font-black leading-none ${isG ? "text-xl" : "text-lg"}`}>{pad.label}</span>
                  {isG && <span className="text-[8px] uppercase tracking-widest font-medium opacity-70 leading-none">SVE GRUPE</span>}
                </button>
                <span
                  className="text-xs font-mono font-bold tabular-nums"
                  style={{ color: tapCounts[pad.id] > 0 ? (isG ? "rgba(255,255,255,0.8)" : pad.color) : "rgba(255,255,255,0.2)" }}
                >
                  {tapCounts[pad.id]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Transport controls */}
        <div className="bg-[#1a1a1a] rounded-lg border border-white/10 px-3 py-2 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <button
              className="h-9 w-9 rounded-md border border-white/20 bg-black/50 hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={() => { stopPlayback(); }}
              data-testid="stop-button"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              className="h-9 w-9 rounded-md border border-white/20 bg-black/50 hover:bg-white/10 flex items-center justify-center transition-colors"
              onClick={stopPlayback}
              data-testid="rewind-button"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              className="h-9 w-11 rounded-md flex items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors"
              onClick={() => setIsPlaying(!isPlaying)}
              data-testid="play-button"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              className={cn(
                "h-9 px-3 rounded-md flex items-center gap-1.5 font-bold text-sm border-2 transition-all",
                isRecording
                  ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse"
                  : "border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400"
              )}
              onClick={() => setIsRecording(!isRecording)}
              data-testid="record-button"
            >
              <Circle className="h-3 w-3 fill-current" />
              REC
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 px-3">
            <span className="text-[10px] text-zinc-500 whitespace-nowrap">Brzina</span>
            <Slider
              value={[tempo * 100]}
              min={25}
              max={150}
              step={25}
              onValueChange={(v) => setTempo(v[0] / 100)}
              className="flex-1"
            />
            <span className="text-[10px] text-zinc-400 font-mono w-8">{tempo.toFixed(2)}x</span>
          </div>

          <div className="font-mono text-sm bg-black/50 px-3 py-1.5 rounded border border-white/5 shrink-0">
            <span className="text-white">{formatTime(currentTime).split(".")[0]}</span>
            <span className="text-zinc-500">.{formatTime(currentTime).split(".")[1]}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
