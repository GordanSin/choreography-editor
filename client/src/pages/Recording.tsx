import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Circle, Upload, Settings, Square, SkipBack } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
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

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0];

const pads = [
  { id: "G" as const, label: "G", sublabel: "SVE GRUPE", color: "#ffffff", channels: ["G1", "G2", "G3", "G4"] as ChannelId[] },
  { id: "G1" as const, label: "G1", color: CHANNEL_COLORS.G1, channels: ["G1"] as ChannelId[] },
  { id: "G2" as const, label: "G2", color: CHANNEL_COLORS.G2, channels: ["G2"] as ChannelId[] },
  { id: "G3" as const, label: "G3", color: CHANNEL_COLORS.G3, channels: ["G3"] as ChannelId[] },
  { id: "G4" as const, label: "G4", color: CHANNEL_COLORS.G4, channels: ["G4"] as ChannelId[] },
];

export default function RecordingPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string>("Bez naslova");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(1.0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [tapCounts, setTapCounts] = useState<Record<string, number>>({ G: 0, G1: 0, G2: 0, G3: 0, G4: 0 });
  const [activeChannels, setActiveChannels] = useState<Record<ChannelId, boolean>>({
    G1: false, G2: false, G3: false, G4: false,
  });

  useEffect(() => {
    const savedVideoSrc = sessionStorage.getItem("videoSrc");
    const savedVideoName = sessionStorage.getItem("videoName");
    if (savedVideoSrc) {
      setVideoSrc(savedVideoSrc);
      setCurrentTrack(savedVideoName || "Video");
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
      } catch { }
    };
    loadProject();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.playbackRate = tempo;
      video.play().catch((err) => console.error("Playback error:", err));
    } else {
      video.pause();
    }
  }, [isPlaying, tempo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => { setCurrentTime(video.currentTime); if (video.ended) setIsPlaying(false); };
    const handleMeta = () => setDuration(video.duration);
    if (video.duration && !isNaN(video.duration)) setDuration(video.duration);
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", handleMeta);
    video.addEventListener("durationchange", handleMeta);
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", handleMeta);
      video.removeEventListener("durationchange", handleMeta);
    };
  }, [videoSrc]);

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const newTime = ((event.clientX - rect.left) / rect.width) * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCurrentTrack(file.name);
    const blobUrl = URL.createObjectURL(file);
    setVideoSrc(blobUrl);
    sessionStorage.setItem("videoSrc", blobUrl);
    sessionStorage.setItem("videoName", file.name);
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
    toast({ title: "Video Učitan", description: `Spremno za snimanje: ${file.name}` });
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

  const stopPlayback = () => {
    setIsPlaying(false);
    if (videoRef.current) { videoRef.current.currentTime = 0; setCurrentTime(0); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans flex flex-col" style={{ height: "100dvh" }}>
      <input type="file" ref={fileInputRef} className="hidden" accept="video/mp4,video/webm" onChange={handleFileUpload} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/">
            <button className="text-white hover:bg-white/10 rounded-lg p-1.5 transition-colors shrink-0">
              <SkipBack className="h-5 w-5" />
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate">{currentTrack}</h1>
            <p className="text-[10px] text-zinc-500">Snimanje</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="border border-white/20 text-white hover:bg-white/10 rounded-lg px-3 h-8 text-xs font-bold transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="upload-video-button"
          >
            <Upload className="h-3.5 w-3.5 inline mr-1.5" />
            VIDEO
          </button>
          <button className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">

        {/* Video area */}
        <div className="relative rounded-lg overflow-hidden bg-black border border-white/10 shadow-lg shrink-0" style={{ height: "40vh", minHeight: "180px" }}>
          {videoSrc ? (
            <>
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
                playsInline
                preload="metadata"
                data-testid="recording-video"
              />
              {/* YouTube-style progress bar overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3">
                <div
                  ref={progressBarRef}
                  className="relative h-1 bg-white/30 cursor-pointer hover:h-2 transition-all rounded-full"
                  onClick={handleProgressBarClick}
                  data-testid="recording-progress-bar"
                >
                  <div className="absolute top-0 left-0 h-full bg-red-600 rounded-full" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }} />
                  {markers.map((marker) => (
                    <div key={marker.id} className="absolute top-0 bottom-0 w-px" style={{ left: duration > 0 ? `${(marker.time / duration) * 100}%` : "0%", backgroundColor: CHANNEL_COLORS[marker.channel] }} />
                  ))}
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow-lg" style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : "0%" }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button className="text-white" onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <span className="text-xs text-white font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        className={cn("px-2 py-0.5 text-xs rounded transition-colors", tempo === speed ? "bg-red-600 text-white" : "text-white/70 hover:text-white")}
                        onClick={() => setTempo(speed)}
                        data-testid={`recording-speed-${speed}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-zinc-900">
              <button
                className="rounded-full bg-white/10 hover:bg-white/20 h-16 w-16 flex items-center justify-center transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-7 w-7 text-zinc-400" />
              </button>
              <span className="text-sm text-zinc-500">Učitaj MP4 video za snimanje</span>
            </div>
          )}
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
                    height: isG ? "72px" : "68px",
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
                  data-testid={`recording-pad-${pad.id}`}
                  disabled={!videoSrc}
                >
                  <span className={`font-black leading-none ${isG ? "text-2xl" : "text-xl"}`}>{pad.label}</span>
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
              className="h-9 w-9 rounded-md border border-white/20 bg-black/50 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40"
              onClick={stopPlayback}
              disabled={!videoSrc}
              data-testid="recording-rewind"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              className="h-9 w-9 rounded-md border border-white/20 bg-black/50 hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40"
              onClick={stopPlayback}
              disabled={!videoSrc}
              data-testid="recording-stop"
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              className="h-9 w-11 rounded-md flex items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!videoSrc}
              data-testid="recording-play"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              className={cn(
                "h-9 px-3 rounded-md flex items-center gap-1.5 font-bold text-sm border-2 transition-all disabled:opacity-40",
                isRecording
                  ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse"
                  : "border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400"
              )}
              onClick={() => setIsRecording(!isRecording)}
              disabled={!videoSrc}
              data-testid="recording-record"
            >
              <Circle className="h-3 w-3 fill-current" />
              {isRecording ? "SNIMAM" : "REC"}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 px-3">
            <span className="text-[10px] text-zinc-500 whitespace-nowrap">Brzina</span>
            <Slider
              value={[tempo * 100]}
              min={25}
              max={100}
              step={25}
              onValueChange={(v) => setTempo(v[0] / 100)}
              className="flex-1"
              disabled={!videoSrc}
            />
            <span className="text-[10px] text-zinc-400 font-mono w-8">{tempo.toFixed(2)}x</span>
          </div>

          <div className="font-mono text-sm bg-black/50 px-3 py-1.5 rounded border border-white/5 shrink-0">
            <span className="text-white">{formatTime(currentTime).split(".")[0]}</span>
            <span className="text-zinc-500">.{formatTime(currentTime).split(".")[1]}</span>
          </div>
        </div>

        {/* Recording hint */}
        {isRecording && isPlaying && (
          <div className="shrink-0 text-center">
            <p className="text-xs text-zinc-500">Dodirnite padove u ritmu glazbe za snimanje markera</p>
          </div>
        )}

        {/* Marker count */}
        <div className="shrink-0 flex justify-center gap-4">
          {(["G1", "G2", "G3", "G4"] as ChannelId[]).map((ch) => {
            const count = markers.filter((m) => m.channel === ch).length;
            return (
              <div key={ch} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHANNEL_COLORS[ch] }} />
                <span className="text-xs text-zinc-400 font-mono">{ch}: {count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
