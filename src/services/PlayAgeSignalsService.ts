/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NativeModules, Platform } from 'react-native';

export type PlayAgeSignalsStatus =
  | 'VERIFIED'
  | 'DECLARED'
  | 'SUPERVISED'
  | 'SUPERVISED_APPROVAL_PENDING'
  | 'SUPERVISED_APPROVAL_DENIED'
  | 'UNKNOWN'
  | null;

export interface PlayAgeSignalsResult {
  userStatus: PlayAgeSignalsStatus;
  userStatusCode: number | null;
  ageLower: number | null;
  ageUpper: number | null;
  installId: string | null;
  mostRecentApprovalDate: number | null;
}

export interface AgeComplianceDecision {
  allowed: boolean;
  restrictedMode: boolean;
  reason: string;
  signal: PlayAgeSignalsResult | null;
}

export interface PlayAgeSignalsError {
  code: string;
  message: string;
  retryable: boolean;
}

interface PlayAgeSignalsNativeModule {
  checkAgeSignals(): Promise<PlayAgeSignalsResult>;
  isAvailable(): Promise<boolean>;
}

const MINIMUM_ALLOWED_AGE = 13;
const RETRYABLE_ERROR_CODES = new Set([
  '-1',
  '-2',
  '-3',
  '-4',
  '-5',
  '-6',
  '-7',
  '-8',
]);

const getNativeModule = (): PlayAgeSignalsNativeModule | null => {
  return (NativeModules.PlayAgeSignalsModule ||
    null) as PlayAgeSignalsNativeModule | null;
};

export const normalizeAgeSignalsError = (error: any): PlayAgeSignalsError => {
  const code = String(error?.code || error?.nativeErrorCode || 'UNKNOWN');
  const numericCode = code.match(/-?\d+$/)?.[0] || '';

  return {
    code,
    message: error?.message || 'Play Age Signals request failed',
    retryable: RETRYABLE_ERROR_CODES.has(numericCode),
  };
};

export const evaluateAgeSignalCompliance = (
  signal: PlayAgeSignalsResult | null,
): AgeComplianceDecision => {
  if (!signal || signal.userStatus === null) {
    return {
      allowed: true,
      restrictedMode: false,
      reason: 'Age signal is not applicable or not shared by Google Play.',
      signal,
    };
  }

  if (signal.userStatus === 'SUPERVISED_APPROVAL_DENIED') {
    return {
      allowed: false,
      restrictedMode: true,
      reason:
        'A supervising parent denied approval for this app or a significant change.',
      signal,
    };
  }

  if (signal.ageUpper !== null && signal.ageUpper < MINIMUM_ALLOWED_AGE) {
    return {
      allowed: false,
      restrictedMode: true,
      reason: `Google Play age signal indicates the user is under ${MINIMUM_ALLOWED_AGE}.`,
      signal,
    };
  }

  if (signal.userStatus === 'SUPERVISED_APPROVAL_PENDING') {
    return {
      allowed: true,
      restrictedMode: true,
      reason: 'A supervised account has a pending significant-change approval.',
      signal,
    };
  }

  if (signal.userStatus === 'UNKNOWN') {
    return {
      allowed: true,
      restrictedMode: true,
      reason:
        'Google Play reports that the user age is unknown in an applicable region.',
      signal,
    };
  }

  return {
    allowed: true,
    restrictedMode: false,
    reason: 'Google Play age signal allows normal access.',
    signal,
  };
};

class PlayAgeSignalsService {
  private lastSignal: PlayAgeSignalsResult | null = null;
  private lastDecision: AgeComplianceDecision | null = null;

  public getLastSignal(): PlayAgeSignalsResult | null {
    return this.lastSignal;
  }

  public getLastDecision(): AgeComplianceDecision | null {
    return this.lastDecision;
  }

  public async checkAvailability(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    const nativeModule = getNativeModule();
    if (!nativeModule) {
      return false;
    }

    try {
      return await nativeModule.isAvailable();
    } catch {
      return false;
    }
  }

  public async requestAgeSignals(
    maxAttempts = 3,
  ): Promise<PlayAgeSignalsResult | null> {
    if (Platform.OS !== 'android') {
      return null;
    }

    const nativeModule = getNativeModule();
    if (!nativeModule) {
      return null;
    }

    let lastError: PlayAgeSignalsError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const signal = await nativeModule.checkAgeSignals();
        this.lastSignal = signal;
        this.lastDecision = evaluateAgeSignalCompliance(signal);
        return signal;
      } catch (error) {
        lastError = normalizeAgeSignalsError(error);
        if (!lastError.retryable || attempt >= maxAttempts) {
          break;
        }

        await this.delay(Math.min(250 * 2 ** (attempt - 1), 2000));
      }
    }

    console.warn('Play Age Signals unavailable:', lastError);
    this.lastSignal = null;
    this.lastDecision = evaluateAgeSignalCompliance(null);
    return null;
  }

  public async getComplianceDecision(): Promise<AgeComplianceDecision> {
    const signal = await this.requestAgeSignals();
    const decision = evaluateAgeSignalCompliance(signal);
    this.lastDecision = decision;
    return decision;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const playAgeSignalsService = new PlayAgeSignalsService();
