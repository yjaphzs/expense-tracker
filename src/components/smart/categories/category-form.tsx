"use client";

import { useId, useState, type FormEvent } from "react";

import { Field } from "@/components/smart/form/field";
import { Input } from "@/components/ui/input";
import { CATEGORY_ICON_CHOICES, DEFAULT_CATEGORY_ICON } from "@/lib/category-icons";
import { MAX_CATEGORY_NAME, validateCategoryName } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { CustomCategory, TransactionType } from "@/types/transaction";

interface CategoryFormProps {
  formId: string;
  type: TransactionType;
  custom: CustomCategory[];
  editing: CustomCategory | null;
  onSubmit: (name: string, icon: string) => void;
}

/** Name plus an icon picked from a grid. Names must be new for their type. */
export function CategoryForm({ formId, type, custom, editing, onSubmit }: CategoryFormProps) {
  const id = useId();
  const [name, setName] = useState(editing?.name ?? "");
  const [icon, setIcon] = useState(editing?.icon ?? DEFAULT_CATEGORY_ICON);
  const [touched, setTouched] = useState(false);
  const error = validateCategoryName(name, type, custom, editing?.id);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!error) onSubmit(name, icon);
  };

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-4">
      <Field id={`${id}-name`} label="Name">
        <Input
          id={`${id}-name`}
          value={name}
          maxLength={MAX_CATEGORY_NAME}
          placeholder={type === "expense" ? "e.g. Pets, Rent, Coffee" : "e.g. Side hustle, Bonus"}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={touched && !!error}
          aria-describedby={`${id}-error`}
          autoFocus
        />
        <p id={`${id}-error`} className="min-h-4 text-xs text-destructive">
          {touched ? error : null}
        </p>
      </Field>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-muted-foreground">Icon</legend>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Object.entries(CATEGORY_ICON_CHOICES).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              aria-pressed={icon === key}
              onClick={() => setIcon(key)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border transition-colors",
                icon === key ? "border-primary bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              <Icon className="size-5" />
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
