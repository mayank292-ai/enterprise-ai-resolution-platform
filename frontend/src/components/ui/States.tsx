import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('shimmer-bg bg-slate-200/40 rounded-md', className)} />;
}

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading', className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="flex items-center gap-3 text-slate">
        <span className="inline-block w-4 h-4 border-2 border-electric border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-slate-300">{icon}</div>}
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-slate max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  type?: 'recoverable' | 'fatal';
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ type = 'recoverable', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className={cn('inline-flex items-center justify-center w-10 h-10 rounded-full mb-3', type === 'fatal' ? 'bg-critical/10' : 'bg-approval/10')}>
        <span className={cn('text-lg font-bold', type === 'fatal' ? 'text-critical' : 'text-approval')}>!</span>
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">
        {type === 'fatal' ? 'Investigation Failed' : 'Temporary Error'}
      </h3>
      <p className="text-sm text-slate max-w-md mb-4">{message}</p>
      {onRetry && type === 'recoverable' && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-enterprise hover:text-enterprise-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
