import { create } from 'zustand';
import { YtDlpMetadata } from '@/lib/ytdlp';

interface HomeStore {
  url: string;
  setUrl: (url: string) => void;
  metadata: YtDlpMetadata[] | null;
  setMetadata: (metadata: YtDlpMetadata[] | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;

  format: "video" | "audio";
  setFormat: (format: "video" | "audio") => void;
  quality: string;
  setQuality: (quality: string) => void;
  videoFormat: string;
  setVideoFormat: (videoFormat: string) => void;
  audioQuality: string;
  setAudioQuality: (audioQuality: string) => void;
  subtitles: boolean;
  setSubtitles: (subtitles: boolean) => void;
  subtitleLangs: string;
  setSubtitleLangs: (subtitleLangs: string) => void;
  sponsorblock: boolean;
  setSponsorblock: (sponsorblock: boolean) => void;

  selectedVideos: Set<string>;
  setSelectedVideos: (selectedVideos: Set<string>) => void;
  trimEnabled: boolean;
  setTrimEnabled: (trimEnabled: boolean) => void;
  trimStart: string;
  setTrimStart: (trimStart: string) => void;
  trimEnd: string;
  setTrimEnd: (trimEnd: string) => void;
}

export const useHomeStore = create<HomeStore>((set) => ({
  url: "",
  setUrl: (url) => set({ url }),
  metadata: null,
  setMetadata: (metadata) => set({ metadata }),
  loading: false,
  setLoading: (loading) => set({ loading }),

  format: "video",
  setFormat: (format) => set({ format }),
  quality: "1080",
  setQuality: (quality) => set({ quality }),
  videoFormat: "mp4",
  setVideoFormat: (videoFormat) => set({ videoFormat }),
  audioQuality: "192K",
  setAudioQuality: (audioQuality) => set({ audioQuality }),
  subtitles: false,
  setSubtitles: (subtitles) => set({ subtitles }),
  subtitleLangs: "en",
  setSubtitleLangs: (subtitleLangs) => set({ subtitleLangs }),
  sponsorblock: true,
  setSponsorblock: (sponsorblock) => set({ sponsorblock }),

  selectedVideos: new Set(),
  setSelectedVideos: (selectedVideos) => set({ selectedVideos }),
  trimEnabled: false,
  setTrimEnabled: (trimEnabled) => set({ trimEnabled }),
  trimStart: "00:00:00",
  setTrimStart: (trimStart) => set({ trimStart }),
  trimEnd: "00:01:00",
  setTrimEnd: (trimEnd) => set({ trimEnd }),
}));
