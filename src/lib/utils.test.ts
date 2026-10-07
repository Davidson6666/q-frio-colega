import { describe, expect, it } from "vitest";
import { safeNextPath } from "./utils";

describe("safeNextPath", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/app/leads")).toBe("/app/leads");
    expect(safeNextPath("/app?x=1")).toBe("/app?x=1");
  });

  it("blocks absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil.com")).toBe("/app");
  });

  it("falls back for non-strings and empty values", () => {
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath(["/a"])).toBe("/app");
    expect(safeNextPath("")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)", "/x")).toBe("/x");
  });
});
