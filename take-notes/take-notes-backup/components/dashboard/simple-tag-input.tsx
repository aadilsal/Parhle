"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleTagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleTagInput({
  tags,
  onChange,
  placeholder = "Add tags...",
  className,
}: SimpleTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isInputVisible, setIsInputVisible] = useState(false);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
    }
    setInputValue("");
    setIsInputVisible(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Escape") {
      setInputValue("");
      setIsInputVisible(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 min-h-[32px]",
        className
      )}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="text-xs px-2 py-1 max-w-[120px] flex items-center gap-1"
        >
          <span className="truncate">{tag}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-3 w-3 p-0 hover:bg-transparent shrink-0"
            onClick={() => removeTag(tag)}
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      ))}

      {isInputVisible ? (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              addTag(inputValue);
            } else {
              setIsInputVisible(false);
            }
          }}
          placeholder={placeholder}
          className="h-6 w-32 text-xs border-dashed flex-shrink-0"
          autoFocus
        />
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsInputVisible(true)}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 shrink-0"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add tag
        </Button>
      )}
    </div>
  );
}
