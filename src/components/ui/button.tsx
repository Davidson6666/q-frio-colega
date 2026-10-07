import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Shape rule: every interactive button is a pill.
 * Tactile feedback: active state scales down slightly.
 */
const buttonStyles = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-500 ease-spring",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-foreground hover:bg-accent-hover shadow-soft",
        secondary:
          "border border-field bg-surface text-foreground hover:bg-surface-2",
        ghost: "text-foreground hover:bg-surface-2",
        danger: "bg-danger text-background hover:opacity-90",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonStyles>;

/** cva output merged with twMerge so a passed `className` can override base utilities (e.g. `hidden`). */
export function buttonVariants(
  options: Parameters<typeof buttonStyles>[0] = {},
) {
  return cn(buttonStyles(options));
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & ButtonVariants) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
