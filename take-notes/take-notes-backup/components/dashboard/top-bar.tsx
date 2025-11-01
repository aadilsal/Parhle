"use client";

import type { User } from "@supabase/supabase-js";
import { Search, Moon, Sun, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: User;
  onBackToList?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function TopBar({
  searchQuery,
  onSearchChange,
  user,
  onBackToList,
  showBackButton = false,
  className,
}: TopBarProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "h-12 sm:h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-3 sm:px-4 gap-3 shrink-0 justify-between",
        className
      )}
    >
      {/* Left controls */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToList}
            className="h-8 w-8 p-0 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <SidebarTrigger className="h-8 w-8 p-0" />
      </div>

      {/* Center search bar */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes, tags, content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 sm:pl-10 h-8 sm:h-9 text-xs sm:text-sm w-full"
          />
        </div>
      </div>

      {/* Right theme toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 p-0 shrink-0"
        >
          <Sun className="h-3 w-3 sm:h-4 sm:w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3 w-3 sm:h-4 sm:w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </div>
  );
}
