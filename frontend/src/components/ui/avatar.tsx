import { ReactNode } from "react";

interface AvatarProps {
  children: ReactNode;
  className?: string;
}

export function Avatar({ children, className = "" }: AvatarProps) {
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 ${className}`}>
      {children}
    </div>
  );
}