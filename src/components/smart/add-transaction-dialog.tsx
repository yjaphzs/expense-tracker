import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { CalendarIcon } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  type RecurrenceFrequency,
  type Transaction,
  type RecurringTransaction,
  type Wallet,
} from "@/types/transaction";

export type FormMode = "income" | "expense" | "recurring";

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<Transaction, "id">) => void;
  onEdit?: (id: string, data: Omit<Transaction, "id">) => void;
  onAddRecurring?: (
    data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">
  ) => void;
  wallets: Wallet[];
  editingTransaction?: Transaction | null;
  lockedType?: FormMode;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(date: Date | undefined): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const TransactionDialog: React.FC<TransactionDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
  onEdit,
  onAddRecurring,
  wallets,
  editingTransaction,
  lockedType,
}) => {
  const isEditing = !!editingTransaction;

  const [mode, setMode] = useState<FormMode>("expense");
  const [recurringType, setRecurringType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [walletId, setWalletId] = useState(() => wallets[0]?.id ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");

  const effectiveType: TransactionType = mode === "recurring" ? recurringType : mode;
  const categories = effectiveType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    if (open && editingTransaction) {
      setMode(editingTransaction.type);
      setCategory(editingTransaction.category);
      setAmount(String(editingTransaction.amount));
      setDescription(editingTransaction.description);
      const d = parseLocalDate(editingTransaction.date);
      setDate(d);
      setCalendarMonth(d);
      setWalletId(editingTransaction.walletId);
    } else if (open) {
      setMode(lockedType ?? "expense");
      setRecurringType("expense");
      setCategory("");
      setAmount("");
      setDescription("");
      setDate(new Date());
      setCalendarMonth(new Date());
      setWalletId(wallets[0]?.id ?? "");
      setFrequency("monthly");
    }
  }, [open, editingTransaction, wallets, lockedType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!category || isNaN(parsedAmount) || parsedAmount <= 0 || !walletId) return;

    if (mode === "recurring") {
      onAddRecurring?.({
        type: recurringType,
        category,
        amount: parsedAmount,
        description: description.trim(),
        frequency,
        startDate: toDateStr(date),
        walletId,
      });
    } else if (isEditing && onEdit) {
      onEdit(editingTransaction.id, {
        type: mode,
        category,
        amount: parsedAmount,
        description: description.trim(),
        date: toDateStr(date),
        walletId,
      });
    } else {
      onAdd({
        type: mode,
        category,
        amount: parsedAmount,
        description: description.trim(),
        date: toDateStr(date),
        walletId,
      });
    }
    onOpenChange(false);
  };

  const getTitle = () => {
    if (isEditing) return "Edit Transaction";
    switch (lockedType) {
      case "income": return "Add Income";
      case "expense": return "Add Expense";
      case "recurring": return "Add Recurring Transaction";
      default: return "Add Transaction";
    }
  };

  const getDialogDescription = () => {
    if (isEditing) return "Update the details of this transaction.";
    switch (lockedType) {
      case "income": return "Record a new income transaction.";
      case "expense": return "Record a new expense transaction.";
      case "recurring": return "Set up an automatic transaction that repeats on a schedule.";
      default: return "Record a new income, expense, or recurring transaction.";
    }
  };

  const getSubmitLabel = () => {
    if (isEditing) return "Save Changes";
    switch (mode) {
      case "recurring": return "Add Recurring";
      case "income": return "Add Income";
      case "expense": return "Add Expense";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Mode selector - add mode, no lock */}
          {!lockedType && !isEditing && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "expense" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => { setMode("expense"); setCategory(""); }}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={mode === "income" ? "default" : "outline"}
                  className={`flex-1 ${mode === "income" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                  onClick={() => { setMode("income"); setCategory(""); }}
                >
                  Income
                </Button>
                <Button
                  type="button"
                  variant={mode === "recurring" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => { setMode("recurring"); setCategory(""); }}
                >
                  Recurring
                </Button>
              </div>
            </div>
          )}

          {/* Type toggle - edit mode, no lock */}
          {!lockedType && isEditing && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={mode === "expense" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => { setMode("expense"); setCategory(""); }}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={mode === "income" ? "default" : "outline"}
                  className={`flex-1 ${mode === "income" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                  onClick={() => { setMode("income"); setCategory(""); }}
                >
                  Income
                </Button>
              </div>
            </div>
          )}

          {/* Recurring sub-type */}
          {mode === "recurring" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Recurring Type</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={recurringType === "expense" ? "destructive" : "outline"}
                  className="flex-1"
                  onClick={() => { setRecurringType("expense"); setCategory(""); }}
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={recurringType === "income" ? "default" : "outline"}
                  className={`flex-1 ${recurringType === "income" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                  onClick={() => { setRecurringType("income"); setCategory(""); }}
                >
                  Income
                </Button>
              </div>
            </div>
          )}

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={category === cat ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Wallet */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Wallet</label>
            <div className="flex flex-wrap gap-2">
              {wallets.map((w) => (
                <Badge
                  key={w.id}
                  variant={walletId === w.id ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => setWalletId(w.id)}
                >
                  {w.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="font-mono"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Description <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder={mode === "recurring" ? "e.g. Weekly allowance" : "e.g. Lunch at cafe"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Frequency - only for recurring */}
          {mode === "recurring" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground">Frequency</label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={frequency === opt.value ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => setFrequency(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Date / Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              {mode === "recurring" ? "Start Date" : "Date"}
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className={date ? "" : "text-muted-foreground"}>
                    {formatDateDisplay(date) || "Pick a date"}
                  </span>
                  <CalendarIcon className="size-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={date}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelect={(d) => {
                    if (d) {
                      setDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!category || !amount || parseFloat(amount) <= 0 || !walletId}
            >
              {getSubmitLabel()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
