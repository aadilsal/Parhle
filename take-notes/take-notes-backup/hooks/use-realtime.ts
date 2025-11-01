"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useRealtime(noteId?: string) {
  const [isOnline, setIsOnline] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!noteId) return;

    // Subscribe to real-time changes for the note
    const channel = supabase
      .channel(`note-${noteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `id=eq.${noteId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            toast("This note was updated by another user");
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setActiveUsers(users);
        setIsConnected(true);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        toast(`${key} is now viewing this note`);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        toast(`${key} stopped viewing this note`);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track presence
          await channel.track({
            user_id: "current-user", // Replace with actual user ID
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [noteId, supabase, toast]);

  return {
    isOnline,
    isConnected,
    activeUsers,
  };
}
