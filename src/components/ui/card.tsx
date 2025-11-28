import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'border-gray-200 bg-white text-gray-950',
        elevated: 'border-gray-200 bg-white text-gray-950 shadow-md hover:shadow-lg',
        outlined: 'border-2 border-gray-300 bg-white text-gray-950 shadow-none',
        ghost: 'border-transparent bg-transparent text-gray-950 shadow-none',
      },
      size: {
        default: '',
        sm: 'text-sm',
        lg: 'text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'default' | 'sm' | 'lg' | 'none';
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, spacing = 'default', ...props }, ref) => {
    const spacingClasses = {
      default: 'space-y-1.5 p-6',
      sm: 'space-y-1 p-4',
      lg: 'space-y-2 p-8',
      none: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn('flex flex-col', spacingClasses[spacing], className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Comp = 'h3', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'default' | 'sm' | 'lg' | 'none';
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, padding = 'default', ...props }, ref) => {
    const paddingClasses = {
      default: 'p-6 pt-0',
      sm: 'p-4 pt-0',
      lg: 'p-8 pt-0',
      none: '',
    };

    return (
      <div 
        ref={ref} 
        className={cn(paddingClasses[padding], className)} 
        {...props} 
      />
    );
  }
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  padding?: 'default' | 'sm' | 'lg' | 'none';
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, justify = 'start', padding = 'default', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
    };

    const paddingClasses = {
      default: 'p-6 pt-0',
      sm: 'p-4 pt-0',
      lg: 'p-8 pt-0',
      none: '',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          justifyClasses[justify],
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  cardVariants,
  type CardHeaderProps,
  type CardTitleProps,
  type CardContentProps,
  type CardFooterProps
};