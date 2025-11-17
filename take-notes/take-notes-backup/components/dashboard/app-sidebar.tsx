"use client";

import type React from "react";
import { useState } from "react";
import {
  FileText,
  Star,
  Trash2,
  Plus,
  Folder,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import UploadPdfSheet from "./upload-pdf-sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Category, User } from "@/types";
import { useNotesStore } from "@/hooks/use-notes-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AppSidebarProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  user: User;
  onCreateCategory: (name: string) => void;
}

export function AppSidebar({
  categories,
  selectedCategory,
  onCategorySelect,
  user,
  onCreateCategory,
}: AppSidebarProps) {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const { createNote, notes } = useNotesStore();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      if (res.ok) {
        router.push("/"); // or your login page
      } else {
        toast.error("Failed to sign out");
      }
    } catch (e) {
      toast.error("Failed to sign out");
    }
  };

  const handleNavigateToQuizzes = () => {
    router.push("/quiz");
  };

  const handleNavigateToAnalytics = () => {
    router.push("/analytics");
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim());
      setNewCategoryName("");
      setIsCreatingCategory(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateCategory();
    } else if (e.key === "Escape") {
      setIsCreatingCategory(false);
      setNewCategoryName("");
    }
  };

  const mainItems = [
    {
      id: "all",
      label: "All Notes",
      icon: FileText,
      count: notes.filter((n) => !n.deletedAt).length,
    },
    {
      id: "favorites",
      label: "Favorites",
      icon: Star,
      count: notes.filter((n) => n.isFavorite && !n.deletedAt).length,
    },
    {
      id: "trash",
      label: "Trash",
      icon: Trash2,
      count: notes.filter((n) => n.deletedAt).length,
    },
  ];

  return (
    <Sidebar className="border-r bg-sidebar data-[mobile=true]:bg-sidebar">
      <SidebarHeader className="p-4 border-b bg-sidebar/95 backdrop-blur">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-purple-blue">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">Parhle</span>
        </div>

        <div className="mb-3">
          <UploadPdfSheet />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 overflow-hidden bg-sidebar/95">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={selectedCategory === item.id}
                    onClick={() => onCategorySelect(item.id)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-3" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigateToQuizzes}>
                  <BookOpen className="h-4 w-4" />
                  <span className="flex-1">Quizzes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigateToAnalytics}>
                  <BarChart3 className="h-4 w-4" />
                  <span className="flex-1">Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-3" />

        <SidebarGroup className="flex-1 overflow-hidden">
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Categories</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreatingCategory(true)}
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </SidebarGroupLabel>

          <SidebarGroupContent className="overflow-hidden">
            <div className="overflow-y-auto max-h-[300px] scrollbar-none">
              <SidebarMenu>
                {isCreatingCategory && (
                  <SidebarMenuItem>
                    <div className="px-2 py-1">
                      <Input
                        placeholder="Category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => {
                          if (!newCategoryName.trim()) {
                            setIsCreatingCategory(false);
                          }
                        }}
                        className="h-7 text-xs"
                        autoFocus
                      />
                    </div>
                  </SidebarMenuItem>
                )}

                {categories.map((category) => {
                  const categoryNotes = notes.filter(
                    (n) => n.categoryId === category.id && !n.deletedAt
                  );
                  return (
                    <SidebarMenuItem key={category.id}>
                      <SidebarMenuButton
                        isActive={selectedCategory === category.id}
                        onClick={() => onCategorySelect(category.id)}
                      >
                        <Folder className="h-4 w-4" />
                        <span className="flex-1 truncate">{category.name}</span>
                        {categoryNotes.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {categoryNotes.length}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}

                {categories.length === 0 && !isCreatingCategory && (
                  <SidebarMenuItem>
                    <div className="px-2 py-4 text-center text-muted-foreground">
                      <Folder className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No categories yet</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCreatingCategory(true)}
                        className="mt-2 h-6 text-xs"
                      >
                        Create your first category
                      </Button>
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t bg-sidebar/95">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start h-12 px-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-medium">
                    {user.user_metadata?.first_name?.[0] ||
                      user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-medium truncate">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
