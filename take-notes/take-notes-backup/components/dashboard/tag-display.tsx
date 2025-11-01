"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagDisplayProps {
  tags: string[];
  isPreview?: boolean;
  onRemoveTag?: (tag: string) => void;
  maxPreviewTags?: number;
  className?: string;
}

export function TagDisplay({
  tags,
  isPreview = false,
  onRemoveTag,
  maxPreviewTags = 3,
  className,
}: TagDisplayProps) {
  if (!tags || tags.length === 0) return null;

  const displayTags = isPreview ? tags.slice(0, maxPreviewTags) : tags;
  const remainingCount = isPreview
    ? Math.max(0, tags.length - maxPreviewTags)
    : 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {displayTags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs px-2 py-1 max-w-[120px]"
        >
          <span className="truncate">{tag}</span>
          {!isPreview && onRemoveTag && (
            <Button
              variant="ghost"
              size="sm"
              className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
              onClick={() => onRemoveTag(tag)}
            >
              <X className="h-2 w-2" />
            </Button>
          )}
        </Badge>
      ))}

      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs px-2 py-1">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
