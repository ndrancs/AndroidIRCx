/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * useSafeAlert.test.ts
 */

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useSafeAlert } from '../../src/hooks/useSafeAlert';

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('useSafeAlert', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('should show alert immediately when app is active', async () => {
    const appStateRef = { current: 'active' };
    const pendingAlertRef = { current: null as any };

    const { result } = await renderHook(() =>
      useSafeAlert({ appStateRef, pendingAlertRef }),
    );

    await act(() => {
      result.current.safeAlert('Title', 'Message', [{ text: 'OK' }]);
    });

    expect(Alert.alert).toHaveBeenCalledWith('Title', 'Message', [
      { text: 'OK' },
    ]);
    expect(pendingAlertRef.current).toBeNull();
  });

  it('should store alert in pendingAlertRef when app is in background', async () => {
    const appStateRef = { current: 'background' };
    const pendingAlertRef = { current: null as any };

    const { result } = await renderHook(() =>
      useSafeAlert({ appStateRef, pendingAlertRef }),
    );

    await act(() => {
      result.current.safeAlert('Title', 'Message', [{ text: 'OK' }]);
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(pendingAlertRef.current).toEqual({
      title: 'Title',
      message: 'Message',
      buttons: [{ text: 'OK' }],
    });
  });

  it('should store alert when app state is inactive', async () => {
    const appStateRef = { current: 'inactive' };
    const pendingAlertRef = { current: null as any };

    const { result } = await renderHook(() =>
      useSafeAlert({ appStateRef, pendingAlertRef }),
    );

    await act(() => {
      result.current.safeAlert('Title', 'Message');
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(pendingAlertRef.current).toBeTruthy();
  });

  it('should handle missing message parameter', async () => {
    const appStateRef = { current: 'active' };
    const pendingAlertRef = { current: null as any };

    const { result } = await renderHook(() =>
      useSafeAlert({ appStateRef, pendingAlertRef }),
    );

    await act(() => {
      result.current.safeAlert('Title');
    });

    expect(Alert.alert).toHaveBeenCalledWith('Title', undefined, undefined);
  });

  it('should convert title and message to strings', async () => {
    const appStateRef = { current: 'active' };
    const pendingAlertRef = { current: null as any };

    const { result } = await renderHook(() =>
      useSafeAlert({ appStateRef, pendingAlertRef }),
    );

    await act(() => {
      result.current.safeAlert(123 as any, 456 as any);
    });

    expect(Alert.alert).toHaveBeenCalledWith('123', '456', undefined);
  });

  it('should return stable safeAlert reference', async () => {
    const appStateRef = { current: 'active' };
    const pendingAlertRef = { current: null as any };

    const { result, rerender } = await renderHook(() =>
      useSafeAlert({ appStateRef, pendingAlertRef }),
    );

    const first = result.current.safeAlert;
    await rerender();
    expect(result.current.safeAlert).toBe(first);
  });
});
