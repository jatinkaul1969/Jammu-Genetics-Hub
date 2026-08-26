"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Check } from "lucide-react";
import { formatInr } from "@/lib/format";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<void> | null = null;
function loadRazorpayScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load the payment widget — check your connection."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function RazorpayPayButton({ bookingCodes, amount }: { bookingCodes: string[]; amount: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      await loadRazorpayScript();

      const orderRes = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingCodes }),
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error ?? "Could not start payment.");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: "INR",
        name: "Jammu Genetics Hub",
        description: bookingCodes.length > 1 ? `${bookingCodes.length} bookings` : bookingCodes[0],
        prefill: { name: order.customerName, contact: order.customerPhone },
        theme: { color: "#0b6e5c" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...response, bookingCodes }),
            });
            const data = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(data.error ?? "Payment verification failed.");
            setPaid(true);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <p className="flex items-center justify-center gap-1.5 rounded-lg bg-success-soft py-2.5 text-sm font-semibold text-success">
        <Check size={16} /> Paid online
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={pay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
        Pay {formatInr(amount)} online now
      </button>
      <p className="mt-1.5 text-center text-[11px] text-ink-faint">Cards, UPI, netbanking &amp; wallets — or skip this and pay the phlebotomist on collection.</p>
      {error && <p className="mt-1.5 text-center text-xs text-accent">{error}</p>}
    </div>
  );
}
