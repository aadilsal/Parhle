"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Construction, Users, Share, Link2 } from "lucide-react";

interface FeatureNotReadyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

const featureIcons = {
  collaboration: Users,
  share: Share,
  "copy link": Link2,
};

const featureDescriptions = {
  collaboration:
    "Real-time collaboration with team members will be available soon.",
  share: "Share your notes with others via public links.",
  "copy link": "Generate shareable links for your notes.",
};

export function FeatureNotReadyDialog({
  open,
  onOpenChange,
  feature,
}: FeatureNotReadyDialogProps) {
  const Icon =
    featureIcons[feature as keyof typeof featureIcons] || Construction;
  const description =
    featureDescriptions[feature as keyof typeof featureDescriptions] ||
    `The ${feature} feature is currently under development.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-4">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-2">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-base">Coming Soon</DialogTitle>
          <DialogDescription className="text-sm text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="px-6"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
