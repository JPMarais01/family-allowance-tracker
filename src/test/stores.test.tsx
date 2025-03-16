import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFormStore } from '../stores/FormStore';
import { useThemeStore } from '../stores/ThemeStore';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('ThemeStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useThemeStore.setState({ theme: 'system' });
    });

    // Mock DOM methods
    vi.spyOn(document.documentElement.classList, 'add').mockImplementation(() => {});
    vi.spyOn(document.documentElement.classList, 'remove').mockImplementation(() => {});
  });

  it('should initialize with system theme', () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.theme).toBe('system');
  });

  it('should set theme correctly', () => {
    const { result } = renderHook(() => useThemeStore());

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should toggle theme correctly', () => {
    const { result } = renderHook(() => useThemeStore());

    // Initial state is 'system'
    expect(result.current.theme).toBe('system');

    // First toggle: system -> dark
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');

    // Second toggle: dark -> light
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');

    // Third toggle: light -> system
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('system');
  });
});

describe('FormStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    act(() => {
      useFormStore.setState({
        fields: new Map(),
        items: new Map(),
      });
    });
  });

  it('should register and retrieve a field', () => {
    const { result } = renderHook(() => useFormStore());
    const fieldId = 'test-field-id';
    const fieldName = 'testField';

    act(() => {
      result.current.registerField(fieldId, { name: fieldName });
    });

    const field = result.current.getField(fieldId);
    expect(field).toBeDefined();
    expect(field?.name).toBe(fieldName);
  });

  it('should unregister a field', () => {
    const { result } = renderHook(() => useFormStore());
    const fieldId = 'test-field-id';

    act(() => {
      result.current.registerField(fieldId, { name: 'testField' });
      result.current.unregisterField(fieldId);
    });

    const field = result.current.getField(fieldId);
    expect(field).toBeUndefined();
  });

  it('should register and retrieve an item', () => {
    const { result } = renderHook(() => useFormStore());
    const itemId = 'test-item-id';

    act(() => {
      result.current.registerItem(itemId, { id: itemId });
    });

    const item = result.current.getItem(itemId);
    expect(item).toBeDefined();
    expect(item?.id).toBe(itemId);
  });

  it('should unregister an item', () => {
    const { result } = renderHook(() => useFormStore());
    const itemId = 'test-item-id';

    act(() => {
      result.current.registerItem(itemId, { id: itemId });
      result.current.unregisterItem(itemId);
    });

    const item = result.current.getItem(itemId);
    expect(item).toBeUndefined();
  });
});
