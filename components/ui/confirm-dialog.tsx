"use client";
import { useDialogFocus } from "./use-dialog-focus";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "./button";
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Discard this flight?",
  description = "Your unfinished configuration will be cleared. No experiment has been created.",
  confirmLabel = "Discard draft",
  cancelLabel = "Keep editing",
}: {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const focus = useDialogFocus();
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm" />
        <AlertDialog.Content
          {...focus}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-card p-7 shadow-xl"
        >
          <AlertDialog.Title className="text-xl font-semibold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button onClick={onConfirm}>{confirmLabel}</Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
