/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NativeModules, Platform } from 'react-native';

describe('ScreenshotProtectionService', () => {
  const mockSetScreenshotProtectionEnabled = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    Platform.OS = 'android';
    (NativeModules as any).ScreenshotProtectionModule = {
      setScreenshotProtectionEnabled: mockSetScreenshotProtectionEnabled,
    };
  });

  afterEach(() => {
    delete (NativeModules as any).ScreenshotProtectionModule;
    jest.restoreAllMocks();
  });

  it('enables native protection when screenshots are disallowed', async () => {
    const {
      screenshotProtectionService,
    } = require('../../src/services/ScreenshotProtectionService');

    await screenshotProtectionService.setAllowScreenshots(false);

    expect(mockSetScreenshotProtectionEnabled).toHaveBeenCalledWith(true);
  });

  it('disables native protection when screenshots are allowed', async () => {
    const {
      screenshotProtectionService,
    } = require('../../src/services/ScreenshotProtectionService');

    await screenshotProtectionService.setAllowScreenshots(true);

    expect(mockSetScreenshotProtectionEnabled).toHaveBeenCalledWith(false);
  });

  it('does nothing on non-Android platforms', async () => {
    Platform.OS = 'ios';
    const {
      screenshotProtectionService,
    } = require('../../src/services/ScreenshotProtectionService');

    await screenshotProtectionService.setAllowScreenshots(false);

    expect(mockSetScreenshotProtectionEnabled).not.toHaveBeenCalled();
  });

  it('does nothing when the native module is missing', async () => {
    delete (NativeModules as any).ScreenshotProtectionModule;
    const {
      screenshotProtectionService,
    } = require('../../src/services/ScreenshotProtectionService');

    await screenshotProtectionService.setAllowScreenshots(false);

    expect(mockSetScreenshotProtectionEnabled).not.toHaveBeenCalled();
  });

  it('logs native update failures without throwing', async () => {
    const failingSetScreenshotProtectionEnabled = jest
      .fn()
      .mockRejectedValue(new Error('Native failure'));
    (NativeModules as any).ScreenshotProtectionModule = {
      setScreenshotProtectionEnabled: failingSetScreenshotProtectionEnabled,
    };
    const {
      screenshotProtectionService,
    } = require('../../src/services/ScreenshotProtectionService');

    await screenshotProtectionService.setAllowScreenshots(false);

    expect(console.warn).toHaveBeenCalledWith(
      '[ScreenshotProtectionService] Failed to update screenshot protection:',
      expect.any(Error),
    );
  });
});
