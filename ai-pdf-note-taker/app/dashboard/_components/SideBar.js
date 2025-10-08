import Image from "next/image";
import React from "react";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import UploadPdfDialog from "../_components/UploadPdfDialog";
import { Layout, Shield } from "lucide-react";

const SideBar = () => {
  return (
    <div className="shadow-sm h-screen flex flex-col items-start p-6 w-64 border-r border-gray-200">
      <Image
        src={"/logo.jpg"}
        width={500}
        height={148}
        alt="logo"
        className="mb-6 object-contain"
        priority
      />
      <div className="mt-6 w-full">
        <UploadPdfDialog>
          <Button className="w-full bg-black text-white hover:bg-black/90 rounded-lg px-4 py-2">
            + Upload PDF
          </Button>
        </UploadPdfDialog>
        <div className="flex gap-2 items-center p-3 mt-5 hover:bg-slate-100 rounded-lg cursor-pointer">
          <Layout />
          <h2>Workspace</h2>
        </div>
        <div className="flex gap-2 items-center p-3 hover:bg-slate-100 rounded-lg cursor-pointer">
          <Shield />
          <h2>Upgrade</h2>
        </div>
      </div>
      <div className="absolute bottom-24 w-[86%]">
        <Progress value={33} />
        <p className="text-sm mt-1">2 out 5 pdfs uploaded</p>
        <p className="text-sm text-gray-400 mt-2">
          Upgrade to Pro for more features
        </p>
      </div>
    </div>
  );
};

export default SideBar;
