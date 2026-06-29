# MediaFlow

MediaFlow is a modern, blazing-fast, and beautiful graphical user interface (GUI) for `yt-dlp`, built with React, Tauri, and Tailwind CSS. It allows you to download high-quality videos, audio, and entire playlists from over 1,000 supported websites (including YouTube, X, TikTok, Twitch, Reddit, and more) with unparalleled ease.

![MediaFlow Interface](screenshot-placeholder.png)

## Features

- **Unmatched Compatibility:** Powered by `yt-dlp`, supporting 1000+ websites natively.
- **Selective Playlist Downloading:** Paste a playlist and get a beautifully rendered checklist to select exactly which videos to download.
- **Parallel Downloading:** Queue up a massive batch of videos; the internal async queue manager safely processes 3 downloads concurrently to maximize your bandwidth.
- **Video Trimming:** Download a specific time snippet (e.g., `01:05:00` to `01:10:00`) of a 4-hour podcast without downloading the entire file.
- **Subtitles & SponsorBlock:** Automatically embed specific subtitle languages (e.g., `en, es`) and seamlessly strip out baked-in sponsored segments using the SponsorBlock API.
- **Beautiful UX/UI:** Built with `shadcn/ui` and `framer-motion`, featuring micro-animations, real-time progress bars, ETAs, and historical tracking.
- **Cross-Platform:** Available for Windows, macOS, and Linux.

## Installation

### 1. Prerequisites
MediaFlow acts as a GUI layer and strictly requires the following command-line tools to be installed and available in your system's PATH:

- **yt-dlp:** Required for downloading.
- **ffmpeg:** Required for merging video/audio formats and video trimming.

**Windows:**
```powershell
winget install yt-dlp
winget install ffmpeg
```

**macOS:**
```bash
brew install yt-dlp ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install yt-dlp ffmpeg
```

### 2. Install MediaFlow

You can download the latest pre-compiled binaries for Windows (`.msi` or `.exe`) directly from our [GitHub Releases](https://github.com/YOUR_USERNAME/mediaflow/releases) page.

1. Go to the [Releases](https://github.com/YOUR_USERNAME/mediaflow/releases) page.
2. Download the `.msi` or `.exe` installer.
3. Run the installer and follow the on-screen instructions.

## Development Setup

1. **Install Dependencies:**
   Ensure you have Node.js and Rust installed.
   ```bash
   npm install
   ```

2. **Run Development Server:**
   ```bash
   npm run tauri dev
   ```

3. **Build for Production:**
   ```bash
   npm run tauri build
   ```

## License

MIT License. See the `LICENSE` file for details.
