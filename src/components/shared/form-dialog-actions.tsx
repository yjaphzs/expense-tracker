"use client";

import {
  ResponsiveDialogClose,
  ResponsiveDialogFooter,
  useResponsiveDialogIsDrawer,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";

interface FormDialogActionsProps {
  /** The `id` of the form this submits (the footer sits outside it so the body can scroll). */
  formId: string;
  submitLabel: string;
  disabled?: boolean;
}

/** Desktop: Cancel then Submit, right-aligned. Sheet: Submit on top, both full width. */
export function FormDialogActions({ formId, submitLabel, disabled }: FormDialogActionsProps) {
  const drawer = useResponsiveDialogIsDrawer();
  const size = drawer ? "h-11" : undefined;

  const cancel = (
    <ResponsiveDialogClose asChild>
      <Button type="button" variant="outline" className={size}>
        Cancel
      </Button>
    </ResponsiveDialogClose>
  );
  const submit = (
    <Button type="submit" form={formId} className={size} disabled={disabled}>
      {submitLabel}
    </Button>
  );

  return (
    <ResponsiveDialogFooter>
      {drawer ? submit : cancel}
      {drawer ? cancel : submit}
    </ResponsiveDialogFooter>
  );
}
