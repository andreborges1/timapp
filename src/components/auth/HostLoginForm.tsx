"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export function HostLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const email = (document.getElementById("host-email") as HTMLInputElement)?.value ?? "";
    const password = (document.getElementById("host-password") as HTMLInputElement)?.value ?? "";
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/host/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Login failed.");
        return;
      }
      toast.success(`Welcome back, ${data.host.name}!`);
      router.push("/host/scan");
      router.refresh();
    } catch {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
      <div>
        <Label htmlFor="host-email">Email</Label>
        <input
          id="host-email"
          type="email"
          placeholder="Enter your email"
          disabled={loading}
          autoComplete="email"
          className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
        />
      </div>
      <div>
        <Label htmlFor="host-password">Password</Label>
        <div className="relative mt-1">
          <input
            id="host-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            disabled={loading}
            autoComplete="current-password"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        style={{ touchAction: "manipulation" }}
        className="w-full h-11 rounded-lg bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Sign In as Host
      </button>
    </form>
  );
}
