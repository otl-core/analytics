"use client";

import { useEffect } from "react";
import type { StandardEventName } from "@otl-core/cms-types";
import { useAnalytics } from "./analytics-context";

interface ABnVariantSetterProps {
  variantId: string;
  experimentId?: string;
}

/**
 * A client component that page components render to communicate the
 * resolved A/B test variant to the analytics context.
 *
 * Renders nothing -- just sets context on mount and emits experiment_view.
 */
export function ABnVariantSetter({
  variantId,
  experimentId,
}: ABnVariantSetterProps) {
  const { setABnVariant, trackEvent } = useAnalytics();

  useEffect(() => {
    setABnVariant({ variantId, experimentId });
    trackEvent("experiment_view" as StandardEventName, {
      abn_variant_id: variantId,
      abn_experiment_id: experimentId,
    });
    return () => setABnVariant(null);
  }, [variantId, experimentId, setABnVariant, trackEvent]);

  return null;
}
