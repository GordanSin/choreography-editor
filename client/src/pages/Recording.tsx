import { useEffect, useRef, useCallback } from "react";
import { Play, Pause, Circle, Upload, Settings, Square, SkipBack } from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useMediaPlayer } from "@/hooks/use-media-player";
import { useProject } from "@/hooks/use-project";
import { usePadInput } from "@/hooks/use-pad-input";
import { CHANNEL_COLORS, CHANNELS, SPEED_OPTIONS, PADS } from "@/lib/constants";
import { formatTime } from "@/lib/types";
import type { ChannelId } from "@shared/schema";
import { Link } from "wouter";

export default function RecordingPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const player = useMediaPlayer();
  const project = useProject();
  const pads = usePadInput();

  // Load project + restore session on mount
  useEffect(() => {
    const savedName = player.restoreFromSession();
    if (savedName) project.setCurrentTrack(savedName);
    project.loadProject(!!savedName);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    player.loadMedia(file);
    project.setCurrentTrack(file.name);
    await project.ensureProject(file.name, 0);
    toast({ title: "Video Učitan", description: `Spremno za snimanje: ${file.name}` });
  };

  const handleRecordPad = useCallback((channels: ChannelId[]) => {
    if (!player.isPlaying || !project.projectId) return;
    for (const ch of channels) {
      project.createMarkerOnServer({
        projectId: project.projectId,
        time: player.currentTime,
        duration: 0.5,
        channel: ch,
        intensity: 80,
        pattern: "steady",
      }).then((created) => {
        if (created) {
          project.setMarkers((prev) => [...prev, created]);
        }
      });
    }
  }, [player.isPlaying, player.currentTime, project]);

  const isRecordingActive = player.isPlaying && project.projectId !== null;

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
            <h1 className="text-sm font-bold leading-tight truncate">{project.currentTrack}</h1>
            <p className="text-[10px] text-zinc-500">Snimanje</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            className="border border-white/20 text-white hover:bg-white/10 rounded-lg px-3 h-8 text-xs font-bold transition-colors"
            onClick={() => fileInputRef.current?.click()}
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
          {player.videoSrc ? (
            <>
              <video
                ref={player.videoRef}
                src={player.videoSrc}
                className="w-full h-full object-contain cursor-pointer"
                onClick={player.togglePlay}
                playsInline
                preload="metadata"
              />
              {/* Progress bar overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3">
                <div
                  ref={player.progressBarRef}
                  className="relative h-1 bg-white/30 cursor-pointer hover:h-2 transition-all rounded-full"
                  onClick={player.handleProgressBarClick}
                >
                  <div className="absolute top-0 left-0 h-full bg-red-600 rounded-full" style={{ width: player.duration > 0 ? `${(player.currentTime / player.duration) * 100}%` : "0%" }} />
                  {project.markers.map((marker) => (
                    <div key={marker.id} className="absolute top-0 bottom-0 w-px" style={{ left: player.duration > 0 ? `${(marker.time / player.duration) * 100}%` : "0%", backgroundColor: CHANNEL_COLORS[marker.channel] }} />
                  ))}
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow-lg" style={{ left: player.duration > 0 ? `calc(${(player.currentTime / player.duration) * 100}% - 6px)` : "0%" }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <button className="text-white" onClick={player.togglePlay}>
                      {player.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <span className="text-xs text-white font-mono">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {SPEED_OPTIONS.map((speed) => (
                      <button
                        key={speed}
                        className={cn("px-2 py-0.5 text-xs rounded transition-colors", player.tempo === speed ? "bg-red-600 text-white" : "text-white/70 hover:text-white")}
                        onClick={() => player.setTempo(speed)}
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

        {/* Pad buttons */}
        <div className="shrink-0 flex gap-2 bg-[#1a1a1a] border border-white/10 rounded-lg p-2">
          {PADS.map((pad) => {
            const active = pads.isPadActive(pad);
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
                  onPointerDown={() => pads.handlePadDown(pad, isRecordingActive ? handleRecordPad : undefined)}
                  onPointerUp={() => pads.deactivatePad(pad)}
                  onPointerLeave={() => pads.deactivatePad(pad)}
                  disabled={!player.videoSrc}
                >
                  <span className={`font-black leading-none ${isG ? "text-2xl" : "text-xl"}`}>{pad.label}</span>
                  {isG && <span className="text-[8px] uppercase tracking-widest font-medium opacity-70 leading-none">SVE GRUPE</span>}
                </button>
                <span
                  className="text-xs font-mono font-bold tabular-nums"
                  style={{ color: pads.tapCounts[pad.id] > 0 ? (isG ? "rgba(255,255,255,0.8)" : pad.color) : "rgba(255,255,255,0.2)" }}
                >
                  {pads.tapCounts[pad.id]}
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
              onClick={player.stop}
              disabled={!player.videoSrc}
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              className="h-9 w-11 rounded-md flex items-center justify-center bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40"
              onClick={player.togglePlay}
              disabled={!player.videoSrc}
            >
              {player.isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <button
              className={cn(
                "h-9 px-3 rounded-md flex items-center gap-1.5 font-bold text-sm border-2 transition-all disabled:opacity-40",
                player.isPlaying
                  ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse"
                  : "border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-400"
              )}
              disabled={!player.videoSrc}
            >
              <Circle className="h-3 w-3 fill-current" />
              {player.isPlaying ? "SNIMAM" : "REC"}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 px-3">
            <span className="text-[10px] text-zinc-500 whitespace-nowrap">Brzina</span>
            <Slider
              value={[player.tempo * 100]}
              min={25}
              max={100}
              step={25}
              onValueChange={(v) => player.setTempo(v[0] / 100)}
              className="flex-1"
              disabled={!player.videoSrc}
            />
            <span className="text-[10px] text-zinc-400 font-mono w-8">{player.tempo.toFixed(2)}x</span>
          </div>

          <div className="font-mono text-sm bg-black/50 px-3 py-1.5 rounded border border-white/5 shrink-0">
            <span className="text-white">{formatTime(player.currentTime).split(".")[0]}</span>
            <span className="text-zinc-500">.{formatTime(player.currentTime).split(".")[1]}</span>
          </div>
        </div>

        {/* Recording hint */}
        {player.isPlaying && (
          <div className="shrink-0 text-center">
            <p className="text-xs text-zinc-500">Dodirnite padove u ritmu glazbe za snimanje markera</p>
          </div>
        )}

        {/* Marker count */}
        <div className="shrink-0 flex justify-center gap-4">
          {CHANNELS.map((ch) => {
            const count = project.markers.filter((m) => m.channel === ch).length;
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
