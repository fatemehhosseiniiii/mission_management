import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'info' | 'success';
}

const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
    
    const variantClasses = {
        default: 'border-transparent bg-primary/20 text-primary',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-red-500/20 text-red-600 dark:text-red-400',
        outline: 'text-foreground',
        info: 'border-transparent bg-sky-500/20 text-sky-600 dark:text-sky-400',
        success: 'border-transparent bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    };

    return (
        <div
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
            {...props}
        />
    );
};

export default Badge;