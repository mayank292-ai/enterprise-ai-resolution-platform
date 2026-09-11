import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-enterprise text-white hover:bg-enterprise-700 active:bg-enterprise-700 shadow-subtle border border-enterprise-700/40',
  secondary:
    'bg-white text-ink hover:bg-ice border border-slate-200/60 shadow-subtle',
  ghost: 'text-slate hover:text-ink hover:bg-ice-100/60 border border-transparent',
  danger:
    'bg-critical text-white hover:bg-critical/90 active:bg-critical/90 border border-critical/40 shadow-subtle',
  success:
    'bg-verified text-white hover:bg-verified-600 active:bg-verified-600 border border-verified-600/40 shadow-subtle',
  outline:
    'bg-transparent text-enterprise border border-enterprise/30 hover:bg-enterprise/5 hover:border-enterprise/50',
};

const sizes: Record<Size, string> = {
  sm: 'text-2xs font-medium px-2.5 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm font-medium px-3.5 py-2 gap-2 rounded-lg',
  lg: 'text-sm font-medium px-5 py-2.5 gap-2 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, iconRight, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric',
          'disabled:opacity-50 disabled:pointer-events-none',
          'active:scale-[0.98]',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon
        )}
        {children}
        {iconRight}
      </button>
    );
  },
);
Button.displayName = 'Button';
