interface StatusBadgeProps {
  status: string | null;
  count?: number;
}

export function StatusBadge({ status, count }: StatusBadgeProps) {
  const getStatusClasses = (status: string | null) => {
    if (!status) return 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200';
    
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'contacted':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'follow-up':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100';
      case 'negotiation':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-700 dark:text-orange-100';
      case 'under-contract':
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100';
      case 'dead':
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200';
    }
  };
  
  return (
    <span className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusClasses(status)}`}>
      {count !== undefined ? count : status}
    </span>
  );
}
