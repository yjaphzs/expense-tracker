import React, { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  type RecurrenceFrequency,
  type RecurringTransaction,
  type Wallet,
} from "@/types/transaction";

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 Weeks" },
  { value: "monthly", label: "Monthly" },
];

interface AddRecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (
    data: Omit<RecurringTransaction, "id" | "lastProcessedDate" | "enabled">
  ) => void;
  wallets: Wallet[];
}

const AddRecurringDialog: React.FC<AddRecurringDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
  wallets,
}) => {
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [walletId, setWalletId] = useState(() => wallets[0]?.id ?? "");
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const categories =
    type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const resetForm = () => {
    setType("expense");
    setCategory("");
    setAmount("");
    setDescription("");
    setFrequency("monthly");
    setWalletId(wallets[0]?.id ?? "");
    setStartDate(new Date());
    setCalendarMonth(new Date());
    setCalendarOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!category || isNaN(parsedAmount) || parsedAmount <= 0 || !walletId) return;

    const toDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    onAdd({
      type,
      category,
      amount: parsedAmount,
      description: description.trim(),
      frequency,
      startDate: toDateStr(startDate),
      walletId,
    });
    resetForm();
    onOpenChange(false);
  };

  const isValid = category && amount && parseFloat(amount) > 0 && walletId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Recurring Transaction</DialogTitle>
          <DialogDescription>
            Set up automatic transactions that repeat on a schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Type toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === "expense" ? "destructive" : "outline"}
                className="flex-1"
                onClick={() => {
                  setType("expense");
                  setCategory("");
                }}
              >
                Expense
              </Button>
              <Button
                type="button"
                variant={type === "income" ? "default" : "outline"}
                className={`flex-1 ${type === "income" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}`}
                onClick={() => {
                  setType("income");
                  setCategory("");
                }}
              >
                Income
              </Button>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={category === cat ? "secondary" : "outline"}
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
            <label className="text-sm font-medium">Wallet</label>
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
            <label className="text-sm font-medium">Amount</label>
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
            <label className="text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Weekly allowance from parents"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Frequency</label>
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

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between font-normal"
                >
                  <span className={startDate ? "" : "text-muted-foreground"}>
                    {startDate
                      ? startDate.toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Pick a date"}
                  </span>
                  <CalendarIcon className="size-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto overflow-hidden p-0" align="start" sideOffset={8}>
                <Calendar
                  mode="single"
                  selected={startDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  onSelect={(d) => {
                    if (d) {
                      setStartDate(d);
                      setCalendarOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecurringDialog;
