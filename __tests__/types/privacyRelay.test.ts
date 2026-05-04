/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
  DEFAULT_PRIVACY_RELAY_TURN_SERVER,
  PRIVACY_RELAY_BASE_PLAN_IDS,
  PRIVACY_RELAY_PRODUCT_ID,
  PrivacyRelaySubscription,
  isPrivacyRelayActive,
} from '../../src/types/privacyRelay';

describe('privacyRelay types', () => {
  const createSubscription = (
    overrides: Partial<PrivacyRelaySubscription> = {},
  ): PrivacyRelaySubscription => ({
    productId: PRIVACY_RELAY_PRODUCT_ID,
    basePlanId: 'monthly',
    purchaseToken: 'token',
    status: 'active',
    expiresAt: null,
    activatedAt: '2026-03-02T00:00:00.000Z',
    lastValidatedAt: null,
    ...overrides,
  });

  it('exports product and server defaults', () => {
    expect(PRIVACY_RELAY_PRODUCT_ID).toBe('privacy_relay');
    expect(PRIVACY_RELAY_BASE_PLAN_IDS.monthly).toBe('monthly');
    expect(DEFAULT_PRIVACY_RELAY_TURN_SERVER.host).toBe('turn.dbase.in.rs');
    expect(DEFAULT_PRIVACY_RELAY_TURN_SERVER.turnUrls).toContain(
      'turns:turn.dbase.in.rs:5349?transport=tcp',
    );
  });

  it('detects active subscription states', () => {
    expect(isPrivacyRelayActive(null)).toBe(false);
    expect(isPrivacyRelayActive(createSubscription())).toBe(true);
    expect(isPrivacyRelayActive(createSubscription({ status: 'grace' }))).toBe(
      true,
    );
    expect(
      isPrivacyRelayActive(createSubscription({ status: 'inactive' })),
    ).toBe(false);
  });

  it('treats expired or malformed expiry dates as inactive', () => {
    const now = new Date('2026-03-02T00:00:00.000Z');

    expect(
      isPrivacyRelayActive(
        createSubscription({ expiresAt: '2026-03-03T00:00:00.000Z' }),
        now,
      ),
    ).toBe(true);
    expect(
      isPrivacyRelayActive(
        createSubscription({ expiresAt: '2026-03-01T00:00:00.000Z' }),
        now,
      ),
    ).toBe(false);
    expect(
      isPrivacyRelayActive(createSubscription({ expiresAt: 'invalid' }), now),
    ).toBe(false);
  });
});
