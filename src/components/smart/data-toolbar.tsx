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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
    PlusIcon,
    RotateCcw,
    MoreHorizontalIcon,
    ImportIcon,
    DownloadIcon,
    SaveIcon,
    SaveAllIcon,
    WalletIcon,
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
                    <div className="flex flex-row gap-2">
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
                    <div className="flex flex-row gap-2">
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
                    </div>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <ButtonGroup>
        <Button
            variant="outline"
            size="sm"
            onClick={onAdd}
            disabled={addDisabled}
        >
            <PlusIcon className="size-4" />
            {addLabel}
        </Button>
        <AlertDialog
            open={resetDialogOpen}
            onOpenChange={setResetDialogOpen}
        >
            <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <RotateCcw className="size-4" />
                    Reset
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <RotateCcw className="size-10 border rounded-lg bg-primary text-primary-foreground p-2 mx-auto sm:mx-0" />
                    <AlertDialogTitle>
                        Reset all data?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        all your transactions, recurring transactions, and wallets.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90"
                        onClick={handleReset}
                    >
                        Continue Reset
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="More Options"
                >
                    <MoreHorizontalIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-52"
            >
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={handleImport}
                    >
                        <ImportIcon />
                        Import
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleExport}
                    >
                        <DownloadIcon />
                        Export
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={handleSave}
                    >
                        <SaveIcon />
                        Save
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <SaveAllIcon />
                            Autosave
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup
                                value={autosave ? "enable" : "disabled"}
                                onValueChange={(value) =>
                                    setAutosave(value === "enable")
                                }
                            >
                                <DropdownMenuRadioItem value="enable">
                                    Enable
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="disabled">
                                    Disable
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    </ButtonGroup>
    );
};

export default DataToolbar;
