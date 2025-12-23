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
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  type = "warning",
}: ConfirmModalProps) {
  const t = useTranslations("common");

  const getVariant = () => {
    switch (type) {
      case "danger":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "p-2 rounded-full",
                type === "danger" && "bg-red-50",
                type === "info" && "bg-blue-50",
                type === "warning" && "bg-orange-50"
              )}
            >
              {type === "danger" ? (
                <AlertTriangle className={cn("h-6 w-6", "text-red-600")} />
              ) : (
                <Info
                  className={cn(
                    "h-6 w-6",
                    type === "info" ? "text-blue-600" : "text-orange-600"
                  )}
                />
              )}
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="pt-4">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelText || t("cancel")}
          </Button>
          <Button variant={getVariant()} onClick={onConfirm}>
            {confirmText || t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
