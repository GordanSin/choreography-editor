import React, { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Circle, 
  Watch, Battery, Signal, SignalHigh, SignalLow, SignalZero,
  ZoomIn, ZoomOut, Zap, Activity, Mic, Settings, Wand2, Upload, Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

// --- Types ---
type ChannelId = 'G1' | 'G2' | 'G3' | 'G4';

interface Marker {
  id: string;
  time: number; // in seconds
  duration: number; // in seconds
  channel: ChannelId;
  intensity: number; // 0-100
  pattern: 'steady' | 'staccato' | 'heartbeat';
}

interface WatchStatus {
  id: number;
  connected: boolean;
  battery: number;
}

// --- Mock Data ---
const TOTAL_DURATION = 180; // 3 minutes
const CHANNEL_COLORS: Record<ChannelId, string> = {
  G1: "bg-channel-1 shadow-[0_0_10px_hsl(var(--channel-1))]",
  G2: "bg-channel-2 shadow-[0_0_10px_hsl(var(--channel-2))]",
  G3: "bg-channel-3 shadow-[0_0_10px_hsl(var(--channel-3))]",
  G4: "bg-channel-4 shadow-[0_0_10px_hsl(var(--channel-4))]",
};

const CHANNEL_TEXT_COLORS: Record<ChannelId, string> = {
  G1: "text-channel-1",
  G2: "text-channel-2",
  G3: "text-channel-3",
  G4: "text-channel-4",
};

// --- Components ---

const StatusIndicator = ({ connected, battery }: { connected: boolean; battery: number }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <Watch className={cn("w-6 h-6", connected ? "text-green-400" : "text-red-500")} />
        <div className="absolute -top-1 -right-1">
          {connected ? (
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full border border-black" />
          ) : (
             <div className="w-2.5 h-2.5 bg-red-500 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">!</div>
          )}
        </div>
      </div>
    </div>
  );
};

const TimelineMarker = ({ 
  marker, 
  pixelsPerSecond, 
  onUpdate 
}: { 
  marker: Marker; 
  pixelsPerSecond: number;
  onUpdate: (updated: Marker) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const width = Math.max(10, marker.duration * pixelsPerSecond);
  const left = marker.time * pixelsPerSecond;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "absolute top-1 bottom-1 rounded-sm cursor-pointer hover:brightness-125 transition-all border border-white/20",
            CHANNEL_COLORS[marker.channel]
          )}
          style={{
            left: `${left}px`,
            width: `${width}px`,
            opacity: marker.intensity / 100
          }}
          data-testid={`marker-${marker.id}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-zinc-900 border-zinc-800 text-zinc-100 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Postavke Vibracije</h4>
            <span className={cn("text-xs font-bold", CHANNEL_TEXT_COLORS[marker.channel])}>
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
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="steady" id="steady" />
                <Label htmlFor="steady" className="text-xs">Stalno</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="staccato" id="staccato" />
                <Label htmlFor="staccato" className="text-xs">Staccato</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="heartbeat" id="heartbeat" />
                <Label htmlFor="heartbeat" className="text-xs">Srce</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const LivePad = ({ 
  channel, 
  label, 
  colorClass, 
  active,
  onClick 
}: { 
  channel: string; 
  label: string; 
  colorClass: string; 
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      className={cn(
        "flex-1 h-12 rounded-xl flex items-center justify-center transition-all duration-75 active:scale-95 border",
        active ? "bg-opacity-100 brightness-110 scale-95" : "bg-opacity-20 hover:bg-opacity-30",
        colorClass.replace("bg-", "bg-").replace("text-", "border-")
      )}
      style={{
        backgroundColor: active ? `hsl(var(--channel-${channel.replace('G', '')}))` : `hsla(var(--channel-${channel.replace('G', '')}), 0.2)`,
        borderColor: `hsl(var(--channel-${channel.replace('G', '')}))`,
        boxShadow: active ? `0 0 20px hsla(var(--channel-${channel.replace('G', '')}), 0.6)` : 'none'
      }}
      onPointerDown={onClick}
      data-testid={`pad-${channel}`}
    >
      <span className="text-base font-bold text-white">{channel}</span>
    </button>
  );
};

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1.0];

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
  const [currentTrack, setCurrentTrack] = useState("Koreografija_Finale_2025.mp4");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(50); // pixels per second
  const [mode, setMode] = useState<'edit' | 'live'>('edit');
  const [isRecording, setIsRecording] = useState(false);
  const [tempo, setTempo] = useState(1.0); // playback speed multiplier
  const [hasVideo, setHasVideo] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<Uint8Array>(new Uint8Array(64));
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(64));
  
  // State with backend persistence
  const [markers, setMarkers] = useState<Marker[]>([
    { id: '1', time: 2.5, duration: 1, channel: 'G1', intensity: 80, pattern: 'steady' },
    { id: '2', time: 4.0, duration: 0.5, channel: 'G2', intensity: 60, pattern: 'staccato' },
    { id: '3', time: 5.5, duration: 2, channel: 'G3', intensity: 90, pattern: 'steady' },
    { id: '4', time: 8.0, duration: 0.2, channel: 'G4', intensity: 100, pattern: 'heartbeat' },
    { id: '5', time: 10.0, duration: 1.5, channel: 'G1', intensity: 70, pattern: 'steady' },
  ]);

  // Load video from sessionStorage and markers on mount
  useEffect(() => {
    const savedVideoSrc = sessionStorage.getItem('videoSrc');
    const savedVideoName = sessionStorage.getItem('videoName');
    if (savedVideoSrc && savedVideoName) {
      setVideoSrc(savedVideoSrc);
      setCurrentTrack(savedVideoName);
      setHasVideo(savedVideoName.endsWith('.mp4') || savedVideoName.endsWith('.webm'));
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

  const [activeChannels, setActiveChannels] = useState<Record<ChannelId, boolean>>({
    G1: false, G2: false, G3: false, G4: false
  });

  const watches: WatchStatus[] = [
    { id: 1, connected: true, battery: 85 },
    { id: 2, connected: true, battery: 72 },
    { id: 3, connected: false, battery: 0 },
    { id: 4, connected: true, battery: 91 },
  ];

  // Audio/Video playback control
  useEffect(() => {
    const media = hasVideo ? videoRef.current : audioRef.current;
    if (!media) return;
    
    if (isPlaying) {
      if (!hasVideo) setupAudioContext();
      media.playbackRate = tempo;
      media.play().catch(err => console.error('Playback error:', err));
    } else {
      media.pause();
    }
  }, [isPlaying, tempo, hasVideo]);

  // Sync video time with audio
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

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [hasVideo]);

  // Sync current time from audio element + beat analysis
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime >= audio.duration) {
        setIsPlaying(false);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Initialize Web Audio API once
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
      console.error('Web Audio API setup failed:', e);
    }
  };

  // Visualize waveform and beats
  useEffect(() => {
    const updateVisualization = () => {
      if (analyserRef.current && isPlaying) {
        // Time domain data for waveform
        const timeData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(timeData);
        setWaveformData(timeData);
        
        // Frequency data for beat detection
        const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(freqData);
        setFrequencyData(freqData);
      }
      
      rafIdRef.current = requestAnimationFrame(updateVisualization);
    };

    if (isPlaying) {
      // Resume audio context if suspended
      if (contextRef.current && contextRef.current.state === 'suspended') {
        contextRef.current.resume();
      }
      updateVisualization();
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isPlaying]);

  // Beat detection algorithm
  const detectBeats = async () => {
    if (!audioRef.current || !audioRef.current.src) {
      toast({
        title: "Nema Zvuka",
        description: "Molim prvo učitajte MP3 datoteku.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Otkrivam Beatove",
      description: "Analiziram ritam glazbe...",
    });

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const offlineCtx = new AudioContextClass();
      
      // Fetch the audio file
      const response = await fetch(audioRef.current.src);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);
      
      // Get audio data from first channel
      const rawData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;
      
      // Parameters for beat detection
      const windowSize = Math.floor(sampleRate * 0.05); // 50ms windows
      const hopSize = Math.floor(windowSize / 2);
      const energyThreshold = 0.15;
      const minBeatInterval = 0.2; // Minimum 200ms between beats
      
      // Calculate energy for each window
      const energies: number[] = [];
      for (let i = 0; i < rawData.length - windowSize; i += hopSize) {
        let energy = 0;
        for (let j = 0; j < windowSize; j++) {
          energy += rawData[i + j] * rawData[i + j];
        }
        energies.push(energy / windowSize);
      }
      
      // Normalize energies
      const maxEnergy = Math.max(...energies);
      const normalizedEnergies = energies.map(e => e / maxEnergy);
      
      // Detect peaks (beats)
      const detectedBeats: number[] = [];
      let lastBeatTime = -minBeatInterval;
      
      for (let i = 1; i < normalizedEnergies.length - 1; i++) {
        const time = (i * hopSize) / sampleRate;
        const current = normalizedEnergies[i];
        const prev = normalizedEnergies[i - 1];
        const next = normalizedEnergies[i + 1];
        
        // Check if this is a local peak above threshold
        if (current > prev && current > next && current > energyThreshold) {
          if (time - lastBeatTime >= minBeatInterval) {
            detectedBeats.push(time);
            lastBeatTime = time;
          }
        }
      }
      
      // Create markers for detected beats, distributed across channels
      const channels: ChannelId[] = ['G1', 'G2', 'G3', 'G4'];
      const newMarkers: Marker[] = detectedBeats.map((time, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        time,
        duration: 0.3,
        channel: channels[index % 4],
        intensity: 80,
        pattern: 'steady' as const
      }));
      
      // Add markers to state
      setMarkers(prev => [...prev, ...newMarkers]);
      
      // Save markers to backend if project exists
      if (projectId) {
        for (const marker of newMarkers) {
          try {
            await fetch('/api/markers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId,
                time: marker.time.toString(),
                duration: marker.duration.toString(),
                channel: marker.channel,
                intensity: marker.intensity,
                pattern: marker.pattern,
              }),
            });
          } catch (err) {
            console.error('Failed to save marker:', err);
          }
        }
      }
      
      toast({
        title: "Beatovi Otkriveni!",
        description: `Pronađeno ${detectedBeats.length} beatova u pjesmi.`,
      });
      
      offlineCtx.close();
    } catch (err) {
      console.error('Beat detection failed:', err);
      toast({
        title: "Otkrivanje Nije Uspjelo",
        description: "Nije moguće analizirati zvuk. Pokušajte ponovno.",
        variant: "destructive"
      });
    }
  };

  // Handle marker updates
  const updateMarker = async (updated: Marker) => {
    setMarkers(prev => prev.map(m => m.id === updated.id ? updated : m));
    try {
      await fetch(`/api/markers/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intensity: updated.intensity,
          pattern: updated.pattern,
        }),
      });
    } catch (err) {
      console.error('Failed to update marker:', err);
    }
  };

  // Handle Live Tap
  const triggerChannel = async (channel: ChannelId | 'ALL') => {
    const channelsToTrigger: ChannelId[] = channel === 'ALL' ? ['G1', 'G2', 'G3', 'G4'] : [channel];
    
    channelsToTrigger.forEach(ch => {
      setActiveChannels(prev => ({ ...prev, [ch]: true }));
    });
    
    // In recording mode, add markers
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

  // Handle progress bar click
  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = (event.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    
    const media = hasVideo ? videoRef.current : audioRef.current;
    if (media) {
      media.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4');
    setHasVideo(isVideo);
    setCurrentTrack(file.name);
    
    // Reset audio context for new track
    isAudioSetupRef.current = false;
    
    // Create blob URL for playback
    const blobUrl = URL.createObjectURL(file);
    
    if (isVideo) {
      setVideoSrc(blobUrl);
      sessionStorage.setItem('videoSrc', blobUrl);
      sessionStorage.setItem('videoName', file.name);
    } else if (audioRef.current) {
      audioRef.current.src = blobUrl;
    }
    setCurrentTime(0);
    setDuration(0);
    
    try {
      // Create or update project
      if (projectId) {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioFileName: file.name,
            duration: '180',
          }),
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
      title: isVideo ? "Video Učitan" : "Pjesma Učitana",
      description: `Uređujem: ${file.name}`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <audio ref={audioRef} crossOrigin="anonymous" />
      
      {/* A. Status Bar */}
      <header className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <div className="w-8 md:w-10 h-8 md:h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0">
            <Zap className="w-4 md:w-6 h-4 md:h-6" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1 md:gap-2 min-w-0">
              <h1 className="text-xs md:text-sm font-bold text-zinc-100 uppercase tracking-wide truncate" title={currentTrack}>
                {currentTrack}
              </h1>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="video/mp4,video/webm,audio/mp3,audio/wav" 
                onChange={handleFileUpload}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 md:h-6 px-1.5 md:px-2 text-[10px] md:text-xs text-zinc-400 hover:text-white hover:bg-white/10 shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-2.5 md:w-3 h-2.5 md:h-3 mr-0.5 md:mr-1" />
                <span className="hidden sm:inline">VIDEO/MP3</span>
              </Button>
            </div>
            <p className="text-[9px] md:text-xs text-zinc-500 hidden sm:block">Zadnja sinkronizacija: prije 2 min</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <Link href="/snimanje">
            <Button variant="default" size="sm" className="bg-red-500 hover:bg-red-600 text-white font-bold px-4">
              <Mic className="w-4 h-4 mr-2" />
              SNIMANJE
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={() => setMode(mode === 'edit' ? 'live' : 'edit')}>
            {mode === 'edit' ? <Activity className="text-zinc-400 w-4 md:w-5 h-4 md:h-5" /> : <Settings className="text-zinc-400 w-4 md:w-5 h-4 md:h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* VIDEO PLAYER SECTION - YouTube style */}
        {hasVideo && videoSrc && (
          <div className="bg-black shrink-0 relative group">
            {/* Video Preview */}
            <div className="flex justify-center">
              <video 
                ref={videoRef}
                src={videoSrc}
                className="max-h-[40vh] min-h-[200px] w-auto cursor-pointer bg-zinc-900"
                onClick={() => setIsPlaying(!isPlaying)}
                playsInline
                preload="metadata"
                data-testid="video-player"
              />
            </div>
            
            {/* YouTube-style progress bar overlay na dnu videa */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-2 px-3">
              {/* Progress bar */}
              <div 
                ref={progressBarRef}
                className="relative h-1 bg-white/30 cursor-pointer group/bar hover:h-2 transition-all rounded-full"
                onClick={handleProgressBarClick}
                data-testid="progress-bar"
              >
                {/* Buffer bar */}
                <div className="absolute top-0 left-0 h-full bg-white/20 rounded-full" style={{ width: '100%' }} />
                {/* Progress fill */}
                <div 
                  className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
                {/* Markers */}
                {markers.map(marker => (
                  <div
                    key={marker.id}
                    className={cn("absolute top-0 bottom-0 w-1", CHANNEL_COLORS[marker.channel].split(' ')[0])}
                    style={{ left: duration > 0 ? `${(marker.time / duration) * 100}%` : '0%' }}
                    title={`${marker.channel} - ${formatTime(marker.time)}`}
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
                      data-testid={`speed-${speed}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIO-ONLY Progress Bar (when no video) */}
        {!hasVideo && duration > 0 && (
          <div className="bg-zinc-900 border-b border-white/10 px-4 py-3 shrink-0">
            <div 
              ref={progressBarRef}
              className="relative h-3 bg-zinc-800 rounded-full cursor-pointer group hover:h-4 transition-all"
              onClick={handleProgressBarClick}
              data-testid="audio-progress-bar"
            >
              {/* Progress fill */}
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Markers on progress bar */}
              {markers.map(marker => (
                <div
                  key={marker.id}
                  className={cn("absolute top-0 bottom-0 w-1 rounded-full", CHANNEL_COLORS[marker.channel].split(' ')[0])}
                  style={{ left: `${(marker.time / duration) * 100}%` }}
                  title={`${marker.channel} - ${formatTime(marker.time)}`}
                />
              ))}
              
              {/* Hover indicator */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
              />
            </div>
            
            {/* Time display and speed controls */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-zinc-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              
              {/* Speed Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Brzina:</span>
                {SPEED_OPTIONS.map(speed => (
                  <Button
                    key={speed}
                    variant={tempo === speed ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs rounded-full",
                      tempo === speed ? "bg-cyan-500 hover:bg-cyan-600" : "border-zinc-700 hover:border-cyan-500"
                    )}
                    onClick={() => setTempo(speed)}
                    data-testid={`audio-speed-${speed}`}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WAVEFORM & TIMELINE (Always visible, but interacts differently) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0a0a0a]">
          
          {/* Waveform & Beat Visualization (Top) - Hidden on mobile or when video is shown */}
          <div className={cn("w-full bg-black/40 border-b border-white/5 relative overflow-hidden shrink-0", hasVideo ? "h-0 hidden" : "h-0 md:h-24 hidden md:block")}>
            {/* Waveform (Time Domain) - Top half */}
            <div className="absolute top-0 left-0 right-0 h-1/2 flex items-center justify-center gap-[1px] px-4">
              {waveformData && Array.from({ length: Math.min(64, waveformData.length) }).map((_, i) => {
                const value = waveformData[i] || 128;
                const deviation = Math.abs(value - 128) / 128;
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-cyan-400 to-cyan-600 rounded-sm" 
                    style={{ 
                      height: `${Math.max(4, deviation * 100)}%`,
                      opacity: 0.8
                    }} 
                  />
                );
              })}
            </div>
            
            {/* Beat Frequency Data - Bottom half */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 flex items-end justify-center gap-[1px] px-4">
              {frequencyData && Array.from({ length: Math.min(64, frequencyData.length) }).map((_, i) => {
                const value = frequencyData[i] || 0;
                const height = (value / 255) * 100;
                const isBeat = value > 180;
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-50 ${isBeat ? 'bg-gradient-to-t from-pink-500 to-yellow-400' : 'bg-gradient-to-t from-purple-500 to-blue-400'}`}
                    style={{ 
                      height: `${Math.max(4, height)}%`,
                      opacity: isBeat ? 1 : 0.7
                    }} 
                  />
                );
              })}
            </div>
            
            {/* Playhead Indicator for Waveform */}
             <div 
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 shadow-[0_0_8px_red]"
                style={{ left: '20%' }}
             />
          </div>

          {/* Timeline Tracks */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            {/* Time Ruler */}
            <div className="h-6 md:h-8 bg-zinc-900/50 border-b border-white/5 flex items-center text-[9px] md:text-xs text-zinc-500 relative hidden md:flex" style={{
              transform: `translateX(-${currentTime * zoom}px)`,
              marginLeft: '20%'
            }}>
               {Array.from({ length: Math.ceil(TOTAL_DURATION) }).map((_, s) => (
                 <div key={s} className="absolute top-0 bottom-0 border-l border-white/5 pl-1 pt-1" style={{ left: `${s * zoom}px`, width: `${zoom}px` }}>
                   {s % 5 === 0 && <span>{formatTime(s)}</span>}
                 </div>
               ))}
            </div>

            {/* Tracks Container - Scrolling */}
            <div className="flex-1 relative">
              {/* Playhead Line */}
              <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 shadow-[0_0_10px_red]" style={{ left: '20%' }} />

              {/* Scrolling Content */}
              <div 
                className="absolute top-0 left-0 bottom-0 flex flex-col w-[10000px] transition-transform duration-75 ease-linear"
                style={{ 
                  transform: `translateX(-${currentTime * zoom}px)`, 
                  paddingLeft: '20%' // Initial offset
                }}
              >
                {(['G1', 'G2', 'G3', 'G4'] as ChannelId[]).map((channel, i) => (
                  <div key={channel} className="h-16 border-b border-white/5 relative group bg-black/20 hover:bg-white/5 transition-colors">
                    {/* Grid lines */}
                    <div className="absolute inset-0 hidden md:block" style={{ 
                      backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', 
                      backgroundSize: `${zoom}px 100%` 
                    }} />
                    
                    {/* Channel Label (Sticky) */}
                    <div className="sticky left-0 z-20 p-1 md:p-2 pointer-events-none">
                      <span className={cn("text-[8px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded bg-black/50 backdrop-blur-sm border border-white/10", CHANNEL_TEXT_COLORS[channel])}>
                        {channel}
                      </span>
                    </div>

                    {/* Markers */}
                    {markers.filter(m => m.channel === channel).map(marker => (
                      <TimelineMarker 
                        key={marker.id} 
                        marker={marker} 
                        pixelsPerSecond={zoom}
                        onUpdate={updateMarker}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE TAP OVERLAY (Conditional) */}
        {mode === 'live' && (
          <div className="absolute inset-0 bg-black z-40 flex flex-col animate-in fade-in duration-300">
             {/* Video Preview */}
             <div className="flex-1 bg-black flex items-center justify-center">
               {videoSrc ? (
                 <video 
                   ref={videoRef}
                   src={videoSrc}
                   className="h-full w-auto max-w-full object-contain"
                   onClick={() => setIsPlaying(!isPlaying)}
                   playsInline
                   preload="metadata"
                 />
               ) : (
                 <p className="text-zinc-500">Učitajte video za snimanje</p>
               )}
             </div>
             
             {/* Controls */}
             <div className="bg-zinc-900 p-3 shrink-0">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs text-zinc-400 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                 <Button variant="outline" size="sm" onClick={() => setMode('edit')}>Izlaz</Button>
               </div>
               
               {/* G - SVE GRUPE (veći i važniji) */}
               <button
                 className={cn(
                   "w-full h-16 rounded-xl flex items-center justify-center gap-3 transition-all duration-75 active:scale-95 border-2 mb-2",
                   Object.values(activeChannels).every(v => v) ? "bg-white text-black" : "bg-white/10 border-white/40 hover:bg-white/20"
                 )}
                 style={{
                   boxShadow: Object.values(activeChannels).every(v => v) ? '0 0 25px rgba(255,255,255,0.5)' : 'none'
                 }}
                 onPointerDown={() => triggerChannel('ALL')}
               >
                 <span className="text-2xl font-bold">G</span>
                 <span className="text-sm uppercase tracking-widest opacity-70">SVE GRUPE</span>
               </button>
               
               {/* G1-G4 manji gumbi */}
               <div className="grid grid-cols-4 gap-2">
                 <LivePad channel="G1" label="A" colorClass="bg-channel-1 text-channel-1" active={activeChannels.G1} onClick={() => triggerChannel('G1')} />
                 <LivePad channel="G2" label="B" colorClass="bg-channel-2 text-channel-2" active={activeChannels.G2} onClick={() => triggerChannel('G2')} />
                 <LivePad channel="G3" label="C" colorClass="bg-channel-3 text-channel-3" active={activeChannels.G3} onClick={() => triggerChannel('G3')} />
                 <LivePad channel="G4" label="D" colorClass="bg-channel-4 text-channel-4" active={activeChannels.G4} onClick={() => triggerChannel('G4')} />
               </div>
             </div>
          </div>
        )}

      </main>

      {/* C. Control Panel */}
      <footer className="bg-card border-t border-border px-3 md:px-8 py-3 md:py-4 shrink-0 z-50 flex flex-col gap-2 md:gap-4">
        
        {/* Main Transport Controls - Always visible */}
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <div className="text-lg md:text-2xl font-mono text-primary tabular-nums tracking-widest">
            {formatTime(currentTime)}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 hover:text-primary"><SkipBack className="w-4 md:w-6 h-4 md:h-6" /></Button>
            
            <Button 
              size="icon" 
              className={cn("rounded-full shadow-lg transition-all h-12 w-12 md:h-14 md:w-14", isPlaying ? "bg-zinc-800 hover:bg-zinc-700" : "bg-white text-black hover:bg-zinc-200")}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-6 md:w-6 h-6 md:h-6 fill-current" /> : <Play className="w-6 md:w-6 h-6 md:h-6 fill-current ml-0.5 md:ml-1" />}
            </Button>
            
            <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 hover:text-primary"><SkipForward className="w-4 md:w-6 h-4 md:h-6" /></Button>
          </div>

          <Button 
            variant="outline" 
            className={cn(
              "border-2 h-10 md:h-12 px-4 md:px-6 rounded-full font-bold text-sm md:text-base tracking-wider transition-all",
              isRecording 
                ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse" 
                : "border-zinc-700 hover:border-red-500 hover:text-red-500"
            )}
            onClick={() => setIsRecording(!isRecording)}
          >
            <Circle className={cn("w-2 md:w-3 h-2 md:h-3 mr-1 md:mr-2 fill-current", isRecording && "animate-ping")} />
            REC
          </Button>
        </div>

        {/* Secondary Controls - Desktop and tablet visible */}
        <div className="hidden md:flex items-center justify-between gap-4">
          
          {/* Zoom & Tempo */}
          <div className="flex items-center gap-4 flex-1">
             <div className="flex items-center gap-2 flex-1">
               <ZoomOut className="w-4 h-4 text-zinc-500" />
               <Slider 
                  value={[zoom]} 
                  min={20} 
                  max={200} 
                  step={10} 
                  onValueChange={(v) => setZoom(v[0])} 
                  className="flex-1"
               />
               <ZoomIn className="w-4 h-4 text-zinc-500" />
             </div>
             
             <div className="flex items-center gap-2 flex-1">
               <span className="text-xs text-zinc-500 whitespace-nowrap">Brzina</span>
               <Slider 
                  value={[tempo]} 
                  min={0.5} 
                  max={1.5} 
                  step={0.1} 
                  onValueChange={(v) => setTempo(v[0])} 
                  className="flex-1"
               />
               <span className="text-xs text-zinc-400 font-mono w-8 text-right">{tempo.toFixed(1)}x</span>
             </div>
          </div>

          {/* Detect Beat */}
          <Button 
            variant="outline" 
            className="border-zinc-700 hover:border-purple-500 hover:text-purple-500 h-12 px-4 rounded-full transition-colors"
            onClick={detectBeats}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Otkrij Beat
          </Button>
        </div>

        {/* Sync Button - Desktop only */}
        <div className="hidden md:flex justify-center">
           <Button className="w-full max-w-md bg-gradient-to-r from-primary via-purple-500 to-blue-500 hover:brightness-110 text-white font-bold tracking-[0.2em] py-6 shadow-lg shadow-primary/20">
             SINKRONIZIRAJ
           </Button>
        </div>

        {/* Mobile Bottom Action - Compact Sync Button */}
        <div className="md:hidden">
           <Button className="w-full bg-gradient-to-r from-primary via-purple-500 to-blue-500 hover:brightness-110 text-white font-bold text-sm py-3 shadow-lg shadow-primary/20 rounded-lg">
             SINKRONIZIRAJ
           </Button>
        </div>
      </footer>
    </div>
  );
}
