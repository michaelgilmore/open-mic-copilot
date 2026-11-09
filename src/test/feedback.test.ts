import { describe, expect, it } from "vitest";
import { feedbackSchema } from "@/lib/feedback";

describe("feedback submissions", () => {
  it("accepts a feature request", () => {
    expect(feedbackSchema.parse({ kind: "feature_request", subject: "Export", message: "Export my setlist" }).kind).toBe("feature_request");
  });
  it("accepts a bug report", () => {
    expect(feedbackSchema.parse({ kind: "bug_report", subject: "Scrolling", message: "Scrolling stopped" }).kind).toBe("bug_report");
  });
  it("rejects other submission categories", () => {
    expect(feedbackSchema.safeParse({ kind: "other", subject: "Test", message: "Test" }).success).toBe(false);
  });
  it("rejects blank details", () => {
    expect(feedbackSchema.safeParse({ kind: "bug_report", subject: "Bug", message: "  " }).success).toBe(false);
  });
});