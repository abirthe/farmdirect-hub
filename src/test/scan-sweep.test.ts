import { describe, it, expect } from "vitest";
import tailwindConfig from "../../tailwind.config";

describe("Scan Sweep Keyframe Configuration", () => {
  it("should configure sweep keyframes to traverse the entire container without getting stuck", () => {
    const sweep = tailwindConfig.theme?.extend?.keyframes?.sweep as Record<string, Record<string, string>>;
    expect(sweep).toBeDefined();
    
    // Sweep must start before the left container boundary and reach/exit the right container boundary (100%)
    expect(sweep["0%"]).toHaveProperty("left", "0%");
    expect(sweep["0%"]).toHaveProperty("transform", "translateX(-100%)");
    expect(sweep["100%"]).toHaveProperty("left", "100%");
    expect(sweep["100%"]).toHaveProperty("transform", "translateX(0%)");
  });
});
