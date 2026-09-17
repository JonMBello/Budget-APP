import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "./manifest";

describe("Web App Manifest & Icon Assets", () => {
  it("returns standalone PWA configuration with valid icons", () => {
    const data = manifest();
    expect(data.name).toContain("Budget");
    expect(data.short_name).toBe("Budget");
    expect(data.display).toBe("standalone");
    expect(data.scope).toBe("/app/");
    expect(data.start_url).toBe("/app/");
    expect(data.icons).toBeDefined();
    expect(data.icons!.length).toBeGreaterThanOrEqual(2);

    const icon192 = data.icons!.find((i) => i.sizes === "192x192");
    const icon512 = data.icons!.find((i) => i.sizes === "512x512");
    expect(icon192).toBeDefined();
    expect(icon512).toBeDefined();
  });

  it("verifies all PWA and Apple Touch Icon image assets exist and contain non-trivial graphics", () => {
    const publicDir = resolve(__dirname, "../../public");
    const pngAssets = [
      { name: "apple-icon.png", minBytes: 5000, width: 180, height: 180 },
      { name: "apple-touch-icon.png", minBytes: 5000, width: 180, height: 180 },
      { name: "apple-touch-icon-precomposed.png", minBytes: 5000, width: 180, height: 180 },
      { name: "icon-192.png", minBytes: 5000, width: 192, height: 192 },
      { name: "icon-512.png", minBytes: 15000, width: 512, height: 512 },
    ];

    for (const asset of pngAssets) {
      const filePath = resolve(publicDir, asset.name);
      expect(existsSync(filePath)).toBe(true);

      const buf = readFileSync(filePath);
      // Valid PNG signature
      expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      // Must not be an empty 1-color placeholder (< 1KB)
      expect(buf.length).toBeGreaterThanOrEqual(asset.minBytes);

      // Verify IHDR chunk dimensions
      const ihdrW = buf.readUInt32BE(16);
      const ihdrH = buf.readUInt32BE(20);
      expect(ihdrW).toBe(asset.width);
      expect(ihdrH).toBe(asset.height);
    }

    // Vector SVG
    const svgPath = resolve(publicDir, "icon.svg");
    expect(existsSync(svgPath)).toBe(true);
    const svgContent = readFileSync(svgPath, "utf8");
    expect(svgContent).toContain("<svg");
    expect(svgContent).toContain("34d399"); // brand emerald green
  });
});
