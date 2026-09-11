import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const baseField =
  'w-full rounded-lg border border-slate-200/60 bg-white text-sm text-ink placeholder:text-slate-300 ' +
  'transition-all duration-150 focus:outline-none focus:border-electric focus:ring-2 focus:ring-electric/15 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn(baseField, 'px-3 py-2', className)} {...props} />;
  },
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(baseField, 'px-3 py-2 resize-none', className)} {...props} />;
  },
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <select ref={ref} className={cn(baseField, 'px-3 py-2 appearance-none cursor-pointer', className)} {...props}>
        {children}
      </select>
    );
  },
);
Select.displayName = 'Select';

export function Label({ className, children, ...props }: { className?: string; children: ReactNode } & React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('text-2xs font-semibold text-slate uppercase tracking-wider mb-1.5 block', className)} {...props}>
      {children}
    </label>
  );
}
