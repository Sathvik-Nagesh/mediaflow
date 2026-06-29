import { Play, Pause, X, AlertTriangle, FolderOpen, Download as DownloadIcon } from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDownloadStore } from "@/store/useDownloadStore";
import { motion, AnimatePresence } from "framer-motion";

export default function Downloads() {
  const { downloads, removeDownload, pauseDownload } = useDownloadStore();
  const downloadList = Object.values(downloads).sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground">Manage your active and queued downloads.</p>
      </div>

      <div className="space-y-4">
        {downloadList.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl space-y-4"
          >
            <DownloadIcon className="w-12 h-12 opacity-20" />
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">No active downloads</p>
              <p className="text-sm">Head to the home page to start one.</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {downloadList.map((dl) => (
            <motion.div
              key={dl.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium truncate pr-4" title={dl.title}>{dl.title}</h3>
                        <div className="text-sm font-medium whitespace-nowrap">
                          {dl.status === "completed" ? "Done" : 
                           dl.status === "error" ? "Error" : 
                           dl.status === "queued" ? "Queued" :
                           `${Math.round(dl.progress)}%`}
                        </div>
                      </div>
                      
                      <Progress 
                        value={dl.progress} 
                        className={`h-2 mb-2 ${dl.status === 'error' ? 'bg-destructive/20 [&>div]:bg-destructive' : ''}`} 
                      />
                      
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="capitalize">{dl.status}</span>
                          {dl.status === "downloading" && <span>{dl.speed}</span>}
                          {dl.status === "error" && <span className="text-destructive flex items-center"><AlertTriangle className="w-3 h-3 mr-1" /> {dl.error}</span>}
                        </div>
                        <div className="flex gap-4">
                          {dl.status === "downloading" && <span>ETA: {dl.eta}</span>}
                          <span>{dl.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-4 border-l">
                      {dl.status === "downloading" && (
                        <Button variant="ghost" size="icon" title="Pause / Stop" onClick={() => pauseDownload(dl.id)}>
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      {dl.status === "paused" && (
                        <Button variant="ghost" size="icon" title="Resume is not fully supported natively yet" disabled>
                          <Play className="w-4 h-4 opacity-50" />
                        </Button>
                      )}
                      {dl.status === "completed" && (
                        <>
                          <Button variant="ghost" size="icon" title="Open Folder" onClick={() => dl.path && revealItemInDir(dl.path).catch(console.error)}>
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Clear from queue" onClick={() => removeDownload(dl.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {dl.status !== "completed" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive" 
                          title="Cancel/Remove"
                          onClick={() => removeDownload(dl.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
