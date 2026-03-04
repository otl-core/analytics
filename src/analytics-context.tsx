"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { StandardEventName } from "@otl-core/cms-types";
import type { ABnVariantContext, AnalyticsContextValue } from "./types";
import { dataLayer } from "./data-layer";

const AnalyticsContext = createContext<AnalyticsContextValue>({
  trackEvent: () => {},
  enabled: false,
  abnVariant: null,
  setABnVariant: () => {},
  globalFormTracking: false,
});

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  enabled?: boolean;
  /** When true, all forms automatically emit form_start, form_submit, form_error. */
  globalFormTracking?: boolean;
  children: React.ReactNode;
}

export function AnalyticsProvider({
  enabled = true,
  globalFormTracking = false,
  children,
}: AnalyticsProviderProps) {
  const [abnVariant, setABnVariant] = useState<ABnVariantContext | null>(null);

  const trackEvent = useCallback(
    (event: StandardEventName, params?: Record<string, unknown>) => {
      if (!enabled) return;
      const variantParams: Record<string, unknown> = {};
      if (abnVariant) {
        variantParams.abn_variant_id = abnVariant.variantId;
        if (abnVariant.experimentId) {
          variantParams.abn_experiment_id = abnVariant.experimentId;
        }
      }
      dataLayer.push({
        event,
        timestamp: Date.now(),
        ...variantParams,
        ...params,
      });
    },
    [enabled, abnVariant],
  );

  const value = useMemo<AnalyticsContextValue>(
    () => ({
      trackEvent,
      enabled,
      abnVariant,
      setABnVariant,
      globalFormTracking,
    }),
    [trackEvent, enabled, abnVariant, globalFormTracking],
  );

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
