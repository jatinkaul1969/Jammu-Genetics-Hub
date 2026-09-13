"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// A password field with a show/hide eye toggle on the right. Drop-in
// replacement for a plain <input type="password" className="input" />.
type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  className?: string;
};

export function PasswordInput({ className = "input", ...props }: Props) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-10`} />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-faint hover:text-ink"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </span>
  );
}
