import type { ButtonHTMLAttributes } from "react";
type Variant = "primary" | "secondary" | "ghost";
export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`ui-button ui-button-${variant} ${className}`} {...props} />;
}
