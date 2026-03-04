import type { StandardEventName } from "@otl-core/cms-types";

export interface DataLayerEntry {
  event: StandardEventName;
  timestamp: number;
  [key: string]: unknown;
}

export type DataLayerSubscriber = (entry: DataLayerEntry) => void;

export interface ABnVariantContext {
  /** The variant ID the user was assigned to. */
  variantId: string;
  /** A human-readable experiment name or the content ID being tested. */
  experimentId?: string;
}

export interface AnalyticsContextValue {
  /** Push an event to the data layer. Variant context (if set) is automatically merged. */
  trackEvent(event: StandardEventName, params?: Record<string, unknown>): void;
  /** Whether analytics is active (false in preview/draft mode). */
  enabled: boolean;
  /** The current A/B test variant context, if any. */
  abnVariant: ABnVariantContext | null;
  /** Set the A/B variant context. Called by ABnVariantSetter from page components. */
  setABnVariant(variant: ABnVariantContext | null): void;
  /** When true, ALL forms automatically track form_start, form_submit, and form_error regardless of per-form settings. */
  globalFormTracking: boolean;
}
