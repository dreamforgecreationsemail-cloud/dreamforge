import { describe, expect, it } from "vitest";
import { calculatePrice, createResult, initialValues, isCoreMode, validateValues, WORKFLOWS } from "@/lib/workflows";
import { parseDrafts } from "@/components/workspace";

describe("Seven mode workflows", () => {
  it("keeps Kids Factory outside the seven core modes", () => { expect(Object.keys(WORKFLOWS)).toHaveLength(7); expect(isCoreMode("kids")).toBe(false); });
  for (const mode of Object.keys(WORKFLOWS)) {
    if (!isCoreMode(mode)) continue;
    it(`${mode} rejects empty required inputs and creates an output for real inputs`, () => {
      const values = initialValues(mode);
      expect(validateValues(mode, values)).toBeDefined();
      for (const f of WORKFLOWS[mode].fields) if (f.required) values[f.key] = f.type === "number" ? "10" : "My launch";
      expect(validateValues(mode, values)).toBeUndefined();
      expect(createResult(mode, values)).toContain("My launch");
    });
  }
  it("keeps Real Talk out of project next steps", () => {
    const result = createResult("brainstorm", { title: "Private", kind: "Real Talk (private)", idea: "Personal thought", next: "Invoice customer" });
    expect(result).toContain("Personal thought"); expect(result).not.toContain("Invoice customer");
  });
  it("preserves profit margin when a competitor cannot be undercut", () => {
    const result = calculatePrice(60, 40, 2, 80, 1);
    expect(result.price).toBe(100); expect(result.totalProfit).toBe(80); expect(result.canUndercut).toBe(false);
  });
  it("undercuts when the margin allows", () => {
    const result = calculatePrice(60, 40, 2, 120, 1);
    expect(result.price).toBe(119); expect(result.canUndercut).toBe(true); expect(result.revenue).toBe(238);
  });
  it("rejects an impossible 100 percent margin", () => { expect(() => calculatePrice(60, 100, 2)).toThrow(); });
  it("rejects fractional quantities", () => { expect(validateValues("money", { title: "Shirt", cost: "60", margin: "40", quantity: "1.5" })).toBeDefined(); });
  it("restores draft values and checklist progress", () => {
    const items = [{ id: "abc", mode: "marketing", values: { title: "Launch" }, result: "Post", completed: ["Publish manually"], updated: "2026-11-07" }];
    expect(parseDrafts(JSON.stringify(items))).toEqual(items);
  });
  it("rejects a backup with an unknown mode", () => { expect(() => parseDrafts('[{"id":"x","mode":"kids","values":{},"result":"x","updated":"today"}]')).toThrow(); });
});
