import { type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { badgeVariants } from '../../lib/badge-variants';
import { cn } from '../../lib/utils';

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
