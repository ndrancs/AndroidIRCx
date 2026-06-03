/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { evaluateAgeSignalCompliance } from '../../src/services/PlayAgeSignalsService';

describe('PlayAgeSignalsService compliance policy', () => {
  const baseSignal = {
    userStatus: 'VERIFIED' as const,
    userStatusCode: 0,
    ageLower: 18,
    ageUpper: null,
    installId: null,
    mostRecentApprovalDate: null,
  };

  it('allows users when Play returns no applicable/shared age signal', () => {
    const decision = evaluateAgeSignalCompliance(null);

    expect(decision.allowed).toBe(true);
    expect(decision.restrictedMode).toBe(false);
  });

  it('blocks supervised accounts when parent approval is denied', () => {
    const decision = evaluateAgeSignalCompliance({
      ...baseSignal,
      userStatus: 'SUPERVISED_APPROVAL_DENIED',
      userStatusCode: 3,
      ageLower: 13,
      ageUpper: 15,
      installId: 'install-id',
    });

    expect(decision.allowed).toBe(false);
    expect(decision.restrictedMode).toBe(true);
  });

  it('blocks age ranges entirely below 13', () => {
    const decision = evaluateAgeSignalCompliance({
      ...baseSignal,
      userStatus: 'DECLARED',
      userStatusCode: 5,
      ageLower: 0,
      ageUpper: 12,
    });

    expect(decision.allowed).toBe(false);
  });

  it('allows but flags pending or unknown statuses as restricted mode', () => {
    const pending = evaluateAgeSignalCompliance({
      ...baseSignal,
      userStatus: 'SUPERVISED_APPROVAL_PENDING',
      userStatusCode: 2,
    });
    const unknown = evaluateAgeSignalCompliance({
      ...baseSignal,
      userStatus: 'UNKNOWN',
      userStatusCode: 4,
      ageLower: null,
      ageUpper: null,
    });

    expect(pending.allowed).toBe(true);
    expect(pending.restrictedMode).toBe(true);
    expect(unknown.allowed).toBe(true);
    expect(unknown.restrictedMode).toBe(true);
  });
});
