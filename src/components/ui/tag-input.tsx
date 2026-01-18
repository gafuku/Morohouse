"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  allowNew?: boolean; // If false, can only select from suggestions
  className?: string;
}

export function TagInput({
  placeholder,
  value = [], // Ensure value is always an array
  onChange,
  suggestions = [],
  allowNew = true,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    (item) =>
      item.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(item)
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;

    // Check if duplicate
    if (value.includes(trimmed)) {
      setInputValue("");
      return;
    }

    // Validation for allowNew
    if (!allowNew) {
      // Must match a suggestion strictly (case-insensitive check usually good, but let's be strict or lenient?)
      // Requirement: "affiliations is created by admin" - implies strict selection.
      const match = suggestions.find(
        (s) => s.toLowerCase() === trimmed.toLowerCase()
      );
      if (!match) {
        // optionally show error or just ignore
        return;
      }
      // Use the canonical casing from suggestions
      onChange([...value, match]);
    } else {
      onChange([...value, trimmed]);
    }

    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  // Close suggestions on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="gap-1">
            {tag}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground outline-none"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          className="flex-1 border-0 focus-visible:ring-0 px-1 min-w-[120px] h-6"
          placeholder={value.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
        />
      </div>

      {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-auto py-1">
          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion}
              className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => addTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
          {allowNew &&
            inputValue &&
            !filteredSuggestions.find(
              (s) => s.toLowerCase() === inputValue.trim().toLowerCase()
            ) && (
              <div
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-muted-foreground font-medium"
                onClick={() => addTag(inputValue)}
              >
                Create "{inputValue}"
              </div>
            )}
        </div>
      )}

      {/* Show all suggestions on focus if input is empty? Optional but good for strict mode */}
      {showSuggestions && !inputValue && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-auto py-1">
          {suggestions
            .filter((s) => !value.includes(s))
            .map((suggestion) => (
              <div
                key={suggestion}
                className="cursor-pointer px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
