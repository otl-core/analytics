import type { StandardEventName } from "@otl-core/cms-types";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsProvider, useAnalytics } from "../src/analytics-context";
import { CMSDataLayer } from "../src/data-layer";

// We need to mock the dataLayer import to have a fresh instance per test
vi.mock("../src/data-layer", async () => {
  const actual =
    await vi.importActual<typeof import("../src/data-layer")>(
      "../src/data-layer",
    );
  return {
    ...actual,
    dataLayer: new actual.CMSDataLayer(),
  };
});

describe("AnalyticsProvider and useAnalytics", () => {
  let dataLayer: CMSDataLayer;

  beforeEach(async () => {
    const mod = await import("../src/data-layer");
    dataLayer = mod.dataLayer;
    // Clear entries from prior tests by replacing the entries array content
    dataLayer.entries.length = 0;
  });

  function wrapper({
    enabled,
    globalFormTracking,
    children,
  }: {
    enabled?: boolean;
    globalFormTracking?: boolean;
    children: React.ReactNode;
  }) {
    return (
      <AnalyticsProvider
        enabled={enabled}
        globalFormTracking={globalFormTracking}
      >
        {children}
      </AnalyticsProvider>
    );
  }

  it("should provide default context values", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    expect(result.current.enabled).toBe(true);
    expect(result.current.abnVariant).toBeNull();
    expect(result.current.globalFormTracking).toBe(false);
    expect(typeof result.current.trackEvent).toBe("function");
    expect(typeof result.current.setABnVariant).toBe("function");
  });

  it("should not push events when disabled", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ enabled: false, children }),
    });

    act(() => {
      result.current.trackEvent("page_view");
    });

    expect(dataLayer.entries).toHaveLength(0);
  });

  it("should push events to data layer when enabled", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ enabled: true, children }),
    });

    act(() => {
      result.current.trackEvent("page_view", {
        page_path: "/test",
      });
    });

    expect(dataLayer.entries).toHaveLength(1);
    expect(dataLayer.entries[0].event).toBe("page_view");
    expect(dataLayer.entries[0].page_path).toBe("/test");
    expect(typeof dataLayer.entries[0].timestamp).toBe("number");
  });

  it("should set and clear ABn variant context", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    expect(result.current.abnVariant).toBeNull();

    act(() => {
      result.current.setABnVariant({
        variantId: "variant-a",
        experimentId: "exp-123",
      });
    });

    expect(result.current.abnVariant).toEqual({
      variantId: "variant-a",
      experimentId: "exp-123",
    });

    act(() => {
      result.current.setABnVariant(null);
    });

    expect(result.current.abnVariant).toBeNull();
  });

  it("should include variant context in events when set", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      result.current.setABnVariant({
        variantId: "variant-b",
        experimentId: "exp-456",
      });
    });

    act(() => {
      result.current.trackEvent("page_view");
    });

    const lastEntry = dataLayer.entries[dataLayer.entries.length - 1];
    expect(lastEntry.abn_variant_id).toBe("variant-b");
    expect(lastEntry.abn_experiment_id).toBe("exp-456");
  });

  it("should not include variant context when not set", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      result.current.trackEvent("page_view");
    });

    const lastEntry = dataLayer.entries[dataLayer.entries.length - 1];
    expect(lastEntry.abn_variant_id).toBeUndefined();
    expect(lastEntry.abn_experiment_id).toBeUndefined();
  });

  it("should expose globalFormTracking flag", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) =>
        wrapper({ globalFormTracking: true, children }),
    });

    expect(result.current.globalFormTracking).toBe(true);
  });

  it("should allow user params to override variant params", () => {
    const { result } = renderHook(() => useAnalytics(), {
      wrapper: ({ children }) => wrapper({ children }),
    });

    act(() => {
      result.current.setABnVariant({
        variantId: "variant-a",
      });
    });

    act(() => {
      result.current.trackEvent("custom" as StandardEventName, {
        abn_variant_id: "override-value",
      });
    });

    const lastEntry = dataLayer.entries[dataLayer.entries.length - 1];
    expect(lastEntry.abn_variant_id).toBe("override-value");
  });
});
