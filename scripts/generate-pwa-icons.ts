/**
 * Generate PWA icons from the apple-icon.svg source.
 * Run with: npm run generate:icons
 *
 * Produces:
 *   public/icons/icon-192.png
 *   public/icons/icon-512.png
 *   public/icons/icon-maskable-192.png
 *   public/icons/icon-maskable-512.png
 */

import sharp from "sharp";
import path from "path";
import fs from "fs";

const SOURCE_SVG = path.resolve(__dirname, "../src/app/apple-icon.svg");
const OUTPUT_DIR = path.resolve(__dirname, "../public/icons");

const SIZES = [192, 512] as const;

// Maskable icons need a safe zone — the inner 80% is the visible area.
// We add padding so the icon content stays within the safe zone.
const MASKABLE_PADDING_RATIO = 0.1; // 10% padding on each side

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(SOURCE_SVG);

  for (const size of SIZES) {
    // Standard icon — render SVG at target size
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-${size}.png`));

    console.log(`Created icon-${size}.png`);

    // Maskable icon — render SVG smaller and center on background
    const padding = Math.round(size * MASKABLE_PADDING_RATIO);
    const innerSize = size - padding * 2;

    const innerSvg = await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 26, g: 31, b: 78, alpha: 1 }, // #1a1f4e
      },
    })
      .composite([{ input: innerSvg, left: padding, top: padding }])
      .png()
      .toFile(path.join(OUTPUT_DIR, `icon-maskable-${size}.png`));

    console.log(`Created icon-maskable-${size}.png`);
  }

  console.log("\nAll PWA icons generated in public/icons/");
}

generateIcons().catch((error) => {
  console.error("Failed to generate icons:", error);
  process.exit(1);
});
