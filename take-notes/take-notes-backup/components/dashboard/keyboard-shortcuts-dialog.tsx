"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const shortcuts = [
    {
      category: "Formatting",
      items: [
        { keys: ["Ctrl", "B"], description: "Bold text" },
        { keys: ["Ctrl", "I"], description: "Italic text" },
        { keys: ["Ctrl", "U"], description: "Underline" },
        { keys: ["Ctrl", "K"], description: "Insert link" },
      ],
    },
    {
      category: "Navigation",
      items: [
        { keys: ["Ctrl", "N"], description: "New note" },
        { keys: ["Ctrl", "S"], description: "Save note" },
        { keys: ["Ctrl", "F"], description: "Search" },
        { keys: ["Esc"], description: "Close dialogs" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((section, index) => (
            <div key={section.category}>
              <h4 className="font-medium text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                {section.category}
              </h4>
              <div className="space-y-1.5">
                {section.items.map((shortcut, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge
                          key={keyIndex}
                          variant="outline"
                          className="text-xs px-1.5 py-0 h-5 font-mono"
                        >
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {index < shortcuts.length - 1 && <Separator className="mt-2" />}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
