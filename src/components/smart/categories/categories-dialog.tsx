"use client";

import { useEffect, useId, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { FormDialogActions } from "@/components/shared/form-dialog-actions";
import { CategoryForm } from "@/components/smart/categories/category-form";
import { EXPENSE_INCOME, TypeToggle } from "@/components/smart/form/type-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategoryIcon, useTracker } from "@/context/tracker-context";
import { builtInCategories, categoryUsage } from "@/lib/categories";
import type { CustomCategory, TransactionType } from "@/types/transaction";

type View = { kind: "list" } | { kind: "form"; editing: CustomCategory | null };

/** Your own categories next to the built-in ones: add, rename, change the icon, delete when unused. */
export default function CategoriesDialog() {
  const { data, dialogs, actions } = useTracker();
  const iconFor = useCategoryIcon();
  const formId = useId();
  const { open, addType } = dialogs.categories;
  const [type, setType] = useState<TransactionType>("expense");
  const [view, setView] = useState<View>({ kind: "list" });

  useEffect(() => {
    if (!open) return;
    setType(addType ?? "expense");
    setView(addType ? { kind: "form", editing: null } : { kind: "list" });
  }, [open, addType]);

  const mine = data.categories.filter((c) => c.type === type);
  const close = () => dialogs.setCategoriesOpen(false);

  const submit = (name: string, icon: string) => {
    if (view.kind !== "form") return;
    if (view.editing) {
      actions.editCategory(view.editing.id, name, icon);
    } else {
      const created = actions.addCategory(name, type, icon);
      const onCreated = dialogs.onCategoryCreated.current;
      dialogs.onCategoryCreated.current = null;
      if (onCreated) {
        onCreated(created);
        return close();
      }
    }
    setView({ kind: "list" });
  };

  const form = view.kind === "form";
  return (
    <ResponsiveDialog open={open} onOpenChange={dialogs.setCategoriesOpen}>
      <ResponsiveDialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{form ? (view.editing ? "Edit category" : "New category") : "Categories"}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {form ? `For ${type === "expense" ? "expenses" : "income"}.` : "Add your own categories next to the built-in ones."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-4">
          {form ? (
            <CategoryForm key={view.editing?.id ?? "new"} formId={formId} type={type} custom={data.categories} editing={view.editing} onSubmit={submit} />
          ) : (
            <>
              <TypeToggle label="Type" value={type} options={EXPENSE_INCOME} onChange={setType} />
              {mine.length === 0 && <p className="text-sm text-muted-foreground">No custom categories yet.</p>}
              <ul className="flex flex-col gap-2">
                {mine.map((category) => {
                  const Icon = iconFor(category.name);
                  const uses = categoryUsage(category.name, category.type, data);
                  return (
                    <li key={category.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
                      {uses > 0 && <Badge variant="outline" className="text-xs md:text-[10px]">In use</Badge>}
                      <Button variant="ghost" size="icon-sm" className="max-md:size-10" aria-label={`Edit ${category.name}`} onClick={() => setView({ kind: "form", editing: category })}>
                        <PencilIcon />
                      </Button>
                      {uses === 0 && (
                        <Button variant="ghost" size="icon-sm" className="text-destructive max-md:size-10" aria-label={`Delete ${category.name}`} onClick={() => actions.removeCategory(category.id)}>
                          <Trash2Icon />
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted-foreground">Built-in: {builtInCategories(type).join(", ")}.</p>
            </>
          )}
        </ResponsiveDialogBody>
        {form ? (
          <FormDialogActions formId={formId} submitLabel={view.editing ? "Save Changes" : "Add category"} />
        ) : (
          <ResponsiveDialogFooter>
            <Button variant="outline" className="max-md:h-11" onClick={() => setView({ kind: "form", editing: null })}>
              <PlusIcon className="size-4" />
              New category
            </Button>
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
