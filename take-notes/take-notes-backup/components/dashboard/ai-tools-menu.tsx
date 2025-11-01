"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sparkles, FileText, Wand2, Languages, Tags } from "lucide-react";

interface AIToolsMenuProps {
  onSummarize: () => void;
  onRephrase: (style: "formal" | "informal" | "concise" | "extended") => void;
  onTranslate: (language: string) => void;
  onGenerateTemplate: (
    type: "meeting" | "project" | "daily" | "research"
  ) => void;
  onGenerateTags: () => void;
  isLoading?: boolean;
}

export function AIToolsMenu({
  onSummarize,
  onRephrase,
  onTranslate,
  onGenerateTemplate,
  onGenerateTags,
  isLoading = false,
}: AIToolsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="h-8 text-xs px-3"
        >
          <Sparkles className="h-3 w-3 mr-1.5" />
          AI
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onClick={onSummarize} className="text-sm">
          <FileText className="h-4 w-4 mr-3" />
          Summarize
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-sm">
            <Wand2 className="h-4 w-4 mr-3" />
            Rephrase
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <DropdownMenuItem
              onClick={() => onRephrase("formal")}
              className="text-sm"
            >
              Make Formal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRephrase("informal")}
              className="text-sm"
            >
              Make Informal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRephrase("concise")}
              className="text-sm"
            >
              Make Concise
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onRephrase("extended")}
              className="text-sm"
            >
              Extend Text
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-sm">
            <Languages className="h-4 w-4 mr-3" />
            Translate
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-36">
            <DropdownMenuItem
              onClick={() => onTranslate("Spanish")}
              className="text-sm"
            >
              Spanish
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onTranslate("French")}
              className="text-sm"
            >
              French
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onTranslate("German")}
              className="text-sm"
            >
              German
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onTranslate("Italian")}
              className="text-sm"
            >
              Italian
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="text-sm">
            <FileText className="h-4 w-4 mr-3" />
            Templates
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            <DropdownMenuItem
              onClick={() => onGenerateTemplate("meeting")}
              className="text-sm"
            >
              Meeting Notes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGenerateTemplate("project")}
              className="text-sm"
            >
              Project Plan
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGenerateTemplate("daily")}
              className="text-sm"
            >
              Daily Journal
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGenerateTemplate("research")}
              className="text-sm"
            >
              Research Notes
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onGenerateTags} className="text-sm">
          <Tags className="h-4 w-4 mr-3" />
          Generate Tags
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
