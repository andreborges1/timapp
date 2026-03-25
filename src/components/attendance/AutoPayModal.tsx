"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

interface AutoPayModalProps {
  open: boolean;
  onClose: () => void;
}

export function AutoPayModal({ open, onClose }: AutoPayModalProps) {
  function handleEnable() {
    toast.info("Auto-pay preference saved (not implemented).");
    onClose();
  }

  function handleDecline() {
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* NOT IMPLEMENTED banner */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mb-1">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            NOT IMPLEMENTED — Auto-payments are not active. This is a placeholder.
          </p>
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap size={18} />
            Enable Auto-Pay?
          </DialogTitle>
          <DialogDescription>
            Would you like to authorize automatic payments for future event registrations?
            You can cancel this at any time in your profile settings.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            With auto-pay enabled, your registered payment method will be charged
            automatically when you attend events that require a ticket.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleDecline}>No Thanks</Button>
          <Button onClick={handleEnable} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Zap size={15} />
            Enable Auto-Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
