import * as React from "react";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

/**
 * ResponsiveModal - Uses Drawer on mobile and Dialog on desktop
 * This provides a better mobile UX with bottom sheet behavior
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn(
          "max-h-[85vh] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t-2 border-slate-700/50",
          className
        )}>
            <DrawerHeader className="text-left pb-2 flex-shrink-0 relative pr-12">
            {title && <DrawerTitle className="text-amber-400">{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring text-amber-400"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 px-4 pb-6">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-700/50 shadow-2xl overflow-hidden",
        className
      )}>
        {(title || description) && (
          <DialogHeader className="flex-shrink-0">
            {title && <DialogTitle className="text-amber-400">{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResponsiveModal;
