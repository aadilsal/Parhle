"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useSidebar } from "@/components/ui/sidebar";
import { useNotesStore } from "@/hooks/use-notes-store";
import { toast } from "sonner";

export function UploadPdfSheet() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { setNotes, setSelectedNote } = useNotesStore();
  const { isMobile, setOpen: setSidebarOpen, setOpenMobile } = useSidebar();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleCreateBlank = async () => {
    // Create blank note using store action
    const { createNote } = useNotesStore.getState();
    await createNote();
    setOpen(false);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please choose a PDF file to upload");
      return;
    }

    try {
      setIsUploading(true);
      // Step 1: request a signed upload token/url from the server
      console.log("[upload-pdf-sheet] requesting presign for", file.name);
      const presignRes = await fetch("/api/upload/pdf/presign", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      const presignPayload = await presignRes.json();
      console.log("[upload-pdf-sheet] presign response status:", presignRes.status, "payload:", presignPayload);
      if (!presignRes.ok) {
        console.error("[upload-pdf-sheet] presign failed", presignPayload);
        throw new Error(presignPayload?.error || "Presign failed");
      }

      const { signedUrl, token, path } = presignPayload.data || presignPayload?.data || {};
      // `data` shape: { signedUrl, path, token }
      console.log("[upload-pdf-sheet] presign returned", { signedUrl, token: !!token, path });
      if (!token || !path) {
        console.error("[upload-pdf-sheet] presign missing token/path", presignPayload);
        throw new Error("Presign response missing token/path");
      }

      // Step 2: upload the file to the signed url using the client-side supabase storage helper
      console.log("[upload-pdf-sheet] uploading to signed url, path:", path);
      const supabaseClient = createClient();
      const bucketId = "pdfs";

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from(bucketId)
        .uploadToSignedUrl(path, token, file as unknown as Blob);

      console.log("[upload-pdf-sheet] upload result", { uploadData, uploadError });
      if (uploadError) {
        throw new Error(uploadError.message || "Upload to signed url failed");
      }

      // Step 3: tell the server to create the note row referencing the uploaded file
      console.log("[upload-pdf-sheet] calling /api/upload/pdf/complete with path", path);
      const completeRes = await fetch("/api/upload/pdf/complete", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, title: file.name }),
      });

      const payload = await completeRes.json();
      console.log("[upload-pdf-sheet] /complete response status:", completeRes.status, "payload:", payload);
      if (!completeRes.ok) {
        console.error("[upload-pdf-sheet] complete failed", payload);
        throw new Error(payload?.error || "Failed to create note");
      }

      const noteData = payload.note;
      console.log("[upload-pdf-sheet] noteData received:", noteData);
      if (noteData) {
        const newNote = {
          id: noteData.id,
          userId: noteData.user_id,
          title: noteData.title,
          content: noteData.content,
          categoryId: noteData.category_id,
          tags: noteData.tags || [],
          isFavorite: noteData.is_favorite,
          deletedAt: noteData.deleted_at,
          createdAt: noteData.created_at,
          updatedAt: noteData.updated_at,
        };

        const { notes: currentNotes } = useNotesStore.getState();
        setNotes([newNote, ...currentNotes]);
        console.log("[upload-pdf-sheet] setting selected note:", newNote.id, "content length:", newNote.content?.length ?? 0);
        setSelectedNote(newNote);
        // Ensure the note editor / chat is visible after upload.
        // On desktop, expand the sidebar so the editor area is visible; on mobile, close the mobile sidebar
        // so the editor takes the full screen. This makes the chat visible immediately after upload.
        try {
          if (isMobile) {
            setOpenMobile(false)
          } else {
            console.log("[upload-pdf-sheet] opening sidebar (desktop)");
            setSidebarOpen(true)
          }
        } catch (e) {
          // ignore if sidebar context isn't available for some reason
        }
      }

      toast.success("PDF uploaded and note created");
      setFile(null);
      setOpen(false);
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full">+ New Note</Button>
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create or Import</SheetTitle>
          <SheetDescription>
            Create a blank note or import a PDF to extract content.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Import PDF</label>
              <Input type="file" accept="application/pdf" onChange={handleFileChange} />
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload & Create Note"}
              </Button>
              <Button variant="outline" onClick={handleCreateBlank}>
                Create Blank Note
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter>
          <div className="text-sm text-muted-foreground">You can upload PDFs here and Parhle will create a new note for the file.</div>
        </SheetFooter>
      </SheetContent>
      {/* Chat is rendered inline in the note editor when applicable. */}
    </Sheet>
  );
}

export default UploadPdfSheet;
