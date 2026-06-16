/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for useServerTabNameSync hook
 */

import { renderHook } from '@testing-library/react-native';
import { useServerTabNameSync } from '../../src/hooks/useServerTabNameSync';
import { useTabStore } from '../../src/stores/tabStore';

jest.mock('../../src/stores/tabStore', () => ({
  useTabStore: {
    getState: jest.fn(),
  },
}));

describe('useServerTabNameSync', () => {
  const mockUpdateTab = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    (useTabStore.getState as jest.Mock).mockReturnValue({
      tabs: [],
      updateTab: mockUpdateTab,
    });
  });

  it('should not throw when networkName is empty', async () => {
    await renderHook(() => useServerTabNameSync({ networkName: '' }));
  });

  it('should not throw when networkName is "Not connected"', async () => {
    await renderHook(() =>
      useServerTabNameSync({ networkName: 'Not connected' }),
    );
  });

  it('should not throw with valid network name', async () => {
    await renderHook(() => useServerTabNameSync({ networkName: 'freenode' }));
  });

  it('should handle network name changes', async () => {
    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: 'freenode' } },
    );

    // Should not throw on rerender with same value
    await rerender({ networkName: 'freenode' });

    // Should not throw on rerender with different value
    await rerender({ networkName: 'dalnet' });
  });

  it('should handle transition from empty to valid network', async () => {
    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: '' } },
    );

    await rerender({ networkName: 'freenode' });
  });

  it('should handle transition from valid to empty network', async () => {
    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: 'freenode' } },
    );

    await rerender({ networkName: '' });
  });

  it('should update only matching server tabs whose names differ', async () => {
    (useTabStore.getState as jest.Mock).mockReturnValue({
      tabs: [
        { id: '1', type: 'server', networkId: 'dalnet', name: 'Old Name' },
        { id: '2', type: 'server', networkId: 'dalnet', name: 'dalnet' },
        { id: '3', type: 'channel', networkId: 'dalnet', name: '#chat' },
        { id: '4', type: 'server', networkId: 'othernet', name: 'Other' },
      ],
      updateTab: mockUpdateTab,
    });

    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: 'freenode' } },
    );

    await rerender({ networkName: 'dalnet' });

    expect(mockUpdateTab).toHaveBeenCalledTimes(1);
    expect(mockUpdateTab).toHaveBeenCalledWith('1', { name: 'dalnet' });
  });

  it('should not update tabs when names already match', async () => {
    (useTabStore.getState as jest.Mock).mockReturnValue({
      tabs: [{ id: '1', type: 'server', networkId: 'dalnet', name: 'dalnet' }],
      updateTab: mockUpdateTab,
    });

    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: 'freenode' } },
    );

    await rerender({ networkName: 'dalnet' });

    expect(mockUpdateTab).not.toHaveBeenCalled();
  });

  it('should not touch store when rerendered with the same network name', async () => {
    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: 'dalnet' } },
    );

    await rerender({ networkName: 'dalnet' });

    expect(useTabStore.getState).not.toHaveBeenCalled();
    expect(mockUpdateTab).not.toHaveBeenCalled();
  });

  it('should ignore Not connected during updates', async () => {
    const { rerender } = await renderHook(
      ({ networkName }) => useServerTabNameSync({ networkName }),
      { initialProps: { networkName: 'freenode' } },
    );

    await rerender({ networkName: 'Not connected' });

    expect(useTabStore.getState).not.toHaveBeenCalled();
    expect(mockUpdateTab).not.toHaveBeenCalled();
  });
});
