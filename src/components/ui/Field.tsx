"use client";

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full bg-transparent text-ink placeholder:text-ink-faint transition-colors duration-200 " +
  "border-b border-[var(--hairline-strong)] focus:border-blush-400 focus:outline-none " +
  "focus-visible:outline-none py-2";

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-medium uppercase tracking-[0.18em] text-ink-faint"
    >
      {children}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(base, "text-[15px]", className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(base, "resize-none text-[15px] leading-relaxed", className)}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(base, "cursor-pointer appearance-none text-[15px]", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export function FieldRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}
