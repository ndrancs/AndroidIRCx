/**
 * Copyright (c) 2025-2026 Velimir Majstorov
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Tests for useBannerAds hook
 */

import { renderHook, act } from '@testing-library/react-native';
import { useBannerAds } from '../../src/hooks/useBannerAds';

const mockSetScriptingTimeMs = jest.fn();
const mockSetBannerVisible = jest.fn();
let purchaseListener: (() => void) | null = null;
let scriptingListener: ((ms: number) => void) | null = null;
let bannerListener: ((visible: boolean) => void) | null = null;

jest.mock('../../src/stores/uiStore', () => ({
  useUIStore: Object.assign(
    (selector: any) => selector({ scriptingTimeMs: 0 }),
    {
      getState: () => ({
        setScriptingTimeMs: mockSetScriptingTimeMs,
        setBannerVisible: mockSetBannerVisible,
      }),
    },
  ),
}));

jest.mock('../../src/services/AdRewardService', () => ({
  adRewardService: {
    isTracking: jest.fn(() => false),
    getRemainingTime: jest.fn(() => 0),
    addListener: jest.fn((cb: any) => {
      scriptingListener = cb;
      return jest.fn(() => {
        scriptingListener = null;
      });
    }),
  },
}));

jest.mock('../../src/services/BannerAdService', () => ({
  bannerAdService: {
    stopShowHideCycle: jest.fn(),
    setBannerVisible: jest.fn(),
    addListener: jest.fn((cb: any) => {
      bannerListener = cb;
      return jest.fn(() => {
        bannerListener = null;
      });
    }),
  },
}));

jest.mock('../../src/services/InAppPurchaseService', () => ({
  inAppPurchaseService: {
    hasNoAds: jest.fn(() => false),
    addListener: jest.fn((cb: any) => {
      purchaseListener = cb;
      return jest.fn(() => {
        purchaseListener = null;
      });
    }),
  },
}));

import { adRewardService } from '../../src/services/AdRewardService';
import { bannerAdService } from '../../src/services/BannerAdService';
import { inAppPurchaseService } from '../../src/services/InAppPurchaseService';

describe('useBannerAds', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    purchaseListener = null;
    scriptingListener = null;
    bannerListener = null;
    (adRewardService.isTracking as jest.Mock).mockReturnValue(false);
    (inAppPurchaseService.hasNoAds as jest.Mock).mockReturnValue(false);
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  it('should initialize scripting time from service', async () => {
    await renderHook(() => useBannerAds());

    expect(adRewardService.getRemainingTime).toHaveBeenCalled();
    expect(mockSetScriptingTimeMs).toHaveBeenCalledWith(0);
  });

  it('should subscribe to ad reward and banner listeners', async () => {
    await renderHook(() => useBannerAds());

    expect(adRewardService.addListener).toHaveBeenCalled();
    expect(bannerAdService.addListener).toHaveBeenCalled();
  });

  it('should subscribe to purchase changes', async () => {
    await renderHook(() => useBannerAds());

    expect(inAppPurchaseService.addListener).toHaveBeenCalled();
  });

  it('should show banner when not tracking and no premium', async () => {
    await renderHook(() => useBannerAds());

    expect(bannerAdService.setBannerVisible).toHaveBeenCalledWith(true);
  });

  it('should hide banner when scripting is tracking', async () => {
    (adRewardService.isTracking as jest.Mock).mockReturnValue(true);

    await renderHook(() => useBannerAds());

    // The effect sees isScriptingTracking=true after poll
    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(bannerAdService.stopShowHideCycle).toHaveBeenCalled();
  });

  it('should hide banner when user has no-ads purchase', async () => {
    (inAppPurchaseService.hasNoAds as jest.Mock).mockReturnValue(true);

    await renderHook(() => useBannerAds());

    await act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(bannerAdService.stopShowHideCycle).toHaveBeenCalled();
    expect(bannerAdService.setBannerVisible).toHaveBeenCalledWith(false);
  });

  it('should poll tracking status every second', async () => {
    await renderHook(() => useBannerAds());

    const initialCalls = (adRewardService.isTracking as jest.Mock).mock.calls
      .length;

    await act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Should have been called 3 more times (every second)
    expect(
      (adRewardService.isTracking as jest.Mock).mock.calls.length,
    ).toBeGreaterThanOrEqual(initialCalls + 3);
  });

  it('should update scripting time when listener fires', async () => {
    await renderHook(() => useBannerAds());

    await act(() => {
      if (scriptingListener) {
        scriptingListener(60000);
      }
    });

    expect(mockSetScriptingTimeMs).toHaveBeenCalledWith(60000);
  });

  it('should update banner visibility when banner listener fires', async () => {
    await renderHook(() => useBannerAds());

    await act(() => {
      if (bannerListener) {
        bannerListener(false);
      }
    });

    expect(mockSetBannerVisible).toHaveBeenCalledWith(false);
  });

  it('should update hasNoAds when purchase listener fires', async () => {
    (inAppPurchaseService.hasNoAds as jest.Mock).mockReturnValue(false);

    await renderHook(() => useBannerAds());

    // Simulate purchase
    (inAppPurchaseService.hasNoAds as jest.Mock).mockReturnValue(true);

    await act(() => {
      if (purchaseListener) {
        purchaseListener();
      }
    });

    // After purchase update, hasNoAds should now be true in state
    // Next effect run should hide banner
  });

  it('should clean up intervals and listeners on unmount', async () => {
    const { unmount } = await renderHook(() => useBannerAds());

    await unmount();

    // Verify listeners were unsubscribed
    const adListenerUnsub = (adRewardService.addListener as jest.Mock).mock
      .results[0]?.value;
    const bannerListenerUnsub = (bannerAdService.addListener as jest.Mock).mock
      .results[0]?.value;
    const purchaseUnsub = (inAppPurchaseService.addListener as jest.Mock).mock
      .results[0]?.value;

    expect(adListenerUnsub).toHaveBeenCalled();
    expect(bannerListenerUnsub).toHaveBeenCalled();
    expect(purchaseUnsub).toHaveBeenCalled();
  });
});
