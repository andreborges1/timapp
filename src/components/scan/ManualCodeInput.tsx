"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash } from "lucide-react";

interface ManualCodeInputProps {
  onScan: (code: string) => void;
  disabled?: boolean;
}

export function ManualCodeInput({ onScan, disabled }: ManualCodeInputProps) {
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      onScan(trimmed);
      setCode("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="code">Attendee Code</Label>
        <div className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter QR code manually..."
              disabled={disabled}
              className="pl-8 font-mono"
              autoComplete="off"
            />
          </div>
          <Button type="submit" disabled={disabled || !code.trim()}>
            Register
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400">
        The code is visible on the attendee's profile page.
      </p>
    </form>
  );
}
