"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface PageSizeSelectProps {
  value: number;
  onChange: (size: number) => void;
}

/** "Show [5] per page" above a paginated list. */
export function PageSizeSelect({ value, onChange }: PageSizeSelectProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Show</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-9 w-[76px] text-sm md:h-7 md:w-[70px] md:text-xs" aria-label="Rows per page">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>per page</span>
    </div>
  );
}
