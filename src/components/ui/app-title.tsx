interface AppTitleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AppTitle({ className = '', size = 'md' }: AppTitleProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl sm:text-4xl md:text-5xl',
    lg: 'text-4xl sm:text-5xl md:text-6xl',
  };

  return (
    <h1
      className={`text-neutral-content font-bold ${sizeClasses[size]} ${className}`}
    >
      Recipe Generator
    </h1>
  );
}
