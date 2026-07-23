import type { ReactNode } from "react";

type ActionLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "outline" | "text" | "dark";
  className?: string;
};

export function ActionLink({
  href,
  children,
  variant = "outline",
  className = "",
}: ActionLinkProps) {
  return (
    <a
      className={`action-link action-link--${variant} ${className}`.trim()}
      href={href}
    >
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </a>
  );
}
