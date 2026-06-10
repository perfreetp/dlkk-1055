import React from "react";
import { cn } from "@/utils/format";

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  accent?: boolean;
  corner?: boolean;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  headerClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  accent,
  corner,
  className,
  children,
  actions,
  headerClassName,
  ...rest
}) => {
  return (
    <div
      className={cn(
        "card p-4 relative overflow-hidden",
        accent && "card-accent-hover",
        corner && "corner-bracket",
        className
      )}
      {...rest}
    >
      {title && (
        <div
          className={cn(
            "flex items-center justify-between mb-3 pb-2 border-b border-border/40",
            headerClassName
          )}
        >
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 bg-accent rounded-sm inline-block shadow-glow-sm" />
            <h3 className="text-sm font-semibold text-text-primary tracking-wide">
              {title}
            </h3>
          </div>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
