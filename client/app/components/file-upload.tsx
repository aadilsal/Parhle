"use client";
import * as React from "react";
import { ArrowUpFromLine } from "lucide-react";

const FileUploadComponent: React.FC = () => {
  const handleFileUploadBtnClick = () => {
    const elem=document.createElement("input");
    elem.setAttribute("type","file");
    elem.setAttribute("accept","application/pdf");
    elem.addEventListener("change", (event) => {
        if(elem.files && elem.files.length > 0){
            console.log(elem.files);
            const file=elem.files.item(0);
            
        }
    });
    elem.click();
  };

  return (
    <div className="bg-slate-900 text-white shadow-2xl flex justify-center items-center p-4 rounded-lg border-white border-2">
      <div
        onClick={handleFileUploadBtnClick}
        className="flex justify-center items-center flex-col"
      >
        <h3>Upload PDF File</h3>
        <ArrowUpFromLine />
      </div>
    </div>
  );
};

export default FileUploadComponent;
