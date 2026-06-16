/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for SecuritySection component
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SecuritySection } from '../../../src/components/settings/sections/SecuritySection';

const mockCapturedItems = new Map<string, any>();
const mockSettingsGet = jest.fn(async (_k: string, d: any) => d);
const mockSettingsSet = jest.fn(async () => undefined);
const mockHasEnrolledBiometrics = jest.fn(async () => true);
const mockIsAvailable = jest.fn(async () => true);
const mockEnableLock = jest.fn(async () => true);
const mockDisableLock = jest.fn(async () => undefined);
const mockSetSecret = jest.fn(async () => undefined);
const mockRemoveSecret = jest.fn(async () => undefined);
const mockSetAllowScreenshots = jest.fn(async () => undefined);

jest.mock('../../../src/i18n/transifex', () => ({
  useT: () => (key: string) => key,
}));

jest.mock('../../../src/components/settings/SettingItem', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    SettingItem: ({ item }: any) => {
      mockCapturedItems.set(item.id, item);
      return React.createElement(
        TouchableOpacity,
        {
          testID: `setting-${item.id}`,
          onPress: () => {
            item.onPress?.();
            if (item.type === 'switch') item.onValueChange?.(!item.value);
          },
        },
        React.createElement(Text, null, item.title || item.id),
      );
    },
  };
});

jest.mock('../../../src/services/SettingsService', () => ({
  settingsService: {
    getSetting: (...args: any[]) => mockSettingsGet(...args),
    setSetting: (...args: any[]) => mockSettingsSet(...args),
  },
}));

jest.mock('../../../src/services/BiometricAuthService', () => ({
  biometricAuthService: {
    hasEnrolledBiometrics: (...args: any[]) =>
      mockHasEnrolledBiometrics(...args),
    isAvailable: (...args: any[]) => mockIsAvailable(...args),
    enableLock: (...args: any[]) => mockEnableLock(...args),
    disableLock: (...args: any[]) => mockDisableLock(...args),
  },
}));

jest.mock('../../../src/services/SecureStorageService', () => ({
  secureStorageService: {
    setSecret: (...args: any[]) => mockSetSecret(...args),
    removeSecret: (...args: any[]) => mockRemoveSecret(...args),
  },
}));

jest.mock('../../../src/services/ScreenshotProtectionService', () => ({
  screenshotProtectionService: {
    setAllowScreenshots: (...args: any[]) => mockSetAllowScreenshots(...args),
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
  submenuOverlay: {},
  submenuContainer: {},
  submenuHeader: {},
  submenuTitle: {},
  closeButtonText: {},
  submenuInput: {},
  submenuItemDescription: {},
};

const mockSettingIcons = {};

describe('SecuritySection', () => {
  beforeEach(() => {
    mockCapturedItems.clear();
    jest.clearAllMocks();
    mockSettingsGet.mockImplementation(async (_k: string, d: any) => d);
    mockHasEnrolledBiometrics.mockResolvedValue(true);
    mockIsAvailable.mockResolvedValue(true);
    mockEnableLock.mockResolvedValue(true);
    mockDisableLock.mockResolvedValue(undefined);
  });

  it('should render security settings', async () => {
    await render(
      <SecuritySection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('security-manage-keys')).toBe(true),
    );
    expect(mockCapturedItems.has('security-qr')).toBe(true);
  });

  it('should toggle QR verification setting', async () => {
    await render(
      <SecuritySection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('security-qr')).toBe(true),
    );

    await act(async () => {
      await mockCapturedItems.get('security-qr').onValueChange(false);
    });

    expect(mockSettingsSet).toHaveBeenCalledWith(
      'securityAllowQrVerification',
      false,
    );
  });

  it('should call onShowKeyManagement when key management is pressed', async () => {
    const mockOnShowKeyManagement = jest.fn();
    const { getByTestId } = await render(
      <SecuritySection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
        onShowKeyManagement={mockOnShowKeyManagement}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('security-manage-keys')).toBe(true),
    );

    await fireEvent.press(getByTestId('setting-security-manage-keys'));

    expect(mockOnShowKeyManagement).toHaveBeenCalled();
  });

  it('should call onShowMigrationDialog when migration is pressed', async () => {
    const mockOnShowMigrationDialog = jest.fn();
    const { getByTestId } = await render(
      <SecuritySection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
        onShowMigrationDialog={mockOnShowMigrationDialog}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('security-migrate-keys')).toBe(true),
    );

    await fireEvent.press(getByTestId('setting-security-migrate-keys'));

    expect(mockOnShowMigrationDialog).toHaveBeenCalled();
  });

  it('should disable biometric option when biometrics unavailable', async () => {
    mockHasEnrolledBiometrics.mockResolvedValue(false);

    await render(
      <SecuritySection
        colors={mockColors}
        styles={mockStyles as any}
        settingIcons={mockSettingIcons}
      />,
    );

    await waitFor(() =>
      expect(mockCapturedItems.has('security-app-lock-biometric')).toBe(true),
    );

    const biometricItem = mockCapturedItems.get('security-app-lock-biometric');
    expect(biometricItem.disabled).toBe(true);
  });
});
