"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { User } from "@/lib/firebase/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { changePassword, reauthenticate } from "@/lib/firebase/auth";
import { getAuthErrorMessage } from "@/lib/firebase/errors";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(6, "Use at least 6 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type PasswordSchema = z.infer<typeof passwordSchema>;

/** Change the sign-in password (only shown for accounts that have one). */
export function ChangePasswordCard({ user }: { user: User }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordSchema>({ resolver: zodResolver(passwordSchema) });

  async function onChangePassword(values: PasswordSchema) {
    try {
      await reauthenticate(user, values.currentPassword);
      await changePassword(user, values.newPassword);
      reset();
      toast.success("Password updated.");
    } catch (err) {
      setError("root", { message: getAuthErrorMessage(err) });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change the password you use to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onChangePassword)}
          className="flex flex-col gap-4"
        >
          <Field data-invalid={!!errors.currentPassword}>
            <FieldLabel htmlFor="current-password">
              Current password
            </FieldLabel>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              disabled={isSubmitting}
              {...register("currentPassword")}
            />
            <FieldError errors={[errors.currentPassword]} />
          </Field>

          <Field data-invalid={!!errors.newPassword}>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              disabled={isSubmitting}
              {...register("newPassword")}
            />
            <FieldError errors={[errors.newPassword]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="confirm-new-password">
              Confirm new password
            </FieldLabel>
            <PasswordInput
              id="confirm-new-password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          {errors.root && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.root.message}
            </p>
          )}

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner data-icon="inline-start" />}
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
