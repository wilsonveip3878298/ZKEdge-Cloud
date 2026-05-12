import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'error' | 'active' | 'inactive';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    online: 'bg-green-100 text-green-700',
    offline: 'bg-gray-100 text-gray-600',
    error: 'bg-red-100 text-red-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', styles[status])}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
