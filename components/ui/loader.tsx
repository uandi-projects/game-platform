import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loader({ className, size = "md" }: LoaderProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
  };

  return (
    <Loader2
      className={cn("animate-spin", className)}
      size={sizeMap[size]}
    />
  );
}