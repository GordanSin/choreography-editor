import { useState, useRef, useEffect, useCallback } from "react";

interface MediaPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  tempo: number;
  hasVideo: boolean;
  videoSrc: string | null;
}

export function useMediaPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<MediaPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    tempo: 1.0,
    hasVideo: false,
    videoSrc: null,
  });

  const getMedia = useCallback(() => {
    return state.hasVideo ? videoRef.current : audioRef.current;
  }, [state.hasVideo]);

  // Sync play/pause/tempo with media element
  useEffect(() => {
    const media = getMedia();
    if (!media) return;
    if (state.isPlaying) {
      media.playbackRate = state.tempo;
      media.play().catch((err) => console.error("Playback error:", err));
    } else {
      media.pause();
    }
  }, [state.isPlaying, state.tempo, getMedia]);

  // Video time/duration tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => {
      setState((prev) => ({ ...prev, currentTime: video.currentTime }));
      if (video.ended) setState((prev) => ({ ...prev, isPlaying: false }));
    };
    const handleMeta = () => {
      if (video.duration && !isNaN(video.duration)) {
        setState((prev) => ({ ...prev, duration: video.duration }));
      }
    };
    handleMeta();
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", handleMeta);
    video.addEventListener("durationchange", handleMeta);
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", handleMeta);
      video.removeEventListener("durationchange", handleMeta);
    };
  }, [state.videoSrc, state.hasVideo]);

  // Audio time/duration tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => {
      setState((prev) => ({ ...prev, currentTime: audio.currentTime }));
      if (audio.currentTime >= audio.duration) {
        setState((prev) => ({ ...prev, isPlaying: false }));
      }
    };
    const handleMeta = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setState((prev) => ({ ...prev, duration: audio.duration }));
      }
    };
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleMeta);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleMeta);
    };
  }, []);

  const togglePlay = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const stop = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    const media = getMedia();
    if (media) media.currentTime = 0;
  }, [getMedia]);

  const setTempo = useCallback((tempo: number) => {
    setState((prev) => ({ ...prev, tempo }));
  }, []);

  const seek = useCallback((time: number) => {
    const media = getMedia();
    if (media) {
      media.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  }, [getMedia]);

  const handleProgressBarClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || state.duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const newTime = ((event.clientX - rect.left) / rect.width) * state.duration;
    seek(newTime);
  }, [state.duration, seek]);

  const loadMedia = useCallback((file: File) => {
    const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".webm");
    const blobUrl = URL.createObjectURL(file);

    if (isVideo) {
      setState((prev) => ({
        ...prev,
        hasVideo: true,
        videoSrc: blobUrl,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      }));
      sessionStorage.setItem("videoSrc", blobUrl);
      sessionStorage.setItem("videoName", file.name);
    } else {
      setState((prev) => ({
        ...prev,
        hasVideo: false,
        videoSrc: null,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
      }));
      if (audioRef.current) {
        audioRef.current.src = blobUrl;
      }
    }

    return isVideo;
  }, []);

  const restoreFromSession = useCallback(() => {
    const savedVideoSrc = sessionStorage.getItem("videoSrc");
    const savedVideoName = sessionStorage.getItem("videoName");
    if (savedVideoSrc && savedVideoName) {
      const isVideo = savedVideoName.endsWith(".mp4") || savedVideoName.endsWith(".webm");
      setState((prev) => ({
        ...prev,
        videoSrc: savedVideoSrc,
        hasVideo: isVideo,
      }));
      return savedVideoName;
    }
    return null;
  }, []);

  return {
    ...state,
    videoRef,
    audioRef,
    progressBarRef,
    togglePlay,
    stop,
    setTempo,
    seek,
    handleProgressBarClick,
    loadMedia,
    restoreFromSession,
  };
}
