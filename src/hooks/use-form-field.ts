import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { useFormStore } from '../stores/FormStore';

export const useFormField = (): {
  id: string;
  name: string;
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  error?: {
    message?: string;
  };
  [key: string]: unknown;
} => {
  const formStore = useFormStore();
  const fieldId = React.useId();
  const itemId = React.useId();

  // Get the current field and item from the store
  const field = formStore.getField(fieldId);
  const item = formStore.getItem(itemId);

  // If field or item doesn't exist, throw an error
  if (!field) {
    throw new Error('useFormField should be used within <FormField>');
  }

  if (!item) {
    throw new Error('useFormField should be used within <FormItem>');
  }

  const { getFieldState, formState } = useFormContext();
  const fieldState = getFieldState(field.name, formState);
  const { id } = item;

  return {
    id,
    name: field.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};
