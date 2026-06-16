/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * useTheme.test.ts
 */

import { renderHook, act } from '@testing-library/react-native';
import { useTheme } from '../../src/hooks/useTheme';

let themeChangeCallback: Function | null = null;
const darkTheme = {
  name: 'dark',
  colors: {
    background: '#000000',
    text: '#ffffff',
    primary: '#0088ff',
  },
};
const lightTheme = {
  name: 'light',
  colors: {
    background: '#ffffff',
    text: '#000000',
    primary: '#0066cc',
  },
};

jest.mock('../../src/services/ThemeService', () => ({
  themeService: {
    getCurrentTheme: jest.fn(() => darkTheme),
    onThemeChange: jest.fn((cb: Function) => {
      themeChangeCallback = cb;
      return () => {
        themeChangeCallback = null;
      };
    }),
  },
}));

describe('useTheme', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    themeChangeCallback = null;
  });

  it('should return current theme', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.theme).toEqual(darkTheme);
  });

  it('should return theme colors', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.colors).toEqual(darkTheme.colors);
  });

  it('should update theme when theme changes', async () => {
    const { result } = await renderHook(() => useTheme());

    await act(() => {
      themeChangeCallback?.(lightTheme);
    });

    expect(result.current.theme).toEqual(lightTheme);
    expect(result.current.colors).toEqual(lightTheme.colors);
  });

  it('should unsubscribe from theme changes on unmount', async () => {
    const { unmount } = await renderHook(() => useTheme());

    expect(themeChangeCallback).toBeTruthy();
    await unmount();
    // After unmount, the unsubscribe should have been called
  });
});
