"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  footer?: React.ReactNode;
  onSave?: () => void;
  saveText?: string;
  cancelText?: string;
  isLoading?: boolean;
  description?: string;
}

const maxWidthClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-xl",
  "2xl": "sm:max-w-2xl",
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  footer,
  onSave,
  saveText,
  cancelText,
  isLoading = false,
  description,
}: ModalProps) {
  const t = useTranslations("common");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-h-[90vh] overflow-y-auto",
          maxWidthClasses[maxWidth]
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">{children}</div>

        {footer ? (
          footer
        ) : (
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText || t("cancel")}
            </Button>
            {onSave && (
              <Button type="button" onClick={onSave} disabled={isLoading}>
                {isLoading ? t("loading") : saveText || t("save")}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
