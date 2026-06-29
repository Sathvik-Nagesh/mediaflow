import { FolderOpen, RotateCcw, Search, Trash2, History as HistoryIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Removing unused table imports

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getHistory, clearHistory, removeHistoryItem } from "@/lib/db";

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  date: string;
  size: string;
  status: string;
  path: string;
}

import { revealItemInDir } from "@tauri-apps/plugin-opener";

export default function History() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data as HistoryItem[]);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearAll = async () => {
    try {
      await clearHistory();
      setHistory([]);
      toast.success("History cleared");
    } catch (err) {
      toast.error("Failed to clear history");
    }
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeHistoryItem(id);
      setHistory(history.filter(h => h.id !== id));
      toast.success("Item removed from history");
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">History</h1>
          <p className="text-muted-foreground">Review your past downloads.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search history..." className="pl-9" />
          </div>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleClearAll} disabled={history.length === 0}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        {/* We use a standard table layout here */}
        <table className="w-full text-sm text-left">
          <thead className="border-b bg-muted/50 text-muted-foreground font-medium">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                    <p>Loading history...</p>
                  </div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <HistoryIcon className="w-12 h-12 opacity-20" />
                    <div>
                      <p className="text-lg font-medium text-foreground">No history found</p>
                      <p className="text-sm">Your completed downloads will appear here.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[300px] truncate" title={item.title}>
                    {item.title}
                    <div className="text-xs text-muted-foreground truncate font-normal">{item.url}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.size}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => item.path && revealItemInDir(item.path).catch(console.error)}>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Open Folder
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Redownload
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from History
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
