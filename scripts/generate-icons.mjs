import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

export const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111c30" />
      <stop offset="50%" stop-color="#0b1220" />
      <stop offset="100%" stop-color="#060a12" />
    </linearGradient>
    <radialGradient id="innerGlow" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.18" />
      <stop offset="60%" stop-color="#34d399" stop-opacity="0.02" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>
  </defs>
  <!-- Fully opaque background covering whole square (required for iOS home screen) -->
  <rect width="512" height="512" fill="url(#bg)" />
  <rect width="512" height="512" fill="url(#innerGlow)" />

  <!-- Subtle container ring giving visual depth -->
  <circle cx="256" cy="256" r="205" fill="#142235" fill-opacity="0.35" stroke="#2b3a50" stroke-opacity="0.4" stroke-width="3" />

  <!-- 'b.' glyph group (optically centered) -->
  <g>
    <!-- 'b' glyph: stem x=122 to 170, bowl x=170 to 342 -->
    <path d="M 122 142 L 170 142 L 170 221 C 187 200 212 190 242 190 C 298 190 342 231 342 289 C 342 347 298 388 242 388 C 212 388 187 378 170 357 L 170 383 L 122 383 Z M 232 235 C 201 235 175 259 175 289 C 175 319 201 343 232 343 C 263 343 289 319 289 289 C 289 259 263 235 232 235 Z" fill="#34d399" />
    <!-- '.' dot -->
    <circle cx="374" cy="365" r="18" fill="#f1f5f9" />
  </g>
</svg>
`;

async function generate() {
  const svgBuffer = Buffer.from(svgIcon);

  // 1. Write master SVG to public/icon.svg
  await writeFile(resolve(publicDir, "icon.svg"), svgIcon, "utf8");
  console.log("✓ Generated public/icon.svg");

  // 2. Configurations for PNG outputs
  const targets = [
    { file: "apple-icon.png", size: 180 },
    { file: "apple-touch-icon.png", size: 180 },
    { file: "apple-touch-icon-precomposed.png", size: 180 },
    { file: "icon-192.png", size: 192 },
    { file: "icon-512.png", size: 512 },
  ];

  for (const target of targets) {
    const dest = resolve(publicDir, target.file);
    await sharp(svgBuffer)
      .resize(target.size, target.size)
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`✓ Generated public/${target.file} (${target.size}x${target.size})`);
  }

  console.log("All icons generated successfully!");
}

generate().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
