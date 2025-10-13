import { clsx } from 'clsx';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'celiador' | 'celiador-outline';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, children, ...props }, ref) => {
    return (
      <button
        className={clsx(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'hover:scale-[1.02] active:scale-[0.98]', // Subtle hover/active effects
          {
            // Celiador Primary - main brand button
            'bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg shadow-teal-500/25': variant === 'celiador',
            
            // Celiador Outline - brand outline button
            'border-2 border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white': variant === 'celiador-outline',
            
            // Default variants
            'bg-gray-900 text-white hover:bg-gray-800 shadow-sm': variant === 'default',
            'bg-red-500 text-white hover:bg-red-600 shadow-sm': variant === 'destructive',
            'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50': variant === 'outline',
            'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
            'text-gray-700 hover:bg-gray-100 hover:text-gray-900': variant === 'ghost',
            'text-teal-600 underline-offset-4 hover:underline p-0 h-auto': variant === 'link',
          },
          {
            'h-9 px-4 py-2 text-sm': size === 'sm',
            'h-10 px-6 py-2 text-sm': size === 'default',
            'h-12 px-8 py-3 text-base': size === 'lg',
            'h-14 px-10 py-4 text-lg': size === 'xl',
            'h-10 w-10 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
