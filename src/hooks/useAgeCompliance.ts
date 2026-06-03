/*
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect, useState } from 'react';
import {
  AgeComplianceDecision,
  evaluateAgeSignalCompliance,
  playAgeSignalsService,
} from '../services/PlayAgeSignalsService';

export interface AgeComplianceState {
  isChecking: boolean;
  decision: AgeComplianceDecision;
}

export function useAgeCompliance(): AgeComplianceState {
  const [state, setState] = useState<AgeComplianceState>({
    isChecking: true,
    decision: evaluateAgeSignalCompliance(null),
  });

  useEffect(() => {
    let cancelled = false;

    const checkCompliance = async () => {
      try {
        const decision = await playAgeSignalsService.getComplianceDecision();
        if (!cancelled) {
          setState({ isChecking: false, decision });
        }
      } catch (error) {
        console.warn('Age compliance check failed:', error);
        if (!cancelled) {
          setState({
            isChecking: false,
            decision: evaluateAgeSignalCompliance(null),
          });
        }
      }
    };

    checkCompliance();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
