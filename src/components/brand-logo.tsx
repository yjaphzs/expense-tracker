import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/images/expense-tracker.jpg";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

/** App wordmark + logo that links back to the app. */
export function BrandLogo({
  className,
  nameClassName,
  showName = true,
  asHeading = false,
}: {
  className?: string;
  nameClassName?: string;
  showName?: boolean;
  /** Render the name as the page's h1 (the tracker home). */
  asHeading?: boolean;
}) {
  const Name = asHeading ? "h1" : "span";
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2", className)}
      aria-label={APP_NAME}
    >
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary-foreground">
        <Image
          src={logo}
          alt=""
          width={32}
          height={32}
          className="size-full object-cover"
          priority
        />
      </span>
      {showName && (
        <Name className={cn("text-base font-extrabold tracking-tight", nameClassName)}>
          {APP_NAME}
        </Name>
      )}
    </Link>
  );
}
