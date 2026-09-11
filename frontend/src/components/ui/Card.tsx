import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white/95 border border-slate-200/55 rounded-xl2 shadow-card backdrop-blur-sm',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-electric/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4 border-b border-slate-200/40', className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-ink tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}
