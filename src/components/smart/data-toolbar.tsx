import React from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from "@/components/ui/empty";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MenuGroup, MenuItem } from "@/components/shared/menu-types";
import { ResponsiveMenu } from "@/components/shared/responsive-menu";
import {
    PlusIcon,
    RotateCcw,
    MoreHorizontalIcon,
    ImportIcon,
    DownloadIcon,
    SaveIcon,
    SaveAllIcon,
    WalletIcon,
    QrCodeIcon,
} from "lucide-react";

interface DataToolbarProps {
    onAdd: () => void;
    addDisabled?: boolean;
    addLabel?: string;
    handleSave: () => void;
    autosave: boolean;
    setAutosave: (value: boolean) => void;
    resetDialogOpen: boolean;
    setResetDialogOpen: (open: boolean) => void;
    handleReset: () => void;
    handleImport: () => void;
    handleExport: () => void;
    onQrTransfer?: () => void;
    hasWallets: boolean;
    hasItems: boolean;
    onManageWallets: () => void;
    emptyIcon?: React.ReactNode;
    emptyTitle?: string;
    emptyDescription?: string;
    noWalletDescription?: string;
}

const DataToolbar: React.FC<DataToolbarProps> = ({
    onAdd,
    addDisabled,
    addLabel = "Add",
    handleSave,
    autosave,
    setAutosave,
    resetDialogOpen,
    setResetDialogOpen,
    handleReset,
    handleImport,
    handleExport,
    onQrTransfer,
    hasWallets,
    hasItems,
    onManageWallets,
    emptyIcon,
    emptyTitle = "No transactions yet",
    emptyDescription = "Add your first transaction to start tracking your finances. You can also import existing data.",
    noWalletDescription = "You need to add a wallet before you can start tracking transactions. You can also import existing data.",
}) => {
    if (!hasWallets) {
        return (
            <Empty className="border border-dashed mt-4">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        {emptyIcon ?? <WalletIcon />}
                    </EmptyMedia>
                    <EmptyTitle>No Wallets Found</EmptyTitle>
                    <EmptyDescription>
                        {noWalletDescription}
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onManageWallets}
                        >
                          <PlusIcon className="size-4" />
                          Add Wallet
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImport}
                        >
                          <ImportIcon className="size-4" />
                          Import Data
                        </Button>
                        {onQrTransfer && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onQrTransfer}
                            >
                              <QrCodeIcon className="size-4" />
                              QR Transfer
                            </Button>
                        )}
                    </div>
                </EmptyContent>
            </Empty>
        );
    }

    if (!hasItems) {
        return (
            <Empty className="border border-dashed mt-4">
                <EmptyHeader>
                    <EmptyMedia variant="icon">
                        {emptyIcon ?? <WalletIcon />}
                    </EmptyMedia>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    <EmptyDescription>
                        {emptyDescription}
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <div className="flex flex-row flex-wrap sm:flex-nowrap items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onAdd}
                        >
                          <PlusIcon className="size-4" />
                          {addLabel}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleImport}
                        >
                          <ImportIcon className="size-4" />
                          Import Data
                        </Button>
                        {onQrTransfer && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onQrTransfer}
                            >
                              <QrCodeIcon className="size-4" />
                              QR Transfer
                            </Button>
                        )}
                    </div>
                </EmptyContent>
            </Empty>
        );
    }

    // One menu model for both screens: a dropdown beside Add/Reset on desktop,
    // and on phones a bottom sheet that also carries Reset (Add is the floating
    // button there, and Reset shouldn't sit next to it).
    const menuGroups = (sheet: boolean): MenuGroup[] => {
        const dataItems: MenuItem[] = [
            { kind: "action", id: "import", label: "Import", icon: ImportIcon, onSelect: handleImport },
            { kind: "action", id: "export", label: "Export", icon: DownloadIcon, onSelect: handleExport },
        ];
        if (onQrTransfer) {
            dataItems.push({ kind: "action", id: "qr", label: "QR Transfer", icon: QrCodeIcon, onSelect: onQrTransfer });
        }
        const groups: MenuGroup[] = [
            { id: "data", label: sheet ? "Move your data" : undefined, items: dataItems },
            {
                id: "saving",
                label: sheet ? "Saving" : undefined,
                items: [
                    { kind: "action", id: "save", label: "Save", icon: SaveIcon, onSelect: handleSave },
                    {
                        kind: "toggle",
                        id: "autosave",
                        label: "Autosave",
                        icon: SaveAllIcon,
                        checked: autosave,
                        onCheckedChange: setAutosave,
                        hint: autosave ? "Every change is saved right away" : "Changes wait until you tap Save",
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
                        onSelect: () => setResetDialogOpen(true),
                    },
                ],
            });
        }
        return groups;
    };

    return (
        <>
            <ButtonGroup className="hidden md:flex">
                <Button variant="outline" size="sm" onClick={onAdd} disabled={addDisabled}>
                    <PlusIcon className="size-4" />
                    {addLabel}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(true)}>
                    <RotateCcw className="size-4" />
                    Reset
                </Button>
                <ResponsiveMenu
                    mode="menu"
                    title="Data options"
                    groups={menuGroups(false)}
                    trigger={
                        <Button variant="outline" size="icon-sm" aria-label="More Options">
                            <MoreHorizontalIcon />
                        </Button>
                    }
                />
            </ButtonGroup>
            <div className="md:hidden">
                <ResponsiveMenu
                    mode="sheet"
                    title="Data options"
                    groups={menuGroups(true)}
                    trigger={
                        <Button variant="outline" size="icon" className="size-10" aria-label="More Options">
                            <MoreHorizontalIcon />
                        </Button>
                    }
                />
            </div>
            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <RotateCcw className="size-10 border rounded-lg bg-primary text-primary-foreground p-2 mx-auto sm:mx-0" />
                        <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete
                            all your transactions, recurring transactions, and wallets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-white hover:bg-destructive/90"
                            onClick={handleReset}
                        >
                            Continue Reset
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default DataToolbar;
