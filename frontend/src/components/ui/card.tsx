import { clsx } from 'clsx';

interface CardProps {
  title?: string;
  value?: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function Card({ title, value, description, icon, className, children }: CardProps) {
  return (
    <div className={clsx('bg-white rounded-xl border p-6', className)}>
      {children || (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {icon && <div className="text-primary-500">{icon}</div>}
          </div>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </>
      )}
    </div>
  );
}
