"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { parseLocalDate, toLocalDateStr } from "@/lib/recurring-schedule";

interface DatePickerFieldProps {
  id?: string;
  /** "YYYY-MM-DD" */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable date ("YYYY-MM-DD"). */
  min?: string;
}

/** A button showing the date that opens a calendar; works inside dialogs and sheets. */
export function DatePickerField({ id, value, onChange, min }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseLocalDate(value);
  const [month, setMonth] = useState(selected);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setMonth(selected);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button id={id} type="button" variant="outline" className="w-full justify-between font-normal">
          {selected.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
          <CalendarIcon className="size-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start" sideOffset={8}>
        <Calendar
          mode="single"
          selected={selected}
          month={month}
          onMonthChange={setMonth}
          disabled={min ? { before: parseLocalDate(min) } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(toLocalDateStr(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
