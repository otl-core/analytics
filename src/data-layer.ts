/**
 * CMS Data Layer
 *
 * Central event bus for analytics events. All events flow through here.
 * Provider adapters subscribe and translate events to provider-specific calls.
 */

import type { DataLayerEntry, DataLayerSubscriber } from "./types";

declare global {
  interface Window {
    __cms?: CMSDataLayer;
  }
}

export class CMSDataLayer {
  readonly entries: DataLayerEntry[] = [];
  private readonly subscribers = new Set<DataLayerSubscriber>();

  push(entry: DataLayerEntry): void {
    this.entries.push(entry);
    for (const fn of this.subscribers) {
      try {
        fn(entry);
      } catch {
        // Swallow subscriber errors to prevent cascade failures
      }
    }
  }

  subscribe(fn: DataLayerSubscriber): () => void {
    for (const entry of this.entries) {
      try {
        fn(entry);
      } catch {
        // Swallow replay errors
      }
    }
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }
}

export const dataLayer = new CMSDataLayer();

if (typeof window !== "undefined") {
  window.__cms = dataLayer;
}
