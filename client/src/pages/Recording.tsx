import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, Circle, Zap, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

type ChannelId = 'G1' | 'G2' | 'G3' | 'G4';

interface Marker {
  id: string;
  time: number;
  duration: number;
  channel: ChannelId;
  intensity: number;
  pattern: 'steady' | 'staccato' | 'heartbeat';
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0];

const CHANNEL_COLORS: Record<ChannelId, string> = {
  G1: "bg-channel-1",
  G2: "bg-channel-2",
  G3: "bg-channel-3",
  G4: "bg-channel-4",
};

const LivePad = ({ 
  channel, 
  label, 
  active,
  onClick 
}: { 
  channel: string; 
  label: string; 
  active: boolean;
  onClick: () => void;
}) => {
  const channelNum = channel.replace('G', '');
  return (
    <button
      className={cn(
        "flex-1 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-75 active:scale-95 border-2",
        active ? "brightness-110 scale-95" : "hover:brightness-110"
      )}
      style={{
        backgroundColor: active ? `hsl(var(--channel-${channelNum}))` : `hsla(var(--channel-${channelNum}), 0.3)`,
        borderColor: `hsl(var(--channel-${channelNum}))`,
        boxShadow: active ? `0 0 20px hsla(var(--channel-${channelNum}), 0.6)` : 'none'
      }}
      onPointerDown={onClick}
      data-testid={`recording-pad-${channel}`}
    >
      <span className="text-lg font-bold text-white">{channel}</span>
    </button>
  );
};

export default function RecordingPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string>("");
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(1.0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeChannels, setActiveChannels] = useState<Record<ChannelId, boolean>>({
    G1: false, G2: false, G3: false, G4: false
  });

  useEffect(() => {
    const savedVideoSrc = sessionStorage.getItem('videoSrc');
    const savedVideoName = sessionStorage.getItem('videoName');
    if (savedVideoSrc) {
      setVideoSrc(savedVideoSrc);
      setCurrentTrack(savedVideoName || 'Video');
    }

    const loadProject = async () => {
      try {
        const res = await fetch('/api/projects');
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
            duration: parseFloat(m.duration)
          })));
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      }
    };
    loadProject();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.playbackRate = tempo;
      video.play().catch(err => console.error('Playback error:', err));
    } else {
      video.pause();
    }
  }, [isPlaying, tempo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      if (video.ended) {
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    // Ako video već ima duration (učitan iz sessionStorage)
    if (video.duration && !isNaN(video.duration)) {
      setDuration(video.duration);
    }

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleLoadedMetadata);
    };
  }, [videoSrc]);

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !videoRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCurrentTrack(file.name);
    const blobUrl = URL.createObjectURL(file);
    setVideoSrc(blobUrl);
    sessionStorage.setItem('videoSrc', blobUrl);
    sessionStorage.setItem('videoName', file.name);
    setCurrentTime(0);
    setDuration(0);
    
    try {
      if (projectId) {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioFileName: file.name, duration: '180' }),
        });
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name.replace(/\.[^/.]+$/, ''),
            audioFileName: file.name,
            duration: '180',
          }),
        });
        const proj = await res.json();
        setProjectId(proj.id);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    }
    
    toast({
      title: "Video Učitan",
      description: `Spremno za snimanje: ${file.name}`,
    });
  };

  const triggerChannel = async (channel: ChannelId | 'ALL') => {
    const channelsToTrigger: ChannelId[] = channel === 'ALL' ? ['G1', 'G2', 'G3', 'G4'] : [channel];
    
    channelsToTrigger.forEach(ch => {
      setActiveChannels(prev => ({ ...prev, [ch]: true }));
    });
    
    if (isRecording && isPlaying && projectId) {
      for (const ch of channelsToTrigger) {
        const newMarker: Marker = {
          id: Math.random().toString(36).substr(2, 9),
          time: currentTime,
          duration: 0.5,
          channel: ch,
          intensity: 80,
          pattern: 'steady'
        };
        setMarkers(prev => [...prev, newMarker]);
        
        try {
          fetch('/api/markers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              time: currentTime.toString(),
              duration: '0.5',
              channel: ch,
              intensity: 80,
              pattern: 'steady',
            }),
          });
        } catch (err) {
          console.error('Failed to save marker:', err);
        }
      }
    }

    setTimeout(() => {
      channelsToTrigger.forEach(ch => {
        setActiveChannels(prev => ({ ...prev, [ch]: false }));
      });
    }, 150);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">SNIMANJE</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="video/mp4,video/webm" 
            onChange={handleFileUpload}
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Učitaj Video
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {videoSrc ? (
          <>
            {/* VIDEO - gornji dio ekrana */}
            <div className="h-[45vh] bg-black flex items-center justify-center shrink-0 relative group">
              <video 
                ref={videoRef}
                src={videoSrc}
                className="h-full w-auto max-w-full object-contain cursor-pointer"
                onClick={() => setIsPlaying(!isPlaying)}
                playsInline
                preload="metadata"
                data-testid="recording-video"
              />
              
              {/* YouTube-style progress bar overlay na dnu videa */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3 opacity-100 transition-opacity">
                {/* Progress bar */}
                <div 
                  ref={progressBarRef}
                  className="relative h-1 bg-white/30 cursor-pointer group/bar hover:h-2 transition-all rounded-full"
                  onClick={handleProgressBarClick}
                >
                  {/* Buffer bar */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-white/20 rounded-full"
                    style={{ width: '100%' }}
                  />
                  {/* Progress fill */}
                  <div 
                    className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                    style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                  />
                  {/* Markers */}
                  {markers.map(marker => (
                    <div
                      key={marker.id}
                      className={cn("absolute top-0 bottom-0 w-1", CHANNEL_COLORS[marker.channel])}
                      style={{ left: duration > 0 ? `${(marker.time / duration) * 100}%` : '0%' }}
                    />
                  ))}
                  {/* Scrubber dot */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow-lg scale-0 group-hover/bar:scale-100 transition-transform"
                    style={{ left: duration > 0 ? `calc(${(currentTime / duration) * 100}% - 6px)` : '0%' }}
                  />
                </div>
                
                {/* Time and controls */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button 
                      className="text-white hover:text-white/80 transition-colors"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    {/* Time */}
                    <span className="text-xs text-white font-medium">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  {/* Speed controls */}
                  <div className="flex items-center gap-1">
                    {SPEED_OPTIONS.map(speed => (
                      <button
                        key={speed}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded transition-colors",
                          tempo === speed ? "bg-red-600 text-white" : "text-white/70 hover:text-white"
                        )}
                        onClick={() => setTempo(speed)}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[45vh] flex items-center justify-center bg-zinc-900 shrink-0">
            <div className="text-center">
              <p className="text-zinc-500 mb-4">Učitajte MP4 video za početak snimanja</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                Učitaj Video
              </Button>
            </div>
          </div>
        )}

        {/* PADOVI I KONTROLE - donji dio */}
        <div className="flex-1 bg-card p-3 flex flex-col justify-center">
          {/* Play/Pause i REC gumbi */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <Button 
              size="icon" 
              className={cn("rounded-full h-12 w-12", isPlaying ? "bg-zinc-800" : "bg-white text-black")}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!videoSrc}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            
            <Button 
              variant="outline" 
              className={cn(
                "h-10 px-5 rounded-full font-bold tracking-wider border-2",
                isRecording 
                  ? "border-red-500 bg-red-500/10 text-red-500 animate-pulse" 
                  : "border-zinc-700 hover:border-red-500 hover:text-red-500"
              )}
              onClick={() => setIsRecording(!isRecording)}
              disabled={!videoSrc}
            >
              <Circle className={cn("w-2.5 h-2.5 mr-2 fill-current", isRecording && "animate-ping")} />
              {isRecording ? "SNIMAM..." : "REC"}
            </Button>
          </div>

          {/* G gumb za sve grupe */}
          <button
            className={cn(
              "w-full h-10 rounded-lg flex items-center justify-center gap-2 transition-all duration-75 active:scale-95 border",
              Object.values(activeChannels).every(v => v) ? "bg-white text-black" : "bg-white/10 border-white/30 hover:bg-white/20"
            )}
            style={{
              boxShadow: Object.values(activeChannels).every(v => v) ? '0 0 20px rgba(255,255,255,0.5)' : 'none'
            }}
            onPointerDown={() => triggerChannel('ALL')}
            data-testid="recording-pad-all"
          >
            <span className="text-base font-bold">G</span>
            <span className="text-xs uppercase tracking-widest opacity-70">SVE GRUPE</span>
          </button>

          {/* 4 padova za grupe */}
          <div className="grid grid-cols-4 gap-2">
            <LivePad channel="G1" label="Grupa A" active={activeChannels.G1} onClick={() => triggerChannel('G1')} />
            <LivePad channel="G2" label="Grupa B" active={activeChannels.G2} onClick={() => triggerChannel('G2')} />
            <LivePad channel="G3" label="Grupa C" active={activeChannels.G3} onClick={() => triggerChannel('G3')} />
            <LivePad channel="G4" label="Grupa D" active={activeChannels.G4} onClick={() => triggerChannel('G4')} />
          </div>

          {isRecording && (
            <p className="text-center text-zinc-500 text-xs mt-2">
              Dodirnite padove u ritmu glazbe
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
