"use client";

import React, { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    let mounted = true;

    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) setUser((data && data.user) || null);
      } catch (e) {
        // ignore
      }
    }

    loadUser();

    // listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Minimal placeholders for categories and handlers so AppSidebar can render before data
  const categories: any[] = [];
  const handleCategorySelect = (_id: string | null) => {};
  const handleCreateCategory = () => {};

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          categories={categories}
          selectedCategory={null}
          onCategorySelect={() => handleCategorySelect(null)}
          user={
            user || {
              id: "",
              app_metadata: {},
              user_metadata: {},
              aud: "",
              created_at: "",
              email: "",
            } as unknown as User
          }
          onCreateCategory={handleCreateCategory}
        />

        <SidebarInset className="flex flex-col min-h-screen">
          <TopBar
            searchQuery=""
            onSearchChange={() => {}}
            user={
              user || ({ email: "", id: "" } as unknown as User)
            }
          />

          <main className={cn("flex-1 bg-background/50 p-4")}>{children}</main>

          <footer className="border-t bg-background/95 p-3 text-sm text-muted-foreground">
            <div className="container mx-auto px-4 flex items-center justify-between">
              <div>© {new Date().getFullYear()} Parhle</div>
              <div className="flex items-center gap-4">
                <a href="/settings" className="underline">Settings</a>
                <a href="/analytics" className="underline">Analytics</a>
              </div>
            </div>
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
