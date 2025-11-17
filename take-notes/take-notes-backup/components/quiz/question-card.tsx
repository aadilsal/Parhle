"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  question: any;
  value: any;
  onChange: (val: any) => void;
};

export default function QuestionCard({ question, value, onChange }: Props) {
  if (!question) return null;

  const { type } = question;

  if (type === "mcq") {
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium leading-relaxed">
          {question.question}
        </div>

        <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
          {(question.options || []).map((opt: string, i: number) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value={opt} id={`option-${i}`} />
              <Label
                htmlFor={`option-${i}`}
                className="flex-1 cursor-pointer text-sm leading-relaxed"
              >
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  }

  if (type === "tf") {
    return (
      <div className="space-y-4">
        <div className="text-lg font-medium leading-relaxed">
          {question.question}
        </div>

        <div className="flex gap-4">
          <Button
            variant={value === "True" ? "default" : "outline"}
            onClick={() => onChange("True")}
            className="flex-1"
            size="lg"
          >
            True
          </Button>
          <Button
            variant={value === "False" ? "default" : "outline"}
            onClick={() => onChange("False")}
            className="flex-1"
            size="lg"
          >
            False
          </Button>
        </div>
      </div>
    );
  }

  // short / essay
  return (
    <div className="space-y-4">
      <div className="text-lg font-medium leading-relaxed">
        {question.question}
      </div>

      <Textarea
        placeholder="Type your answer here..."
        className="min-h-32 resize-none"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="text-sm text-muted-foreground">
        {type === "essay" ? "Provide a detailed answer" : "Keep your answer concise"}
      </div>
    </div>
  );
}
