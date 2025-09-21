import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "surface";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(" ");

const sizeMap: Record<ButtonSize, string> = {
  sm: "px-6 py-2 text-sm",
  md: "px-8 py-3 text-base",
  lg: "px-12 py-6 text-2xl",
};

export default function Button({
  variant = "surface",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  const base = "pixel-border pixel-shadow rounded-none font-bold pixel-focus disabled:opacity-60";
  const variantClass = variant === "primary" ? "pixel-primary" : "pixel-surface";
  const sizeClass = sizeMap[size];

  return (
    <button type={type} className={cx(base, variantClass, sizeClass, className)} {...rest}>
      {children}
    </button>
  );
}

