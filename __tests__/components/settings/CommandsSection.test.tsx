/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for CommandsSection component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CommandsSection } from '../../../src/components/settings/sections/CommandsSection';

const mockCapturedItems = new Map<string, any>();

const mockGetAliases = jest.fn(() => [] as any[]);
const mockGetCustomCommands = jest.fn(() => [] as any[]);
const mockGetHistory = jest.fn(() => [] as any[]);
const mockAddAlias = jest.fn(async () => undefined);
const mockAddCustomCommand = jest.fn(async () => undefined);
const mockRemoveAlias = jest.fn(async () => undefined);
const mockRemoveCustomCommand = jest.fn(async () => undefined);
const mockDeleteHistoryEntry = jest.fn(async () => undefined);
const mockClearHistory = jest.fn(async () => undefined);

jest.mock('../../../src/i18n/transifex', () => ({
  useT: () => (key: string) => key,
}));

jest.mock('../../../src/components/settings/SettingItem', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    SettingItem: ({ item, onPress }: any) => {
      mockCapturedItems.set(item.id, item);
      return React.createElement(
        TouchableOpacity,
        {
          testID: `setting-${item.id}`,
          onPress: () => {
            item.onPress?.();
            if (item.type === 'submenu') onPress?.(item.id);
          },
        },
        React.createElement(Text, null, item.title || item.id),
      );
    },
  };
});

jest.mock('../../../src/services/CommandService', () => ({
  commandService: {
    getAliases: (...args: any[]) => mockGetAliases(...args),
    getCustomCommands: (...args: any[]) => mockGetCustomCommands(...args),
    getHistory: (...args: any[]) => mockGetHistory(...args),
    addAlias: (...args: any[]) => mockAddAlias(...args),
    removeAlias: (...args: any[]) => mockRemoveAlias(...args),
    addCustomCommand: (...args: any[]) => mockAddCustomCommand(...args),
    removeCustomCommand: (...args: any[]) => mockRemoveCustomCommand(...args),
    deleteHistoryEntry: (...args: any[]) => mockDeleteHistoryEntry(...args),
    clearHistory: (...args: any[]) => mockClearHistory(...args),
  },
}));

const mockColors = {
  text: '#000000',
  textSecondary: '#666666',
  primary: '#007AFF',
  surface: '#FFFFFF',
  border: '#E0E0E0',
  background: '#F5F5F5',
};

const mockStyles = {
  settingItem: {},
  settingContent: {},
  settingTitleRow: {},
  settingTitle: {},
  settingDescription: {},
  disabledItem: {},
  disabledText: {},
  chevron: {},
  input: {},
  disabledInput: {},
  submenuOverlay: {},
  submenuContainer: {},
  submenuHeader: {},
  submenuTitle: {},
  submenuItem: {},
  submenuItemContent: {},
  submenuItemText: {},
  submenuItemDescription: {},
  submenuInput: {},
  closeButtonText: {},
};

const mockSettingIcons = {};

describe('CommandsSection', () => {
  beforeEach(() => {
    mockCapturedItems.clear();
    jest.clearAllMocks();
    mockGetAliases.mockReturnValue([]);
    mockGetCustomCommands.mockReturnValue([]);
    mockGetHistory.mockReturnValue([]);
  });

  it('should render command history section', async () => {
    const { getByText } = await render(
      <CommandsSection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    expect(getByText(/Command History/i)).toBeTruthy();
  });

  it('should render command aliases section', async () => {
    const { getByText } = await render(
      <CommandsSection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    expect(getByText(/Command Aliases/i)).toBeTruthy();
  });

  it('should render custom commands section', async () => {
    const { getByText } = await render(
      <CommandsSection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    expect(getByText(/Custom Commands/i)).toBeTruthy();
  });

  it('should display command history entries', async () => {
    const mockHistory = [
      {
        id: '1',
        command: '/join #test',
        timestamp: Date.now(),
        channel: '#test',
      },
    ];
    mockGetHistory.mockReturnValue(mockHistory);

    await render(
      <CommandsSection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('commands-history')).toBe(true),
    );

    const historyEntry = mockCapturedItems
      .get('commands-history')
      .submenuItems.find((x: any) => x.id === 'history-1');
    expect(historyEntry).toBeTruthy();
    expect(historyEntry.title).toBe('/join #test');
  });

  it('should display command aliases', async () => {
    const mockAliases = [
      {
        alias: 'j',
        command: '/join {channel}',
        description: 'Join channel',
      },
    ];
    mockGetAliases.mockReturnValue(mockAliases);

    await render(
      <CommandsSection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('commands-aliases')).toBe(true),
    );

    const aliasEntry = mockCapturedItems
      .get('commands-aliases')
      .submenuItems.find((x: any) => x.id === 'alias-j');
    expect(aliasEntry).toBeTruthy();
    expect(aliasEntry.title).toBe('/j');
  });

  it('should display custom commands', async () => {
    const mockCommands = [
      {
        name: 'greet',
        command: '/msg {channel} Hello',
        description: 'Greet channel',
        parameters: ['channel'],
      },
    ];
    mockGetCustomCommands.mockReturnValue(mockCommands);

    await render(
      <CommandsSection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('commands-custom')).toBe(true),
    );

    const cmdEntry = mockCapturedItems
      .get('commands-custom')
      .submenuItems.find((x: any) => x.id === 'cmd-greet');
    expect(cmdEntry).toBeTruthy();
    expect(cmdEntry.title).toBe('/greet');
  });
});
