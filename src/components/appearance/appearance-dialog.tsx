"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { AppearancePreview } from "@/components/appearance/appearance-preview";
import { CustomAccentField } from "@/components/appearance/custom-accent-field";
import { ModePicker } from "@/components/appearance/mode-picker";
import { SchemeSwatches } from "@/components/appearance/scheme-swatches";
import { useAppearance } from "@/hooks/use-appearance";
import { DEFAULT_ACCENT } from "@/lib/appearance/preference";
import { CUSTOM_SCHEME } from "@/lib/appearance/schemes";
import { useAuth } from "@/context/auth-provider";

interface AppearanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Light/dark mode and the color scheme, with a live preview. A sheet on phones. */
export function AppearanceDialog({ open, onOpenChange }: AppearanceDialogProps) {
  const { user } = useAuth();
  const { choice, mode, selectScheme, setAccent, setMode } = useAppearance();

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Appearance</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {user
              ? "Pick a mode and a color. It's saved to your account, so your other devices match."
              : "Pick a mode and a color. It's saved on this device."}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-5 pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-0">
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Mode</h3>
            <ModePicker value={mode} onChange={setMode} />
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Color</h3>
            <SchemeSwatches value={choice.scheme} accent={choice.accent} onSelect={selectScheme} />
            {choice.scheme === CUSTOM_SCHEME && (
              <CustomAccentField value={choice.accent ?? DEFAULT_ACCENT} onChange={setAccent} />
            )}
          </section>
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
            <AppearancePreview />
          </section>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
