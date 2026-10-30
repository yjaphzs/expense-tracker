"use client";

import { DatePickerField } from "@/components/shared/date-picker-field";
import { TypeToggle } from "@/components/smart/form/type-toggle";
import { addInterval } from "@/lib/recurring-schedule";
import type { RecurrenceFrequency } from "@/types/transaction";

interface EndsFieldProps {
  id: string;
  startDate: string;
  frequency: RecurrenceFrequency;
  /** Last date it may add a transaction on; undefined repeats forever. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

/** "Ends: Never / On date" for recurring items (subscriptions and installments end). */
export function EndsField({ id, startDate, frequency, value, onChange }: EndsFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <TypeToggle
        label="Ends"
        value={value ? "date" : "never"}
        options={[
          { value: "never", label: "Never" },
          { value: "date", label: "On a date" },
        ]}
        onChange={(choice) =>
          // Default to a sensible end: one interval after the start.
          onChange(choice === "never" ? undefined : addInterval(startDate, frequency))
        }
      />
      {value && (
        <>
          <label htmlFor={id} className="sr-only">
            End date
          </label>
          <DatePickerField id={id} value={value < startDate ? startDate : value} onChange={onChange} min={startDate} />
        </>
      )}
    </div>
  );
}
