/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for useDebounce hook
 */

import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../../src/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', async () => {
    const { result } = await renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should return debounced value after delay', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    expect(result.current).toBe('initial');

    // Change the value
    await rerender({ value: 'changed', delay: 500 });

    // Value should still be initial before delay
    expect(result.current).toBe('initial');

    // Fast-forward past the delay
    await act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('changed');
  });

  it('should reset timer when value changes before delay', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    await rerender({ value: 'first', delay: 500 });

    // Advance timer partially
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    // Change value again before timer completes
    await rerender({ value: 'second', delay: 500 });

    // Advance timer partially again
    await act(() => {
      jest.advanceTimersByTime(300);
    });

    // Value should still be initial because timer was reset
    expect(result.current).toBe('initial');

    // Complete the full delay
    await act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be the latest
    expect(result.current).toBe('second');
  });

  it('should handle numeric values', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } },
    );

    expect(result.current).toBe(0);

    await rerender({ value: 42, delay: 300 });

    await act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe(42);
  });

  it('should handle object values', async () => {
    const initialObj = { search: '' };
    const newObj = { search: 'query' };

    const { result, rerender } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: initialObj, delay: 400 } },
    );

    expect(result.current).toEqual(initialObj);

    await rerender({ value: newObj, delay: 400 });

    await act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(result.current).toEqual(newObj);
  });

  it('should clear timeout on unmount', async () => {
    const { rerender, unmount } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    await rerender({ value: 'changed', delay: 500 });

    // Unmount before delay completes
    await unmount();

    // No error should occur when timers advance after unmount
    await act(() => {
      jest.advanceTimersByTime(500);
    });
  });

  it('should handle delay of 0', async () => {
    const { result, rerender } = await renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } },
    );

    await rerender({ value: 'changed', delay: 0 });

    // Even with 0 delay, setTimeout is async
    await act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(result.current).toBe('changed');
  });
});
