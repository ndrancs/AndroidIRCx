/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const mockRequestIntegrityToken = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
}));

jest.mock('../../src/services/PlayIntegrityService', () => ({
  playIntegrityService: {
    requestIntegrityToken: (...args: unknown[]) =>
      mockRequestIntegrityToken(...args),
  },
}));

jest.mock('../../src/services/Logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
  },
}));

import {
  createPlayIntegrityRequestSecurity,
  withPlayIntegrityBody,
  withPlayIntegrityHeaders,
} from '../../src/services/PlayIntegrityRequestSecurity';

const setCrypto = (enabled: boolean) => {
  if (!enabled) {
    (global as any).crypto = undefined;
    return;
  }

  (global as any).crypto = {
    getRandomValues: jest.fn((bytes: Uint8Array) => {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = i + 1;
      }
      return bytes;
    }),
  };
};

describe('PlayIntegrityRequestSecurity', () => {
  let originalCrypto: Crypto | undefined;
  let dateSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    originalCrypto = global.crypto;
    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1710000000000);
    setCrypto(true);
    const RN = require('react-native');
    RN.Platform.OS = 'android';
    mockRequestIntegrityToken.mockResolvedValue({ token: 'integrity-token' });
  });

  afterEach(() => {
    (global as any).crypto = originalCrypto;
    dateSpy.mockRestore();
  });

  it('creates request security with a secure random request hash', async () => {
    const result = await createPlayIntegrityRequestSecurity('media-upload');

    expect(result).toEqual({
      integrityToken: 'integrity-token',
      requestHash: expect.stringMatching(/^[A-Za-z0-9_-]+$/),
      issuedAtEpochSeconds: 1710000000,
    });
    expect(result?.requestHash).toHaveLength(24);
    expect(mockRequestIntegrityToken).toHaveBeenCalledWith(result?.requestHash);
    expect(global.crypto?.getRandomValues).toHaveBeenCalledWith(
      expect.any(Uint8Array),
    );
  });

  it('does not create request security outside Android', async () => {
    const RN = require('react-native');
    RN.Platform.OS = 'ios';

    await expect(
      createPlayIntegrityRequestSecurity('privacy-relay'),
    ).resolves.toBeNull();

    expect(mockRequestIntegrityToken).not.toHaveBeenCalled();
  });

  it('fails closed when secure random is unavailable', async () => {
    const mathRandomSpy = jest.spyOn(Math, 'random');
    setCrypto(false);

    const result = await createPlayIntegrityRequestSecurity('privacy-relay');

    expect(result).toBeNull();
    expect(mockRequestIntegrityToken).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'play-integrity',
      expect.stringContaining('secure random generator unavailable'),
    );
    expect(mathRandomSpy).not.toHaveBeenCalled();
    mathRandomSpy.mockRestore();
  });

  it('returns null when Play Integrity token is unavailable', async () => {
    mockRequestIntegrityToken.mockResolvedValueOnce({
      token: '',
      error: 'api unavailable',
    });

    const result = await createPlayIntegrityRequestSecurity('iap');

    expect(result).toBeNull();
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'play-integrity',
      'iap: token unavailable (api unavailable)',
    );
  });

  it('adds request security to headers and body', () => {
    const security = {
      integrityToken: 'token',
      requestHash: 'hash',
      issuedAtEpochSeconds: 123,
    };

    expect(withPlayIntegrityHeaders({ Accept: 'json' }, security)).toEqual({
      Accept: 'json',
      'X-Play-Integrity-Token': 'token',
      'X-Play-Integrity-Request-Hash': 'hash',
      'X-Play-Integrity-Issued-At': '123',
    });
    expect(withPlayIntegrityBody({ media_id: 'm1' }, security)).toEqual({
      media_id: 'm1',
      request_security: {
        integrity_token: 'token',
        request_hash: 'hash',
        issued_at: 123,
      },
    });
  });
});
