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
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
  type Transaction,
} from "@/types/transaction";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: Omit<Transaction, "id">) => void;
}

const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  open,
  onOpenChange,
  onAdd,
}) => {
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const resetForm = () => {
    setType("expense");
    setCategory("");
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!category || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onAdd({
      type,
      category,
      amount: parsedAmount,
      description: description.trim(),
      date,
    });
    resetForm();
    onOpenChange(false);
  };

  const isValid = category && amount && parseFloat(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Fill out the form below to record a new transaction. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Type toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setType("expense"); setCategory(""); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  type === "expense"
                    ? "bg-destructive text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => { setType("income"); setCategory(""); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
                  type === "income"
                    ? "bg-emerald-700 text-white dark:bg-emerald-600"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Category</label>
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

          {/* Amount */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">
              Description <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch at cafe"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
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

export default AddTransactionDialog;
