import { FieldPath, FieldValues } from 'react-hook-form';
import { create } from 'zustand';

// Form field state
export type FormFieldState<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

// Form item state
export type FormItemState = {
  id: string;
};

interface FormState {
  // State
  fields: Map<string, FormFieldState>;
  items: Map<string, FormItemState>;

  // Actions
  registerField: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    fieldId: string,
    fieldState: FormFieldState<TFieldValues, TName>
  ) => void;

  unregisterField: (fieldId: string) => void;

  registerItem: (itemId: string, itemState: FormItemState) => void;

  unregisterItem: (itemId: string) => void;

  getField: (fieldId: string) => FormFieldState | undefined;

  getItem: (itemId: string) => FormItemState | undefined;
}

export const useFormStore = create<FormState>()((set, get) => ({
  // Initial state
  fields: new Map(),
  items: new Map(),

  // Actions
  registerField: (fieldId, fieldState) => {
    set(state => {
      const newFields = new Map(state.fields);
      newFields.set(fieldId, fieldState);
      return { fields: newFields };
    });
  },

  unregisterField: fieldId => {
    set(state => {
      const newFields = new Map(state.fields);
      newFields.delete(fieldId);
      return { fields: newFields };
    });
  },

  registerItem: (itemId, itemState) => {
    set(state => {
      const newItems = new Map(state.items);
      newItems.set(itemId, itemState);
      return { items: newItems };
    });
  },

  unregisterItem: itemId => {
    set(state => {
      const newItems = new Map(state.items);
      newItems.delete(itemId);
      return { items: newItems };
    });
  },

  getField: fieldId => {
    return get().fields.get(fieldId);
  },

  getItem: itemId => {
    return get().items.get(itemId);
  },
}));
