/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * useStoreSetters.test.ts
 *
 * Tests for useStoreSetters hook
 */

import { renderHook, act } from '@testing-library/react-native';
import { useStoreSetters } from '../../src/hooks/useStoreSetters';
import { useConnectionStore } from '../../src/stores/connectionStore';
import { useTabStore } from '../../src/stores/tabStore';
import { useUIStore } from '../../src/stores/uiStore';
import { useMessageStore } from '../../src/stores/messageStore';
import { ChannelTab } from '../../src/types';
import { RawMessageCategory } from '../../src/services/IRCService';

// Mock AsyncStorage
const mockStorage: Map<string, string> = new Map();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(async (key: string, value: string) => {
      mockStorage.set(key, value);
    }),
    getItem: jest.fn(async (key: string) => {
      return mockStorage.get(key) || null;
    }),
    removeItem: jest.fn(async (key: string) => {
      mockStorage.delete(key);
    }),
  },
}));

describe('useStoreSetters', () => {
  beforeEach(async () => {
    mockStorage.clear();
    // Reset all stores
    await act(() => {
      useConnectionStore.getState().reset();
      useTabStore.getState().reset();
      useUIStore.getState().reset();
      useMessageStore.getState().reset();
    });
  });

  describe('connection store setters', () => {
    it('should set active tab id', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setActiveTabId('tab-123');
      });

      expect(useTabStore.getState().activeTabId).toBe('tab-123');
    });

    it('should set isConnected', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setIsConnected(true);
      });

      expect(useConnectionStore.getState().isConnected).toBe(true);
    });

    it('should set networkName', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setNetworkName('Freenode');
      });

      expect(useConnectionStore.getState().networkName).toBe('Freenode');
    });

    it('should set primaryNetworkId', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setPrimaryNetworkId('net-1');
      });

      expect(useConnectionStore.getState().primaryNetworkId).toBe('net-1');
    });

    it('should set activeConnectionId', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setActiveConnectionId('conn-1');
      });

      expect(useConnectionStore.getState().activeConnectionId).toBe('conn-1');
    });

    it('should set ping', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setPing(42);
      });

      expect(useConnectionStore.getState().ping).toBe(42);
    });

    it('should set tabs with array', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const tabs: ChannelTab[] = [
        {
          id: 'tab1',
          networkId: 'net1',
          channel: '#general',
          label: 'General',
          messages: [],
          hasActivity: false,
        },
        {
          id: 'tab2',
          networkId: 'net1',
          channel: '#random',
          label: 'Random',
          messages: [],
          hasActivity: false,
        },
      ];

      await act(() => {
        result.current.setTabs(tabs);
      });

      expect(useTabStore.getState().tabs).toHaveLength(2);
    });

    it('should set tabs with function updater', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const initialTabs: ChannelTab[] = [
        {
          id: 'tab1',
          networkId: 'net1',
          channel: '#general',
          label: 'General',
          messages: [],
          hasActivity: false,
        },
      ];

      await act(() => {
        result.current.setTabs(initialTabs);
      });

      await act(() => {
        result.current.setTabs(prev => [
          ...prev,
          {
            id: 'tab2',
            networkId: 'net1',
            channel: '#random',
            label: 'Random',
            messages: [],
            hasActivity: false,
          },
        ]);
      });

      expect(useTabStore.getState().tabs).toHaveLength(2);
    });

    it('should not update tabs if reference is same', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const tabs: ChannelTab[] = [
        {
          id: 'tab1',
          networkId: 'net1',
          channel: '#general',
          label: 'General',
          messages: [],
          hasActivity: false,
        },
      ];

      await act(() => {
        result.current.setTabs(tabs);
      });

      const currentTabs = useTabStore.getState().tabs;

      await act(() => {
        result.current.setTabs(currentTabs);
      });

      // Should be the same reference
      expect(useTabStore.getState().tabs).toBe(currentTabs);
    });
  });

  describe('UI store setters - first run', () => {
    it('should set showFirstRunSetup', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowFirstRunSetup(true);
      });

      expect(useUIStore.getState().showFirstRunSetup).toBe(true);
    });

    it('should set isCheckingFirstRun', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setIsCheckingFirstRun(false);
      });

      expect(useUIStore.getState().isCheckingFirstRun).toBe(false);
    });
  });

  describe('UI store setters - message display', () => {
    it('should set showRawCommands', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowRawCommands(false);
      });

      expect(useUIStore.getState().showRawCommands).toBe(false);
    });

    it('should set rawCategoryVisibility', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const visibility: Record<RawMessageCategory, boolean> = {
        connection: true,
        channel: false,
        user: true,
        server: false,
        error: true,
        other: false,
      };

      await act(() => {
        result.current.setRawCategoryVisibility(visibility);
      });

      expect(useUIStore.getState().rawCategoryVisibility).toEqual(visibility);
    });

    it('should set showTypingIndicators', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowTypingIndicators(false);
      });

      expect(useUIStore.getState().showTypingIndicators).toBe(false);
    });

    it('should set hideJoinMessages', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setHideJoinMessages(true);
      });

      expect(useUIStore.getState().hideJoinMessages).toBe(true);
    });

    it('should set hidePartMessages', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setHidePartMessages(true);
      });

      expect(useUIStore.getState().hidePartMessages).toBe(true);
    });

    it('should set hideQuitMessages', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setHideQuitMessages(true);
      });

      expect(useUIStore.getState().hideQuitMessages).toBe(true);
    });

    it('should set hideIrcServiceListenerMessages', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setHideIrcServiceListenerMessages(false);
      });

      expect(useUIStore.getState().hideIrcServiceListenerMessages).toBe(false);
    });
  });

  describe('message store setters', () => {
    it('should set typing user', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const status = { status: 'active' as const, timestamp: Date.now() };

      await act(() => {
        result.current.setTypingUser('net1', '#channel', 'nick1', status);
      });

      const typingUsers = useMessageStore.getState().typingUsers;
      expect(typingUsers.has('net1')).toBe(true);
    });

    it('should remove typing user', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const status = { status: 'active' as const, timestamp: Date.now() };

      await act(() => {
        result.current.setTypingUser('net1', '#channel', 'nick1', status);
        result.current.removeTypingUser('net1', '#channel', 'nick1');
      });

      expect(useMessageStore.getState().typingUsers.has('net1')).toBe(false);
    });

    it('should clear typing for target', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const status = { status: 'active' as const, timestamp: Date.now() };

      await act(() => {
        result.current.setTypingUser('net1', '#channel', 'nick1', status);
        result.current.clearTypingForTarget('net1', '#channel');
      });

      expect(useMessageStore.getState().typingUsers.has('net1')).toBe(false);
    });

    it('should cleanup stale typing', async () => {
      const { result } = await renderHook(() => useStoreSetters());
      const oldStatus = {
        status: 'active' as const,
        timestamp: Date.now() - 20000,
      };

      await act(() => {
        result.current.setTypingUser('net1', '#channel', 'nick1', oldStatus);
        result.current.cleanupStaleTyping();
      });

      expect(useMessageStore.getState().typingUsers.has('net1')).toBe(false);
    });
  });

  describe('app lock setters', () => {
    it('should set appLockEnabled', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppLockEnabled(true);
      });

      expect(useUIStore.getState().appLockEnabled).toBe(true);
    });

    it('should set appLockUseBiometric', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppLockUseBiometric(true);
      });

      expect(useUIStore.getState().appLockUseBiometric).toBe(true);
    });

    it('should set appLockUsePin', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppLockUsePin(true);
      });

      expect(useUIStore.getState().appLockUsePin).toBe(true);
    });

    it('should set appLockOnLaunch', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppLockOnLaunch(false);
      });

      expect(useUIStore.getState().appLockOnLaunch).toBe(false);
    });

    it('should set appLockOnBackground', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppLockOnBackground(false);
      });

      expect(useUIStore.getState().appLockOnBackground).toBe(false);
    });

    it('should set appLocked', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppLocked(true);
      });

      expect(useUIStore.getState().appLocked).toBe(true);
    });

    it('should set appUnlockModalVisible', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppUnlockModalVisible(true);
      });

      expect(useUIStore.getState().appUnlockModalVisible).toBe(true);
    });

    it('should set appPinEntry', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppPinEntry('1234');
      });

      expect(useUIStore.getState().appPinEntry).toBe('1234');
    });

    it('should set appPinError', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAppPinError('Invalid PIN');
      });

      expect(useUIStore.getState().appPinError).toBe('Invalid PIN');
    });
  });

  describe('banner/ad setters', () => {
    it('should set bannerVisible', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setBannerVisible(true);
      });

      expect(useUIStore.getState().bannerVisible).toBe(true);
    });

    it('should set scriptingTimeMs', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setScriptingTimeMs(5000);
      });

      expect(useUIStore.getState().scriptingTimeMs).toBe(5000);
    });

    it('should set adFreeTimeMs', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setAdFreeTimeMs(10000);
      });

      expect(useUIStore.getState().adFreeTimeMs).toBe(10000);
    });
  });

  describe('modal setters', () => {
    it('should set channelName', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setChannelName('#general');
      });

      expect(useUIStore.getState().channelName).toBe('#general');
    });

    it('should set channelNoteValue', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setChannelNoteValue('This is a note');
      });

      expect(useUIStore.getState().channelNoteValue).toBe('This is a note');
    });

    it('should set renameValue', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setRenameValue('New Name');
      });

      expect(useUIStore.getState().renameValue).toBe('New Name');
    });

    it('should set dccSendPath', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setDccSendPath('/path/to/file.txt');
      });

      expect(useUIStore.getState().dccSendPath).toBe('/path/to/file.txt');
    });

    it('should set showOptionsMenu', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowOptionsMenu(true);
      });

      expect(useUIStore.getState().showOptionsMenu).toBe(true);
    });

    it('should set showSettings', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowSettings(true);
      });

      expect(useUIStore.getState().showSettings).toBe(true);
    });
  });

  describe('help screen setters', () => {
    it('should set showHelpConnection', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowHelpConnection(true);
      });

      expect(useUIStore.getState().showHelpConnection).toBe(true);
    });

    it('should set showHelpCommands', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowHelpCommands(true);
      });

      expect(useUIStore.getState().showHelpCommands).toBe(true);
    });

    it('should set showHelpEncryption', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowHelpEncryption(true);
      });

      expect(useUIStore.getState().showHelpEncryption).toBe(true);
    });

    it('should set showHelpMedia', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowHelpMedia(true);
      });

      expect(useUIStore.getState().showHelpMedia).toBe(true);
    });

    it('should set showHelpChannelManagement', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowHelpChannelManagement(true);
      });

      expect(useUIStore.getState().showHelpChannelManagement).toBe(true);
    });

    it('should set showHelpTroubleshooting', async () => {
      const { result } = await renderHook(() => useStoreSetters());

      await act(() => {
        result.current.setShowHelpTroubleshooting(true);
      });

      expect(useUIStore.getState().showHelpTroubleshooting).toBe(true);
    });
  });

  describe('setter stability', () => {
    it('should return stable references across re-renders', async () => {
      const { result, rerender } = await renderHook(() => useStoreSetters());

      const firstRenderSetters = result.current;
      await rerender();
      const secondRenderSetters = result.current;

      // All setters should be the same reference (wrapped in useCallback with empty deps)
      expect(secondRenderSetters.setIsConnected).toBe(
        firstRenderSetters.setIsConnected,
      );
      expect(secondRenderSetters.setNetworkName).toBe(
        firstRenderSetters.setNetworkName,
      );
      expect(secondRenderSetters.setTabs).toBe(firstRenderSetters.setTabs);
      expect(secondRenderSetters.setShowSettings).toBe(
        firstRenderSetters.setShowSettings,
      );
      expect(secondRenderSetters.setAppLocked).toBe(
        firstRenderSetters.setAppLocked,
      );
    });
  });
});
