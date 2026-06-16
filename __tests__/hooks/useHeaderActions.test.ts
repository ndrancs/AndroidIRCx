/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for useHeaderActions hook
 */

import { renderHook, act } from '@testing-library/react-native';
import { useHeaderActions } from '../../src/hooks/useHeaderActions';

// Mock UI Store
const mockSetShowOptionsMenu = jest.fn();
const mockSetShowSettings = jest.fn();
const mockSetShowUserList = jest.fn();

const mockUIStore = {
  setShowOptionsMenu: mockSetShowOptionsMenu,
  setShowSettings: mockSetShowSettings,
  showUserList: false,
  setShowUserList: mockSetShowUserList,
};

jest.mock('../../src/stores/uiStore', () => ({
  useUIStore: Object.assign(
    jest.fn(selector => selector(mockUIStore)),
    { getState: jest.fn(() => mockUIStore) },
  ),
}));

describe('useHeaderActions', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockUIStore.showUserList = false;
  });

  it('should return all action handlers', async () => {
    const { result } = await renderHook(() => useHeaderActions());

    expect(result.current.handleDropdownPress).toBeDefined();
    expect(result.current.handleMenuPress).toBeDefined();
    expect(result.current.handleToggleUserList).toBeDefined();
    expect(typeof result.current.handleDropdownPress).toBe('function');
    expect(typeof result.current.handleMenuPress).toBe('function');
    expect(typeof result.current.handleToggleUserList).toBe('function');
  });

  it('should open options menu on dropdown press', async () => {
    const { result } = await renderHook(() => useHeaderActions());

    await act(() => {
      result.current.handleDropdownPress();
    });

    expect(mockSetShowOptionsMenu).toHaveBeenCalledWith(true);
  });

  it('should open settings on menu press', async () => {
    const { result } = await renderHook(() => useHeaderActions());

    await act(() => {
      result.current.handleMenuPress();
    });

    expect(mockSetShowSettings).toHaveBeenCalledWith(true);
  });

  it('should toggle user list from false to true', async () => {
    mockUIStore.showUserList = false;
    const { result } = await renderHook(() => useHeaderActions());

    await act(() => {
      result.current.handleToggleUserList();
    });

    expect(mockSetShowUserList).toHaveBeenCalledWith(true);
  });

  it('should toggle user list from true to false', async () => {
    mockUIStore.showUserList = true;
    const { result } = await renderHook(() => useHeaderActions());

    await act(() => {
      result.current.handleToggleUserList();
    });

    expect(mockSetShowUserList).toHaveBeenCalledWith(false);
  });

  it('should read latest user list state on each toggle call', async () => {
    const { result } = await renderHook(() => useHeaderActions());

    mockUIStore.showUserList = false;
    await act(() => {
      result.current.handleToggleUserList();
    });
    expect(mockSetShowUserList).toHaveBeenCalledWith(true);

    mockUIStore.showUserList = true;
    await act(() => {
      result.current.handleToggleUserList();
    });
    expect(mockSetShowUserList).toHaveBeenLastCalledWith(false);
  });
});
