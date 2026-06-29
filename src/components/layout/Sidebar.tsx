import { NavLink } from "react-router-dom";
import { Download, History, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Download, label: "Downloads", path: "/downloads" },
  { icon: History, label: "History", path: "/history" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="h-14 flex items-center px-6 border-b shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <img src={logo} alt="MediaFlow Logo" className="w-6 h-6 rounded-md object-contain" />
          MediaFlow
        </div>
      </div>
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
