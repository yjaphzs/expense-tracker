import {
  DownloadIcon,
  FileSpreadsheetIcon,
  ImportIcon,
  PiggyBankIcon,
  QrCodeIcon,
  RotateCcw,
  SaveAllIcon,
  SaveIcon,
  TagsIcon,
} from "lucide-react";

import type { MenuGroup } from "@/components/shared/menu-types";
import type { Tracker } from "@/context/tracker-context";

/**
 * The ⋯ menu: a dropdown beside Add/Reset on desktop, and on phones a bottom
 * sheet that also carries Reset (Add is the floating button there, and Reset
 * shouldn't sit next to it).
 */
export function dataMenuGroups({ data, dialogs, actions }: Tracker, sheet: boolean): MenuGroup[] {
  const groups: MenuGroup[] = [
    {
      id: "data",
      label: sheet ? "Move your data" : undefined,
      items: [
        { kind: "action", id: "import", label: "Import backup", icon: ImportIcon, onSelect: actions.importBackup },
        { kind: "action", id: "export", label: "Export backup", icon: DownloadIcon, onSelect: actions.exportBackup },
        { kind: "action", id: "csv", label: "Import CSV", icon: FileSpreadsheetIcon, onSelect: () => dialogs.setCsvOpen(true) },
        { kind: "action", id: "qr", label: "QR Transfer", icon: QrCodeIcon, onSelect: dialogs.openQr },
      ],
    },
    {
      id: "setup",
      label: sheet ? "Set up" : undefined,
      items: [
        { kind: "action", id: "categories", label: "Categories", icon: TagsIcon, onSelect: () => dialogs.openCategories() },
        { kind: "action", id: "budgets", label: "Budgets", icon: PiggyBankIcon, onSelect: () => dialogs.setBudgetsOpen(true) },
      ],
    },
    {
      id: "saving",
      label: sheet ? "Saving" : undefined,
      items: [
        { kind: "action", id: "save", label: "Save", icon: SaveIcon, onSelect: actions.save },
        {
          kind: "toggle",
          id: "autosave",
          label: "Autosave",
          icon: SaveAllIcon,
          checked: data.autosave,
          onCheckedChange: data.setAutosave,
          hint: data.autosave ? "Every change is saved right away" : "Changes wait until you tap Save",
        },
      ],
    },
  ];
  if (sheet) {
    groups.push({
      id: "reset",
      items: [
        {
          kind: "action",
          id: "reset",
          label: "Reset all data",
          icon: RotateCcw,
          destructive: true,
          onSelect: () => dialogs.setResetOpen(true),
        },
      ],
    });
  }
  return groups;
}
