import { toast } from '../../hooks/use-toast';

type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

/**
 * A singleton toast instance for consistent toast management across the app
 */
export const toaster = {
  /**
   * Create a toast notification
   */
  create: ({ title, description, type = 'default', duration = 5000 }: ToastOptions) => {
    return toast({
      title,
      description,
      duration,
      variant: type === 'error' ? 'destructive' : 'default',
      className: type !== 'default' && type !== 'error' ? `toast-${type}` : '',
    });
  },

  /**
   * Create a success toast
   */
  success: (title: string, description?: string) => {
    return toaster.create({ title, description, type: 'success' });
  },

  /**
   * Create an error toast
   */
  error: (title: string, description?: string) => {
    return toaster.create({ title, description, type: 'error' });
  },

  /**
   * Create a warning toast
   */
  warning: (title: string, description?: string) => {
    return toaster.create({ title, description, type: 'warning' });
  },

  /**
   * Create an info toast
   */
  info: (title: string, description?: string) => {
    return toaster.create({ title, description, type: 'info' });
  },
};
