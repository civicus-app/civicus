interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingSpinner({ fullScreen = false, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-primary-500`}></div>
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }
  return <div className="flex items-center justify-center p-4">{spinner}</div>;
}
