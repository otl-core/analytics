"use client";

/**
 * Section Analytics Wrapper
 *
 * Wraps a section and adds click/visibility tracking based on BlockAnalyticsConfig.
 */

import { useCallback, useEffect, useRef } from "react";
import type { BlockAnalyticsConfig } from "@otl-core/cms-types";
import { dataLayer } from "./data-layer";

interface SectionAnalyticsWrapperProps {
  analyticsConfig: BlockAnalyticsConfig | undefined;
  sectionId: string;
  sectionType: string;
  children: React.ReactNode;
}

export function SectionAnalyticsWrapper({
  analyticsConfig,
  sectionId,
  sectionType,
  children,
}: SectionAnalyticsWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (!analyticsConfig || !analyticsConfig.enabled) {
    return <>{children}</>;
  }

  return (
    <SectionAnalyticsInner
      analyticsConfig={analyticsConfig}
      sectionId={sectionId}
      sectionType={sectionType}
      wrapperRef={wrapperRef}
    >
      {children}
    </SectionAnalyticsInner>
  );
}

interface SectionAnalyticsInnerProps {
  analyticsConfig: BlockAnalyticsConfig;
  sectionId: string;
  sectionType: string;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

function SectionAnalyticsInner({
  analyticsConfig,
  sectionId,
  sectionType,
  wrapperRef,
  children,
}: SectionAnalyticsInnerProps) {
  const {
    event_label,
    track_type,
    visibility_threshold = 50,
    fire_once = true,
    target_providers = "all",
    custom_params = {},
  } = analyticsConfig;

  const baseParams = {
    section_id: sectionId,
    section_type: sectionType,
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
  }, [track_type, sectionId, sectionType, event_label]);

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
    sectionId,
    sectionType,
    event_label,
  ]);

  return (
    <div ref={wrapperRef} onClick={handleClick}>
      {children}
    </div>
  );
}
