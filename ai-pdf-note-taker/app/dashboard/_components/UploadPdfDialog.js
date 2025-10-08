"use client";
import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2Icon } from "lucide-react";

const UploadPdfDialog = ({ children }) => {
  const generateUploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const insertFileEntry = useMutation(api.pdfFiles.addFileEntry);
  const [file, setFile] = useState();
  const [loading, setLoading] = useState(false);
  const onFileSelect = (event) => {
    setFile(event.target.files[0]);
  };
  const onUpload = async () => {
    setLoading(true);
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file?.type },
        body: file,
      });
      const { storageId } = await result.json();
      console.log({ storageId });
      const fileID=
      setLoading(false);
  };
  const hiddenFileInput = useRef(null);

  function openFilePicker() {
    hiddenFileInput.current?.click?.();
  }

  return (
    <Dialog>
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
                  onChange={onFileSelect}
                  className="hidden"
                />
                <Button onClick={openFilePicker} className="px-4">
                  Choose file
                </Button>
                <div className="text-sm text-gray-600">
                  {file?.name || "No file chosen"}
                </div>
              </div>
            </label>

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button className="bg-black text-white" onClick={onUpload}>
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
