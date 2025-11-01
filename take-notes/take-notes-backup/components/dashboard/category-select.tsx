"use client";

import { useState } from "react";
import { Check, ChevronDown, Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategorySelectProps {  
  categories: Category[];
  value: string;
  onValueChange: (value: string) => void;
  onCreateCategory?: (name: string) => void;
}

export function CategorySelect({
  categories,
  value,
  onValueChange,
  onCreateCategory,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedCategory = categories.find((cat) => cat.id === value);

  const handleCreateCategory = () => {
    if (searchValue.trim() && onCreateCategory) {
      onCreateCategory(searchValue.trim());
      setSearchValue("");
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 justify-between text-xs px-3 min-w-[120px]"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Folder className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {selectedCategory ? selectedCategory.name : "No category"}
            </span>
          </div>
          <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search categories..."
            className="h-8 text-xs"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-2 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  No categories found
                </p>
                {searchValue.trim() && onCreateCategory && (
                  <Button
                    onClick={handleCreateCategory}
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create "{searchValue}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onValueChange("");
                  setOpen(false);
                }}
                className="text-xs"
              >
                <Check
                  className={cn(
                    "mr-2 h-3 w-3",
                    value === "" ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground">No category</span>
              </CommandItem>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.id}
                  onSelect={() => {
                    onValueChange(category.id);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Folder className="mr-2 h-3 w-3" />
                  <span className="truncate">{category.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
