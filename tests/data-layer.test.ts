import { beforeEach, describe, expect, it, vi } from "vitest";
import { CMSDataLayer } from "../src/data-layer";
import type { DataLayerEntry } from "../src/types";

describe("CMSDataLayer", () => {
  let dl: CMSDataLayer;

  beforeEach(() => {
    dl = new CMSDataLayer();
  });

  it("should start with empty entries", () => {
    expect(dl.entries).toEqual([]);
  });

  it("should push entries and store them", () => {
    const entry: DataLayerEntry = {
      event: "page_view",
      timestamp: Date.now(),
    };
    dl.push(entry);
    expect(dl.entries).toHaveLength(1);
    expect(dl.entries[0]).toBe(entry);
  });

  it("should notify subscribers on push", () => {
    const subscriber = vi.fn();
    dl.subscribe(subscriber);

    const entry: DataLayerEntry = {
      event: "page_view",
      timestamp: Date.now(),
    };
    dl.push(entry);

    // Called once for push (no replay since no prior entries at subscribe time)
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith(entry);
  });

  it("should replay existing entries to late subscribers", () => {
    const entry1: DataLayerEntry = {
      event: "page_view",
      timestamp: 1000,
    };
    const entry2: DataLayerEntry = {
      event: "scroll_depth",
      timestamp: 2000,
      percent: 50,
    };
    dl.push(entry1);
    dl.push(entry2);

    const lateSubscriber = vi.fn();
    dl.subscribe(lateSubscriber);

    // Should have received both replayed entries
    expect(lateSubscriber).toHaveBeenCalledTimes(2);
    expect(lateSubscriber).toHaveBeenCalledWith(entry1);
    expect(lateSubscriber).toHaveBeenCalledWith(entry2);
  });

  it("should notify multiple subscribers", () => {
    const sub1 = vi.fn();
    const sub2 = vi.fn();
    dl.subscribe(sub1);
    dl.subscribe(sub2);

    const entry: DataLayerEntry = {
      event: "form_submit",
      timestamp: Date.now(),
      form_id: "test-form",
    };
    dl.push(entry);

    expect(sub1).toHaveBeenCalledWith(entry);
    expect(sub2).toHaveBeenCalledWith(entry);
  });

  it("should unsubscribe correctly", () => {
    const subscriber = vi.fn();
    const unsub = dl.subscribe(subscriber);

    const entry1: DataLayerEntry = {
      event: "page_view",
      timestamp: 1000,
    };
    dl.push(entry1);
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsub();

    const entry2: DataLayerEntry = {
      event: "scroll_depth",
      timestamp: 2000,
    };
    dl.push(entry2);

    // Should not have been called again after unsubscribe
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("should not break if subscriber throws during push", () => {
    const badSubscriber = vi.fn(() => {
      throw new Error("subscriber error");
    });
    const goodSubscriber = vi.fn();

    dl.subscribe(badSubscriber);
    dl.subscribe(goodSubscriber);

    const entry: DataLayerEntry = {
      event: "page_view",
      timestamp: Date.now(),
    };

    // Should not throw
    expect(() => dl.push(entry)).not.toThrow();

    // Good subscriber should still have been called
    expect(goodSubscriber).toHaveBeenCalledWith(entry);
  });

  it("should not break if subscriber throws during replay", () => {
    const entry: DataLayerEntry = {
      event: "page_view",
      timestamp: Date.now(),
    };
    dl.push(entry);

    const badSubscriber = vi.fn(() => {
      throw new Error("replay error");
    });

    // Should not throw when subscribing with replay
    expect(() => dl.subscribe(badSubscriber)).not.toThrow();
  });

  it("should store entries with custom params", () => {
    const entry: DataLayerEntry = {
      event: "block_click",
      timestamp: Date.now(),
      block_id: "hero-cta",
      block_type: "button",
      event_label: "hero_click",
    };
    dl.push(entry);

    expect(dl.entries[0].block_id).toBe("hero-cta");
    expect(dl.entries[0].block_type).toBe("button");
    expect(dl.entries[0].event_label).toBe("hero_click");
  });

  it("should handle rapid sequential pushes", () => {
    const subscriber = vi.fn();
    dl.subscribe(subscriber);

    for (let i = 0; i < 100; i++) {
      dl.push({
        event: "page_view",
        timestamp: Date.now() + i,
        index: i,
      });
    }

    expect(dl.entries).toHaveLength(100);
    expect(subscriber).toHaveBeenCalledTimes(100);
  });
});
