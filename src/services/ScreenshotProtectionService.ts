/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NativeModules, Platform } from 'react-native';

interface ScreenshotProtectionNativeModule {
  setScreenshotProtectionEnabled: (enabled: boolean) => Promise<boolean> | void;
}

const ScreenshotProtectionModule: ScreenshotProtectionNativeModule | undefined =
  NativeModules?.ScreenshotProtectionModule;

class ScreenshotProtectionService {
  private readonly isAvailable: boolean;

  constructor() {
    this.isAvailable =
      Platform.OS === 'android' && !!ScreenshotProtectionModule;
  }

  async setAllowScreenshots(allowScreenshots: boolean): Promise<void> {
    if (!this.isAvailable || !ScreenshotProtectionModule) {
      return;
    }

    try {
      await ScreenshotProtectionModule.setScreenshotProtectionEnabled(
        !allowScreenshots,
      );
    } catch (error) {
      console.warn(
        '[ScreenshotProtectionService] Failed to update screenshot protection:',
        error,
      );
    }
  }
}

export const screenshotProtectionService = new ScreenshotProtectionService();
