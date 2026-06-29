import { Search, Clipboard, Download as DownloadIcon, Loader2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchMetadata, startDownload, DownloadOptions, downloadQueue } from "@/lib/ytdlp";
import { useDownloadStore } from "@/store/useDownloadStore";
import { useHomeStore } from "@/store/useHomeStore";
import { saveHistory } from "@/lib/db";
import { motion, AnimatePresence } from "framer-motion";
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { useState } from "react";

export default function Home() {
  const {
    url, setUrl,
    metadata, setMetadata,
    loading, setLoading,
    format, setFormat,
    quality, setQuality,
    videoFormat, setVideoFormat,
    audioQuality, setAudioQuality,
    subtitles, setSubtitles,
    subtitleLangs, setSubtitleLangs,
    sponsorblock, setSponsorblock,
    selectedVideos, setSelectedVideos,
    trimEnabled, setTrimEnabled,
    trimStart, setTrimStart,
    trimEnd, setTrimEnd
  } = useHomeStore();
  
  const navigate = useNavigate();
  const { addDownload, updateDownload } = useDownloadStore();
  const [playlistSearch, setPlaylistSearch] = useState("");

  const handlePaste = async () => {
    try {
      const text = await readText();
      if (text) setUrl(text);
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      toast.error("Failed to read clipboard.");
    }
  };

  const handleFetch = async () => {
    if (!url) return;
    setLoading(true);
    setMetadata(null);
    try {
      const data = await fetchMetadata(url);
      setMetadata(data);

      if (data.length > 1) {
        setSelectedVideos(new Set(data.map(item => item.id || item.url)));
      }

      if (data.length > 0 && data[0].resolutions && data[0].resolutions.length > 0) {
        const maxRes = Math.max(...data[0].resolutions);
        if (parseInt(quality) > maxRes) {
          setQuality(maxRes.toString());
        } else if (!data[0].resolutions.includes(parseInt(quality))) {
          // If the exact selected resolution isn't available, pick the closest one or max
          const closest = data[0].resolutions.find(r => r <= parseInt(quality)) || maxRes;
          setQuality(closest.toString());
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch metadata. Please verify the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!metadata || metadata.length === 0) return;
    
    navigate("/downloads");

    try {
      const options: DownloadOptions = { format, quality, videoFormat, audioQuality, subtitles, subtitleLangs, sponsorblock, trimEnabled, trimStart, trimEnd };
      
      const itemsToDownload = metadata.length === 1 
        ? metadata 
        : metadata.filter(item => selectedVideos.has(item.id || item.url));

      if (itemsToDownload.length === 0) {
        toast.error("No videos selected!");
        return;
      }
      
      for (const item of itemsToDownload) {
        // Fallback to random ID if missing
        const id = item.id || Math.random().toString(36).substring(7);
        
        addDownload({ 
          id, 
          url: item.url,
          title: item.title || "Unknown", 
          thumbnail: item.thumbnail,
          progress: 0, 
          status: "queued", 
          speed: "Waiting in queue...", 
          eta: "--:--", 
          size: "Unknown" 
        });

        downloadQueue.enqueue(async () => {
          updateDownload(id, { status: "downloading", speed: "Starting..." });
          return new Promise<void>((resolve) => {
            startDownload(
              item.url,
              options,
              (progress, speed, eta, size) => {
                updateDownload(id, { progress, speed, eta, size: size || `${progress}%` }); // Can refine size parsing later
              },
              (folderPath, finalSize) => {
                updateDownload(id, { status: "completed", progress: 100, eta: "", speed: "", path: folderPath, size: finalSize || "Done" });
                
                saveHistory({
                  id,
                  title: item.title,
                  url: item.url,
                  date: new Date().toLocaleString(),
                  size: finalSize || "Unknown",
                  status: "Completed",
                  path: folderPath
                });

                toast.success("Download Complete!");
                
                // Send native notification
                (async () => {
                  let permissionGranted = await isPermissionGranted();
                  if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                  }
                  if (permissionGranted) {
                    sendNotification({ title: 'Download Complete', body: `${item.title} has finished downloading.` });
                  }
                })();

                resolve();
              },
              (err) => {
                updateDownload(id, { status: 'error', error: err });
                toast.error("Download failed");
                
                // Send native notification
                (async () => {
                  let permissionGranted = await isPermissionGranted();
                  if (!permissionGranted) {
                    const permission = await requestPermission();
                    permissionGranted = permission === 'granted';
                  }
                  if (permissionGranted) {
                    sendNotification({ title: 'Download Failed', body: `${item.title} failed to download.` });
                  }
                })();

                resolve();
              }
            ).catch((err) => {
              console.error(err);
              updateDownload(id, { status: 'error', error: err?.toString() || "Unknown error" });
              resolve();
            });
          });
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start download");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">New Download</h1>
        <p className="text-muted-foreground">
          Enter a URL from YouTube or any supported site to fetch metadata and start downloading.
        </p>
      </div>

      <Card className="border-2 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-9 h-12 text-base"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              />
            </div>
            <Button variant="secondary" className="h-12 px-6" onClick={handlePaste}>
              <Clipboard className="w-4 h-4 mr-2" />
              Paste
            </Button>
            <Button className="h-12 px-8" onClick={handleFetch} disabled={loading || !url}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadIcon className="w-4 h-4 mr-2" />}
              Fetch
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {!metadata && !loading && (
        <div className="rounded-xl border-2 border-dashed h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
          <DownloadIcon className="w-8 h-8 opacity-20" />
          <p>Waiting for URL...</p>
        </div>
      )}

      {loading && (
        <div className="rounded-xl border-2 border-dashed h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
          <Loader2 className="w-8 h-8 animate-spin opacity-50" />
          <p>Fetching metadata...</p>
        </div>
      )}

      {metadata && !loading && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="md:col-span-1 overflow-hidden">
            {metadata.length === 1 ? (
              <>
                <img src={metadata[0].thumbnail} alt="Thumbnail" className="w-full aspect-video object-cover" />
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-bold leading-tight line-clamp-2">{metadata[0].title}</h3>
                  <p className="text-sm text-muted-foreground">{metadata[0].uploader}</p>
                  <div className="flex items-center text-xs text-muted-foreground bg-muted/50 w-fit px-2 py-1 rounded-md">
                    <Play className="w-3 h-3 mr-1" />
                    {metadata[0].duration_string}
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="p-0 h-full flex flex-col max-h-[300px]">
                <div className="p-4 border-b space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Playlist Detected</h3>
                      <p className="text-xs text-muted-foreground">{metadata.length} videos found.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="select-all" 
                        checked={selectedVideos.size === metadata.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedVideos(new Set(metadata.map(item => item.id || item.url)));
                          } else {
                            setSelectedVideos(new Set());
                          }
                        }}
                      />
                      <Label htmlFor="select-all" className="text-xs">Select All</Label>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search playlist..." 
                      className="pl-9 h-8 text-sm" 
                      value={playlistSearch}
                      onChange={(e) => setPlaylistSearch(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {metadata.filter(item => (item.title || "").toLowerCase().includes(playlistSearch.toLowerCase())).map((item) => {
                      const itemId = item.id || item.url;
                      return (
                        <div key={itemId} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <Checkbox 
                            id={`video-${itemId}`} 
                            checked={selectedVideos.has(itemId)}
                            onCheckedChange={(checked) => {
                              const newSet = new Set(selectedVideos);
                              if (checked) newSet.add(itemId);
                              else newSet.delete(itemId);
                              setSelectedVideos(newSet);
                            }}
                          />
                          <img src={item.thumbnail} alt="" className="w-12 h-8 object-cover rounded shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-none truncate" title={item.title}>{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{item.duration_string}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            )}
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Download Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={format} onValueChange={(v: "video" | "audio") => setFormat(v)}>
                    <SelectTrigger className="transition-all hover:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video (MP4/WebM)</SelectItem>
                      <SelectItem value="audio">Audio (MP3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <AnimatePresence mode="popLayout">
                  {format === 'video' && (
                    <>
                      <motion.div 
                        key="video-quality"
                        className="space-y-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Label>Quality</Label>
                        <Select value={quality} onValueChange={setQuality}>
                          <SelectTrigger className="transition-all hover:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                          {metadata[0]?.resolutions?.length ? (
                            metadata[0].resolutions.map(res => {
                              let label = `${res}p`;
                              if (res >= 2160) label = `4K (${res}p)`;
                              return (
                                <SelectItem key={res} value={res.toString()}>{label}</SelectItem>
                              );
                            })
                          ) : (
                            <>
                              <SelectItem value="2160">4K (2160p)</SelectItem>
                              <SelectItem value="1440">1440p</SelectItem>
                              <SelectItem value="1080">1080p</SelectItem>
                              <SelectItem value="720">720p</SelectItem>
                            </>
                          )}
                        </SelectContent>
                        </Select>
                      </motion.div>

                      <motion.div 
                        key="video-format"
                        className="space-y-2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Label>Video Format</Label>
                        <Select value={videoFormat} onValueChange={setVideoFormat}>
                          <SelectTrigger className="transition-all hover:border-primary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp4">MP4</SelectItem>
                            <SelectItem value="webm">WebM</SelectItem>
                            <SelectItem value="mkv">MKV</SelectItem>
                            <SelectItem value="avi">AVI</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    </>
                  )}

                  {format === 'audio' && (
                    <motion.div 
                      key="audio-quality"
                      className="space-y-2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label>Audio Bitrate</Label>
                      <Select value={audioQuality} onValueChange={setAudioQuality}>
                        <SelectTrigger className="transition-all hover:border-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="320K">320 kbps (Best)</SelectItem>
                          <SelectItem value="256K">256 kbps (High)</SelectItem>
                          <SelectItem value="192K">192 kbps (Standard)</SelectItem>
                          <SelectItem value="128K">128 kbps (Basic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <AnimatePresence>
                  {format !== 'audio' && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label htmlFor="subtitles" className="flex flex-col space-y-1">
                          <span>Embed Subtitles</span>
                          <span className="font-normal text-xs text-muted-foreground">Download and embed subtitles if available.</span>
                        </Label>
                        <Switch id="subtitles" checked={subtitles} onCheckedChange={setSubtitles} />
                      </div>
                      
                      <AnimatePresence>
                        {subtitles && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                            className="space-y-2 pl-1"
                          >
                            <Label className="text-xs text-muted-foreground">Language Codes (comma separated)</Label>
                            <Input value={subtitleLangs} onChange={e => setSubtitleLangs(e.target.value)} placeholder="en, es, ja" className="h-8 text-sm" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between pt-2">
                  <Label htmlFor="sponsorblock" className="flex flex-col space-y-1">
                    <span>SponsorBlock</span>
                    <span className="font-normal text-xs text-muted-foreground">Skip sponsored segments automatically.</span>
                  </Label>
                  <Switch id="sponsorblock" checked={sponsorblock} onCheckedChange={setSponsorblock} />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="trim" className="flex flex-col space-y-1">
                      <span>Trim Video</span>
                      <span className="font-normal text-xs text-muted-foreground">Download a specific time range.</span>
                    </Label>
                    <Switch id="trim" checked={trimEnabled} onCheckedChange={setTrimEnabled} />
                  </div>
                  
                  <AnimatePresence>
                    {trimEnabled && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="space-y-2">
                          <Label>Start Time</Label>
                          <Input value={trimStart} onChange={e => setTrimStart(e.target.value)} placeholder="00:00:00" />
                        </div>
                        <div className="space-y-2">
                          <Label>End Time</Label>
                          <Input value={trimEnd} onChange={e => setTrimEnd(e.target.value)} placeholder="00:01:00" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <Button className="w-full h-12 text-base mt-4" size="lg" onClick={handleDownload}>
                <DownloadIcon className="w-5 h-5 mr-2" />
                Start Download
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

