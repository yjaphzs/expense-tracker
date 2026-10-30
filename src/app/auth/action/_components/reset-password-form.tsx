"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { confirmPasswordReset } from "firebase/auth";

import { auth } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/errors";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const resetSchema = z
  .object({
    password: z.string().min(6, "Use at least 6 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
type ResetSchema = z.infer<typeof resetSchema>;

/** The new-password form for a reset link, after the link's code is verified. */
export function ResetPasswordForm({
  email,
  oobCode,
  onDone,
}: {
  email: string | null;
  oobCode: string;
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetSchema>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: ResetSchema) {
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      onDone();
    } catch (err) {
      setError("root", { message: getAuthErrorMessage(err) });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Set a new password</h1>
          <p className="text-sm text-balance text-muted-foreground">
            {email ? (
              <>
                For <span className="font-medium text-foreground">{email}</span>
              </>
            ) : (
              "Choose a new password for your account."
            )}
          </p>
        </div>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="reset-password">New password</FieldLabel>
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            disabled={isSubmitting}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="reset-confirm">Confirm password</FieldLabel>
          <PasswordInput
            id="reset-confirm"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            disabled={isSubmitting}
            {...register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        {errors.root && (
          <p className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </FieldGroup>
    </form>
  );
}
