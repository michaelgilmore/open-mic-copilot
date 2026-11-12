import { describe, expect, it } from "vitest";

import { setlistNavigation, type SetlistNavItem } from "@/lib/setlist-navigation";

const item = (id: string, title: string): SetlistNavItem => ({ id: `row-${id}`, song: { id, title } });

const items = [item("a", "Alpha"), item("b", "Beta"), item("c", "Gamma")];

describe("setlistNavigation", () => {
  it("returns the next song in setlist order", () => {
    const nav = setlistNavigation(items, "a");

    expect(nav).not.toBeNull();
    expect(nav?.index).toBe(0);
    expect(nav?.total).toBe(3);
    expect(nav?.next?.song?.title).toBe("Beta");
    expect(nav?.previous).toBeNull();
  });

  it("returns previous and next for a middle song", () => {
    const nav = setlistNavigation(items, "b");

    expect(nav?.previous?.song?.title).toBe("Alpha");
    expect(nav?.next?.song?.title).toBe("Gamma");
  });

  it("has no next song after the last one", () => {
    const nav = setlistNavigation(items, "c");

    expect(nav?.index).toBe(2);
    expect(nav?.next).toBeNull();
    expect(nav?.previous?.song?.title).toBe("Beta");
  });

  it("returns null when the song is not in the setlist", () => {
    expect(setlistNavigation(items, "missing")).toBeNull();
    expect(setlistNavigation([], "a")).toBeNull();
  });

  it("ignores rows whose song did not load", () => {
    const withGap: SetlistNavItem[] = [item("a", "Alpha"), { id: "row-x", song: null }, item("c", "Gamma")];
    const nav = setlistNavigation(withGap, "a");

    expect(nav?.total).toBe(2);
    expect(nav?.next?.song?.title).toBe("Gamma");
  });
});
