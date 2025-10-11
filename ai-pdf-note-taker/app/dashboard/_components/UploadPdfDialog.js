"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2Icon } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "../../../components/ui/toast";

const UploadPdfDialog = ({ children }) => {
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const insertFileEntry = useMutation(api.fileStorage.addFileEntryToDb);
  const getFileURL = useMutation(api.fileStorage.getFileURL);
  const processPdf = useAction(api.myActions.processPdfWithEmbeddings);

  const {user}=useUser();
  
  const toast = useToast();
  
  const [file, setFile] = useState();
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [open, setOpen] = useState(false);

  const onFileSelect = (event) => {
    const f = event.target.files[0];
    setFile(f);
    if (f) setFileName(f.name);
  };
  const onUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file?.type },
        body: file,
      });
      const { storageId } = await result.json();
      // Generate unique fileID - use crypto.randomUUID() if available, otherwise fallback to timestamp + random
      const fileID = (typeof crypto !== "undefined" && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const fileUrl = await getFileURL({ storageID: storageId });
      const resp = await insertFileEntry({
        fileID: fileID,
        storageID: storageId,
        fileName: fileName,
        fileUrl: fileUrl,
        createdBy: user?.primaryEmailAddress?.emailAddress,
      });
      console.log({ resp });
      
      // show success toast and close dialog on success
      if (resp && resp.success) {
        toast.push({ title: "Upload complete", description: `${fileName} uploaded successfully`, variant: "success" });
        setOpen(false);
        
        // Process PDF in background: extract text, generate embeddings, store in vector DB
        toast.push({ title: "Processing PDF", description: "Extracting text and generating embeddings...", variant: "info" });
        
        // Call Convex action to process PDF asynchronously
        processPdf({
          fileUrl: fileUrl,
          fileID: fileID,
          fileName: fileName,
          createdBy: user?.primaryEmailAddress?.emailAddress,
        })
          .then((result) => {
            if (result.success) {
              toast.push({ 
                title: "Processing complete", 
                description: `${result.chunksProcessed} chunks processed, ${result.embeddingsStored} embeddings stored`, 
                variant: "success" 
              });
            } else {
              toast.push({ 
                title: "Processing failed", 
                description: result.error || "Unknown error", 
                variant: "error" 
              });
            }
          })
          .catch((error) => {
            console.error("PDF processing error:", error);
            toast.push({ 
              title: "Processing failed", 
              description: error?.message || String(error), 
              variant: "error" 
            });
          });
      } else {
        toast.push({ title: "Upload failed", description: "Server did not confirm upload", variant: "error" });
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.push({ title: "Upload failed", description: err?.message || String(err), variant: "error" });
    } finally {
      setLoading(false);
    }
  };
  const hiddenFileInput = useRef(null);

  function openFilePicker() {
    hiddenFileInput.current?.click?.();
  }

  // Reset form when the dialog is opened (remove previous upload)
  useEffect(() => {
    if (open) {
      setFile(undefined);
      setFileName("");
      try {
        if (hiddenFileInput.current) hiddenFileInput.current.value = "";
      } catch (e) {
        // ignore
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <div className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Upload PDF File</DialogTitle>
          </DialogHeader>

          <div className="mt-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Select a PDF file to upload. The document will be processed and
              summarized into notes.
            </p>
          </div>

          <div className="grid gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Select File to Upload</span>
              <div className="flex items-center gap-3">
                <input
                  ref={hiddenFileInput}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => onFileSelect(event)}
                  className="hidden"
                />
                <Button onClick={openFilePicker} className="px-4">
                  Choose file
                </Button>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600">{file?.name || "No file chosen"}</div>
                </div>
              </div>
            </label>

            <div>
              <label className="text-sm font-medium">File name</label>
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} type="text" className="mt-1" />
            </div>

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button disabled={!file || loading} className="bg-black text-white" onClick={onUpload}>
                {loading ? <Loader2Icon className="animate-spin" /> : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPdfDialog;
