import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gilt' | 'obsidian';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      icon,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-sans font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-obsidian-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded text-xs';

    const variants = {
      primary:
        'bg-obsidian-900 text-white hover:bg-obsidian-850 border border-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.08)] active:translate-y-[0.5px]',
      secondary:
        'bg-parchment-150 text-obsidian-850 hover:bg-parchment-200 border border-hairline active:bg-parchment-300',
      outline:
        'border border-hairline bg-white hover:bg-parchment-100 text-obsidian-800 shadow-subtle active:bg-parchment-150',
      ghost: 'hover:bg-parchment-200/60 text-obsidian-700 active:bg-parchment-300/60',
      danger:
        'bg-rose-900 text-white hover:bg-rose-850 border border-rose-950/80 shadow-subtle active:bg-rose-950',
      gilt:
        'bg-gilt-400 text-obsidian-950 hover:bg-gilt-300 border border-gilt-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.1)] active:translate-y-[0.5px] font-semibold',
      obsidian:
        'bg-obsidian-900 text-parchment-100 hover:bg-obsidian-850 border border-obsidian-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_2px_rgba(0,0,0,0.15)] active:translate-y-[0.5px]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5',
      md: 'h-9 px-4 text-xs gap-2',
      lg: 'h-10 px-5 text-sm gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
        {!isLoading && icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
