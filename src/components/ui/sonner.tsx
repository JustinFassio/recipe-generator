import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Map DaisyUI theme to Sonner theme (current theme is light-based)
  const theme = 'light';

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            'group-[.toast]:bg-destructive group-[.toast]:text-destructive-foreground group-[.toast]:border-destructive',
          success:
            'group-[.toast]:bg-success group-[.toast]:text-success-foreground group-[.toast]:border-success',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
