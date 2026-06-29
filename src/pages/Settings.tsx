import { useState, useEffect } from "react";
import { Folder, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { open } from "@tauri-apps/plugin-dialog";
import { downloadDir, join } from "@tauri-apps/api/path";
import { getSetting, saveSetting } from "@/lib/db";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function Settings() {
  const [downloadPath, setDownloadPath] = useState("");
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    async function loadSettings() {
      const baseDir = await downloadDir();
      const defaultDir = await join(baseDir, 'MediaFlow');
      const savedPath = await getSetting('download-path', defaultDir);
      setDownloadPath(savedPath);
    }
    loadSettings();
  }, []);

  const handleBrowse = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && !Array.isArray(selected)) {
        setDownloadPath(selected);
        await saveSetting('download-path', selected);
        toast.success("Download path updated");
      }
    } catch (err) {
      toast.error("Failed to select folder");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your download preferences and application behavior.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic application settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="download-path">Default Download Path</Label>
              <div className="flex gap-2">
                <Input id="download-path" value={downloadPath} readOnly />
                <Button variant="secondary" onClick={handleBrowse}>
                  <Folder className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">Select the application theme.</p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System Default</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Download Defaults</CardTitle>
            <CardDescription>Default settings for new downloads.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Default Format</Label>
                <p className="text-sm text-muted-foreground">Preferred media format when fetching.</p>
              </div>
              <Select defaultValue="video">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video (MP4/WebM)</SelectItem>
                  <SelectItem value="audio">Audio Only (MP3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Download Subtitles</Label>
                <p className="text-sm text-muted-foreground">Automatically fetch subtitles if available.</p>
              </div>
              <Switch id="subtitles" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SponsorBlock</Label>
                <p className="text-sm text-muted-foreground">Skip or remove sponsored segments automatically.</p>
              </div>
              <Switch id="sponsorblock" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced</CardTitle>
            <CardDescription>Advanced yt-dlp and ffmpeg configurations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="concurrent">Concurrent Downloads</Label>
              <Select defaultValue="3">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
