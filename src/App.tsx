import { useEffect, useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import Home from "./pages/Home";
import Downloads from "./pages/Downloads";
import History from "./pages/History";
import Settings from "./pages/Settings";
import { checkYtDlp } from "./lib/ytdlp";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

function App() {
  const [missingYtdlp, setMissingYtdlp] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Ensure splash screen is visible for at least 1.5s for a smooth transition
    const minWait = new Promise(resolve => setTimeout(resolve, 1500));
    Promise.all([checkYtDlp(), minWait]).then(([isInstalled]) => {
      if (!isInstalled) setMissingYtdlp(true);
      setIsChecking(false);
    });
  }, []);

  if (isChecking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground space-y-6">
        <motion.img 
          src={logo} 
          alt="MediaFlow Logo" 
          className="w-24 h-24 object-contain rounded-2xl shadow-xl"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center space-y-2"
        >
          <h1 className="text-2xl font-bold tracking-tight">MediaFlow</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Checking dependencies...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="history" element={<History />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>

      <Toaster />

      <Dialog open={missingYtdlp} onOpenChange={setMissingYtdlp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>yt-dlp Not Found</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 mt-4">
                <p>
                  MediaFlow requires <strong>yt-dlp</strong> to be installed on your system to function properly.
                </p>
                <div className="bg-muted p-4 rounded-md text-sm text-foreground border">
                  <p className="font-semibold mb-2">Installation Commands (Terminal):</p>
                  <ul className="space-y-2">
                    <li><strong>Windows (winget):</strong> <code className="bg-background px-1 py-0.5 rounded border">winget install yt-dlp</code></li>
                    <li><strong>Windows (Scoop):</strong> <code className="bg-background px-1 py-0.5 rounded border">scoop install yt-dlp</code></li>
                    <li><strong>macOS (Homebrew):</strong> <code className="bg-background px-1 py-0.5 rounded border">brew install yt-dlp</code></li>
                    <li><strong>Linux (Ubuntu/Debian):</strong> <code className="bg-background px-1 py-0.5 rounded border">sudo apt install yt-dlp</code></li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  * Note: For advanced features like Video Trimming, you must also install <strong>ffmpeg</strong>.
                  After installing, you may need to restart MediaFlow.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setMissingYtdlp(false)}>I understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;

