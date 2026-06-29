import { Command } from '@tauri-apps/plugin-shell';
import { downloadDir, join } from '@tauri-apps/api/path';

export interface YtDlpMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration_string: string;
  uploader: string;
  resolutions: number[];
  url: string;
}

export async function fetchMetadata(url: string): Promise<YtDlpMetadata[]> {
  const command = Command.create('yt-dlp', ['--dump-json', '--flat-playlist', url]);
  
  const output = await command.execute();
  
  if (output.code !== 0) {
    throw new Error(`yt-dlp error: ${output.stderr}`);
  }
  
  try {
    const lines = output.stdout.trim().split('\n');
    return lines.map(line => {
      const data = JSON.parse(line);
      
      let resolutions: number[] = [];
      if (data.formats && Array.isArray(data.formats)) {
        const heights = data.formats
          .filter((f: any) => f.vcodec !== 'none' && typeof f.height === 'number')
          .map((f: any) => f.height);
        resolutions = Array.from(new Set(heights)).sort((a: any, b: any) => b - a) as number[];
      }

      return {
        id: data.id,
        title: data.title,
        thumbnail: data.thumbnails?.[0]?.url || data.thumbnail || '',
        duration_string: data.duration_string || (data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : '--:--'),
        uploader: data.uploader || data.channel || 'Unknown',
        resolutions,
        url: data.url || url
      };
    });
  } catch (e) {
    throw new Error("Failed to parse yt-dlp metadata");
  }
}

export interface DownloadOptions {
  format: 'video' | 'audio';
  quality: string;
  videoFormat: string;
  audioQuality: string;
  subtitles: boolean;
  subtitleLangs: string;
  sponsorblock: boolean;
  trimEnabled: boolean;
  trimStart: string;
  trimEnd: string;
}

import { getSetting } from './db';

export async function startDownload(
  url: string,
  options: DownloadOptions,
  onProgress: (progress: number, speed: string, eta: string, size?: string) => void,
  onFinish: (folderPath: string, size?: string) => void,
  onError: (err: string) => void
) {
  const baseDir = await downloadDir();
  const defaultDir = await join(baseDir, 'MediaFlow');
  const targetDir = await getSetting('download-path', defaultDir);

  const args = ['--progress', '--newline', '-P', targetDir, '-o', '%(title)s.%(ext)s'];
  
  if (options.format === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', options.audioQuality);
  } else {
    args.push('-f', `bestvideo[height<=${options.quality}]+bestaudio/best`);
    args.push('--remux-video', options.videoFormat);
  }

  if (options.subtitles && options.format !== 'audio') {
    args.push('--write-subs', '--embed-subs');
    if (options.subtitleLangs) {
      args.push('--sub-langs', options.subtitleLangs);
    }
  }

  if (options.trimEnabled && options.trimStart && options.trimEnd) {
    args.push('--download-sections', `*${options.trimStart}-${options.trimEnd}`);
  }

  if (options.sponsorblock) {
    args.push('--sponsorblock-remove', 'all');
  }

  args.push(url);

  const command = Command.create('yt-dlp', args);
  
  let lastSize = "Unknown";

  command.stdout.on('data', (line) => {
    // Independently capture size to be extremely robust
    const sizeMatch = line.match(/of\s+[~]?\s*([\d.A-Za-z]+)/);
    if (sizeMatch) {
      lastSize = sizeMatch[1];
    }

    // Matches standard progress: [download]  12.3% of 50.00MiB at 1.23MiB/s ETA 00:30
    const match = line.match(/\[download\]\s+([\d.]+)%.*at\s+([A-Za-z0-9./ ]+)\s+ETA\s+([A-Za-z0-9:]+)/);
    if (match) {
      const progress = parseFloat(match[1]);
      const speed = match[2].trim();
      const eta = match[3].trim();
      onProgress(progress, speed, eta, lastSize);
    } 
    // Handle instant finishes or cached downloads where ETA/speed aren't present
    else if (line.includes('[download] 100%') || line.includes('has already been downloaded')) {
      onProgress(100, 'Done', '00:00', lastSize);
    }
  });

  let errorLog = "";
  command.stderr.on('data', (line) => {
    errorLog += line + "\n";
    console.error("yt-dlp err:", line);
  });

  command.on('close', (data) => {
    if (data.code === 0) {
      onFinish(targetDir, lastSize);
    } else {
      onError(errorLog || `Process exited with code ${data.code}`);
    }
  });

  command.on('error', (error) => {
    onError(error);
  });

  const child = await command.spawn();
  return child;
}

export async function checkYtDlp(): Promise<boolean> {
  try {
    const command = Command.create('yt-dlp', ['--version']);
    const output = await command.execute();
    return output.code === 0;
  } catch (e) {
    return false;
  }
}

export class AsyncQueue {
  private queue: (() => Promise<void>)[] = [];
  private active = 0;
  constructor(public concurrency: number) {}

  enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    this.process();
  }

  private process() {
    if (this.active >= this.concurrency || this.queue.length === 0) return;
    const task = this.queue.shift();
    if (task) {
      this.active++;
      task().finally(() => {
        this.active--;
        this.process();
      });
      this.process();
    }
  }
}

export const downloadQueue = new AsyncQueue(3);
