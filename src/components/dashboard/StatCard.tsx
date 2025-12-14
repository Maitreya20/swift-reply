import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  variant?: "default" | "primary" | "success";
}

export function StatCard({
  title,
  value,
  change,
  icon,
  variant = "default",
}: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl p-6 transition-all duration-200 hover:shadow-lg animate-fade-in",
        variant === "default" && "bg-card border border-border",
        variant === "primary" && "gradient-primary text-primary-foreground",
        variant === "success" && "gradient-success text-success-foreground"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              "text-sm font-medium",
              variant === "default" ? "text-muted-foreground" : "opacity-90"
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              {isPositive && <TrendingUp className="h-4 w-4" />}
              {isNegative && <TrendingDown className="h-4 w-4" />}
              <span
                className={cn(
                  "text-sm font-medium",
                  variant === "default" &&
                    (isPositive ? "text-success" : "text-destructive"),
                  variant !== "default" && "opacity-90"
                )}
              >
                {isPositive && "+"}
                {change}% from yesterday
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "rounded-lg p-3",
            variant === "default" && "bg-secondary",
            variant !== "default" && "bg-white/20"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
