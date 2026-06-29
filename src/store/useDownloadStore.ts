import { create } from 'zustand';
import { Child } from '@tauri-apps/plugin-shell';

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  status: DownloadStatus;
  progress: number;
  speed: string;
  eta: string;
  size: string;
  process?: Child;
  error?: string;
  path?: string;
}

interface DownloadStore {
  downloads: Record<string, DownloadItem>;
  addDownload: (item: Omit<DownloadItem, 'process'> & { process?: Child }) => void;
  updateDownload: (id: string, data: Partial<DownloadItem>) => void;
  removeDownload: (id: string) => void;
  pauseDownload: (id: string) => Promise<void>;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloads: {},

  addDownload: (item) => set((state) => ({
    downloads: {
      ...state.downloads,
      [item.id]: item
    }
  })),

  updateDownload: (id, data) => set((state) => {
    if (!state.downloads[id]) return state;
    return {
      downloads: {
        ...state.downloads,
        [id]: { ...state.downloads[id], ...data }
      }
    };
  }),

  removeDownload: (id) => set((state) => {
    const dls = { ...state.downloads };
    const item = dls[id];
    if (item && item.process && item.status === 'downloading') {
      item.process.kill().catch(console.error);
    }
    delete dls[id];
    return { downloads: dls };
  }),

  pauseDownload: async (id) => {
    const state = get();
    const item = state.downloads[id];
    if (item && item.process && item.status === 'downloading') {
      try {
        await item.process.kill();
        set((s) => ({
          downloads: {
            ...s.downloads,
            [id]: { ...item, status: 'paused', process: undefined }
          }
        }));
      } catch (err) {
        console.error("Failed to kill process to pause", err);
      }
    }
  }
}));
