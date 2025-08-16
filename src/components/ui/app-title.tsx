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
      className={`bg-gradient-to-r from-green-600 via-green-500 to-yellow-500 bg-clip-text font-bold text-transparent ${sizeClasses[size]} ${className}`}
    >
      Mom's Recipe Generator
    </h1>
  );
}
