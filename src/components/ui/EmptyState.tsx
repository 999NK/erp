import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; };
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-neutral-400" />
      </div>
      <h3 className="text-lg font-bold text-neutral-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-400 text-center max-w-sm mb-4">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm shadow-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Skeleton Loaders
// ─────────────────────────────────────────────────────

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-neutral-200 rounded-lg w-full mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 mb-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-8 bg-neutral-100 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
      <div className="flex justify-between">
        <div className="h-4 bg-neutral-200 rounded w-1/3" />
        <div className="h-8 w-8 bg-neutral-100 rounded-xl" />
      </div>
      <div className="h-8 bg-neutral-100 rounded w-2/3" />
      <div className="h-3 bg-neutral-100 rounded w-1/2" />
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
