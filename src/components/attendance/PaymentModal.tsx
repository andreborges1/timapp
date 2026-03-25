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
import { AlertTriangle, CreditCard } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  eventTitle?: string;
  userName?: string;
}

export function PaymentModal({ open, onClose, eventTitle, userName }: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {/* NOT IMPLEMENTED banner */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 -mb-1">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            NOT IMPLEMENTED — This is a placeholder feature. No payment will be processed.
          </p>
        </div>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard size={18} />
            Pay for Event Entry
          </DialogTitle>
          <DialogDescription>
            {userName && eventTitle
              ? `${userName} can pay for their attendance at "${eventTitle}".`
              : "Pay for your event attendance (ticket)."}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Event</span>
            <span className="font-medium truncate ml-4">{eventTitle ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Attendee</span>
            <span className="font-medium">{userName ?? "—"}</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-2 mt-2">
            <span className="font-semibold">Amount Due</span>
            <span className="font-bold text-slate-900">$0.00</span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Skip</Button>
          <Button onClick={onClose} className="gap-2">
            <CreditCard size={15} />
            Pay Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
