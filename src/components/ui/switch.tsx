import * as React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps extends React.HTMLAttributes<HTMLDivElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = React.forwardRef<HTMLDivElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-blue-500' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={() => {
          if (!disabled) {
            onCheckedChange(!checked);
          }
        }}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) {
              onCheckedChange(!checked);
            }
          }
        }}
        {...props}
      >
        <div
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </div>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
