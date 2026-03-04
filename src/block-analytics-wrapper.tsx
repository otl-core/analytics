"use client";

/**
 * Block Analytics Wrapper
 *
 * Wraps a block and adds click/visibility tracking based on BlockAnalyticsConfig.
 */

import { useCallback, useEffect, useRef } from "react";
import type { BlockAnalyticsConfig } from "@otl-core/cms-types";
import { dataLayer } from "./data-layer";

interface BlockAnalyticsWrapperProps {
  analyticsConfig: BlockAnalyticsConfig | undefined;
  blockId: string;
  blockType: string;
  children: React.ReactNode;
}

export function BlockAnalyticsWrapper({
  analyticsConfig,
  blockId,
  blockType,
  children,
}: BlockAnalyticsWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (!analyticsConfig || !analyticsConfig.enabled) {
    return <>{children}</>;
  }

  return (
    <BlockAnalyticsInner
      analyticsConfig={analyticsConfig}
      blockId={blockId}
      blockType={blockType}
      wrapperRef={wrapperRef}
    >
      {children}
    </BlockAnalyticsInner>
  );
}

interface BlockAnalyticsInnerProps {
  analyticsConfig: BlockAnalyticsConfig;
  blockId: string;
  blockType: string;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

function BlockAnalyticsInner({
  analyticsConfig,
  blockId,
  blockType,
  wrapperRef,
  children,
}: BlockAnalyticsInnerProps) {
  const {
    event_label,
    track_type,
    visibility_threshold = 50,
    fire_once = true,
    target_providers = "all",
    custom_params = {},
  } = analyticsConfig;

  const baseParams = {
    block_id: blockId,
    block_type: blockType,
    event_label,
    ...custom_params,
    ...(target_providers !== "all"
      ? { _target_providers: target_providers }
      : {}),
  };

  const handleClick = useCallback(() => {
    if (track_type === "click" || track_type === "both") {
      dataLayer.push({
        event: "block_click",
        timestamp: Date.now(),
        ...baseParams,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track_type, blockId, blockType, event_label]);

  useEffect(() => {
    if (track_type !== "visibility" && track_type !== "both") return;
    if (!wrapperRef.current) return;

    const threshold = Math.min(Math.max(visibility_threshold, 0), 100) / 100;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            dataLayer.push({
              event: "block_visible",
              timestamp: Date.now(),
              ...baseParams,
            });

            if (fire_once) {
              observer.disconnect();
            }
          }
        }
      },
      { threshold },
    );

    observer.observe(wrapperRef.current);

    return () => {
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    track_type,
    visibility_threshold,
    fire_once,
    blockId,
    blockType,
    event_label,
  ]);

  return (
    <div ref={wrapperRef} onClick={handleClick}>
      {children}
    </div>
  );
}
